/**
 * Provider Factory
 *
 * ProviderSpec으로부터 실행 가능한 Provider 인스턴스를 생성
 */

import type {
  ProviderSpec,
  Endpoint,
  Parameter,
  ApiResponse
} from '../types/index.js';
import {
  ErrorCode,
  ValidationError,
  ApiError,
  httpStatusToErrorCode,
} from '../lib/errors.js';
import { CacheFactory, CacheKeyBuilder, type Cache } from '../lib/cache.js';
import { LoggerFactory } from '../lib/logger.js';
import { ParameterValidator } from '../lib/validator.js';

interface ExecutableEndpoint extends Endpoint {
  execute: (params: Record<string, any>) => Promise<ApiResponse>;
}

interface ExecutableProvider {
  id: string;
  name: string;
  version: string;
  endpoints: Map<string, ExecutableEndpoint>;
  getEndpoint: (id: string) => ExecutableEndpoint | undefined;
  executeEndpoint: (endpointId: string, params: Record<string, any>) => Promise<ApiResponse>;
}

export class ProviderFactory {
  private static cache: Cache = CacheFactory.getInstance('api', {
    max: 1000,
    ttl: 3600000, // 1시간 기본 TTL
  });
  private static logger = LoggerFactory.getLogger('provider-factory');

  /**
   * ProviderSpec으로부터 실행 가능한 Provider 생성
   */
  static createProvider(spec: ProviderSpec): ExecutableProvider {
    const { provider, commonParameters, endpointGroups, endpoints } = spec;

    this.logger.info('Creating provider', {
      providerId: provider.id,
      providerName: provider.name,
      version: provider.version,
    });

    // Endpoint Map 생성
    const endpointMap = new Map<string, ExecutableEndpoint>();

    // endpointGroups에서 endpoints 추출
    if (endpointGroups) {
      for (const [_groupName, group] of Object.entries(endpointGroups)) {
        for (const endpointDef of group.endpoints) {
          const fullEndpoint = this.createExecutableEndpoint(
            provider,
            endpointDef,
            commonParameters,
            {
              requiresYear: group.requiresYear,
              cacheTtl: group.cacheTtl,
            }
          );

          endpointMap.set(fullEndpoint.id, fullEndpoint);
        }
      }
    }

    // 단독 endpoints 처리
    if (endpoints) {
      for (const endpointDef of endpoints) {
        const fullEndpoint = this.createExecutableEndpoint(
          provider,
          endpointDef,
          commonParameters
        );

        endpointMap.set(fullEndpoint.id, fullEndpoint);
      }
    }

    this.logger.info('Provider created successfully', {
      providerId: provider.id,
      endpointCount: endpointMap.size,
    });

    // ExecutableProvider 반환
    return {
      id: provider.id,
      name: provider.name,
      version: provider.version,
      endpoints: endpointMap,

      getEndpoint(id: string) {
        return endpointMap.get(id);
      },

      async executeEndpoint(endpointId: string, params: Record<string, any>) {
        const endpoint = endpointMap.get(endpointId);

        if (!endpoint) {
          const error = new ValidationError(
            `Endpoint '${endpointId}' not found in provider '${provider.name}'`,
            ErrorCode.ENDPOINT_NOT_FOUND,
            { providerId: provider.id, endpointId }
          );

          return {
            success: false,
            error: {
              code: error.code,
              message: error.getUserMessage(),
            },
          };
        }

        return endpoint.execute(params);
      },
    };
  }

  /**
   * Endpoint 정의로부터 실행 가능한 Endpoint 생성
   */
  private static createExecutableEndpoint(
    provider: any,
    endpointDef: Endpoint,
    commonParameters?: { required?: Parameter[]; optional?: Parameter[]; timeSeries?: Parameter[] },
    groupConfig?: { requiresYear?: boolean; cacheTtl?: number }
  ): ExecutableEndpoint {
    // 파라미터 조합: common + endpoint-specific
    const allParameters: Parameter[] = [];

    if (commonParameters) {
      if (commonParameters.required) {
        allParameters.push(...commonParameters.required);
      }
      if (commonParameters.optional) {
        allParameters.push(...commonParameters.optional);
      }
      if (commonParameters.timeSeries) {
        allParameters.push(...commonParameters.timeSeries);
      }
    }

    // Endpoint별 추가 파라미터
    if (endpointDef.parameters) {
      allParameters.push(...endpointDef.parameters);
    }

    // Group 설정 반영
    const requiresYear = groupConfig?.requiresYear ?? endpointDef.requiresYear ?? false;
    const cacheTtl = groupConfig?.cacheTtl ?? endpointDef.cacheTtl ?? 3600;

    // Execute 함수 생성
    const execute = async (params: Record<string, any>): Promise<ApiResponse> => {
      try {
        // 1. 파라미터 검증
        const validation = ParameterValidator.validate(allParameters, params);
        if (!validation.valid) {
          this.logger.warn('Parameter validation failed', {
            endpointId: endpointDef.id,
            errors: validation.errors,
          });

          const error = new ValidationError(
            validation.errors.map(e => e.message).join(', '),
            ErrorCode.INVALID_PARAMETERS,
            {
              endpointId: endpointDef.id,
              validationErrors: validation.errors,
            }
          );

          return {
            success: false,
            error: {
              code: error.code,
              message: error.getUserMessage(),
            },
          };
        }

        // 2. apiType 파라미터 주입 (학교알리미 같은 경우)
        if (endpointDef.apiType) {
          params.apiType = endpointDef.apiType;
        }

        // 3. URL 생성
        const url = this.buildUrl(provider.baseUrl, params, provider.method);

        this.logger.logApiRequest(provider.id, endpointDef.id, params);
        this.logger.debug('API request URL', { url });

        // 4. 캐시 키 생성
        const cacheKey = CacheKeyBuilder.forApiRequest(
          provider.id,
          endpointDef.id,
          params
        );

        // 5. 캐시 조회
        const cached = await this.cache.get(cacheKey);
        if (cached !== undefined) {
          return {
            success: true,
            data: cached,
          };
        }

        // 6. HTTP 요청
        const response = await this.makeRequest(
          url,
          provider.method,
          params,
          provider.dataFormat,
          provider.authentication
        );

        // 7. 성공 시 캐시 저장
        if (response.success && response.data) {
          await this.cache.set(cacheKey, response.data, cacheTtl);
        }

        return response;
      } catch (error: unknown) {
        this.logger.error(
          'Endpoint execution failed',
          error instanceof Error ? error : undefined,
          { endpointId: endpointDef.id }
        );

        const mcpError = error instanceof Error
          ? new ApiError(
              error.message,
              ErrorCode.ENDPOINT_EXECUTION_FAILED,
              {
                endpointId: endpointDef.id,
                originalError: error.name,
              }
            )
          : new ApiError(
              'Unknown execution error',
              ErrorCode.ENDPOINT_EXECUTION_FAILED,
              { endpointId: endpointDef.id }
            );

        return {
          success: false,
          error: {
            code: mcpError.code,
            message: mcpError.getUserMessage(),
          },
        };
      }
    };

    return {
      ...endpointDef,
      parameters: allParameters,
      requiresYear,
      cacheTtl,
      execute,
    };
  }


  /**
   * URL 생성
   */
  private static buildUrl(
    baseUrl: string,
    params: Record<string, any>,
    method: string
  ): string {
    if (method === 'GET') {
      const queryString = new URLSearchParams(params).toString();
      return `${baseUrl}?${queryString}`;
    }

    return baseUrl;
  }

  /**
   * HTTP 요청 실행
   */
  private static async makeRequest(
    url: string,
    method: string,
    params: Record<string, any>,
    dataFormat: 'JSON' | 'XML',
    authentication?: { type: string; parameterName: string; location: string }
  ): Promise<ApiResponse> {
    try {
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': dataFormat === 'JSON' ? 'application/json' : 'application/xml',
        },
      };

      // Authentication 헤더 추가
      if (authentication && authentication.location === 'header') {
        options.headers = {
          ...options.headers,
          [authentication.parameterName]: params[authentication.parameterName] || '',
        };
      }

      // POST 요청시 body 설정
      if (method === 'POST') {
        options.body = dataFormat === 'JSON'
          ? JSON.stringify(params)
          : this.convertToXML(params);
      }

      const response = await fetch(url, options);

      if (!response.ok) {
        const errorCode = httpStatusToErrorCode(response.status);
        throw new ApiError(
          `HTTP ${response.status}: ${response.statusText}`,
          errorCode,
          { url, statusCode: response.status }
        );
      }

      // 응답 파싱
      const contentType = response.headers.get('content-type') || '';
      let data: any;

      if (contentType.includes('application/json')) {
        data = await response.json();
      } else if (contentType.includes('application/xml') || contentType.includes('text/xml')) {
        const text = await response.text();
        data = { xml: text }; // XML 파싱은 추후 구현
      } else {
        data = await response.text();
      }

      return {
        success: true,
        data,
      };
    } catch (error: unknown) {
      const mcpError = error instanceof ApiError
        ? error
        : error instanceof Error
        ? new ApiError(error.message, ErrorCode.HTTP_ERROR, { url })
        : new ApiError('Unknown HTTP error', ErrorCode.HTTP_ERROR, { url });

      return {
        success: false,
        error: {
          code: mcpError.code,
          message: mcpError.getUserMessage(),
        },
      };
    }
  }

  /**
   * JSON을 XML로 변환 (간단한 구현)
   */
  private static convertToXML(obj: Record<string, any>): string {
    const entries = Object.entries(obj);
    const xmlParts = entries.map(([key, value]) => `<${key}>${value}</${key}>`);
    return `<request>${xmlParts.join('')}</request>`;
  }

  /**
   * 모든 Provider 생성
   */
  static createProviders(specs: ProviderSpec[]): ExecutableProvider[] {
    this.logger.info('Creating providers', { count: specs.length });

    const providers = specs.map(spec => this.createProvider(spec));

    this.logger.info('All providers created successfully', { count: providers.length });

    return providers;
  }

  /**
   * 캐시 통계 조회
   */
  static async getCacheStats() {
    return await this.cache.stats();
  }

  /**
   * 캐시 초기화
   */
  static async clearCache() {
    await this.cache.clear();
  }

  /**
   * 특정 패턴의 캐시 삭제
   */
  static async invalidateCache(pattern: RegExp) {
    if ('deletePattern' in this.cache) {
      return await (this.cache as any).deletePattern(pattern);
    }
    return 0;
  }
}
