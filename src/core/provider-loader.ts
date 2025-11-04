/**
 * Provider 로더
 *
 * providers/ 폴더를 스캔하여 모든 .toon 파일을 자동 로드
 */

import { readdir, readFile } from 'fs/promises';
import { join, basename } from 'path';
import { ToonParser } from '../lib/toon-parser.js';
import type { ProviderSpec, ToonParseResult } from '../types/index.js';

export class ProviderLoader {
  private parser: ToonParser;
  private providersDir: string;

  constructor(providersDir: string = './providers') {
    this.parser = new ToonParser();
    this.providersDir = providersDir;
  }

  /**
   * providers 폴더에서 모든 .toon 파일 찾기
   */
  async findProviderFiles(): Promise<string[]> {
    try {
      const files = await readdir(this.providersDir);
      return files
        .filter(file => file.endsWith('.toon'))
        .map(file => join(this.providersDir, file));
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        console.warn(`⚠️  Providers directory not found: ${this.providersDir}`);
        return [];
      }
      throw error;
    }
  }

  /**
   * 단일 TOON 파일 로드 및 파싱
   */
  async loadProviderFile(filePath: string): Promise<ProviderSpec> {
    console.log(`📄 Loading provider: ${basename(filePath)}`);

    const content = await readFile(filePath, 'utf-8');
    const parsed = this.parser.parse(content);

    return this.convertToProviderSpec(parsed, basename(filePath, '.toon'));
  }

  /**
   * 모든 Provider 파일 로드
   */
  async loadAllProviders(): Promise<ProviderSpec[]> {
    const files = await this.findProviderFiles();

    if (files.length === 0) {
      console.warn('⚠️  No provider files found in:', this.providersDir);
      return [];
    }

    console.log(`📦 Found ${files.length} provider(s)`);

    const providers = await Promise.all(
      files.map(file => this.loadProviderFile(file))
    );

    return providers;
  }

  /**
   * TOON 파싱 결과를 ProviderSpec으로 변환
   */
  private convertToProviderSpec(
    parsed: ToonParseResult,
    fallbackId: string
  ): ProviderSpec {
    // Provider 메타데이터 추출
    const providerData = parsed.provider?.[0] || {};

    const spec: ProviderSpec = {
      provider: {
        id: providerData.id || fallbackId,
        name: providerData.name || fallbackId,
        version: providerData.version || '1.0.0',
        baseUrl: providerData.baseUrl || '',
        method: providerData.method || 'GET',
        dataFormat: providerData.dataFormat || 'JSON',
      },
    };

    // 인증 정보
    if (parsed.authentication) {
      const auth = parsed.authentication[0];
      spec.provider.authentication = {
        type: auth.type,
        parameterName: auth.parameterName,
        location: auth.location,
      };
    }

    // 공통 파라미터
    if (parsed['commonParameters.required'] ||
        parsed['commonParameters.optional'] ||
        parsed['commonParameters.timeSeries']) {

      spec.commonParameters = {
        required: this.convertParameters(parsed['commonParameters.required']),
        optional: this.convertParameters(parsed['commonParameters.optional']),
        timeSeries: this.convertParameters(parsed['commonParameters.timeSeries']),
      };
    }

    // Endpoint 그룹
    const endpointGroups: Record<string, any> = {};

    for (const [key, value] of Object.entries(parsed)) {
      if (key.startsWith('endpoints.')) {
        const groupName = key.replace('endpoints.', '');

        // 그룹 메타데이터 찾기
        const groupMeta = parsed.endpointGroups?.find(
          (g: any) => g.groupId === groupName
        );

        endpointGroups[groupName] = {
          description: groupMeta?.description || '',
          requiresYear: groupMeta?.requiresYear === 'true' || groupMeta?.requiresYear === true,
          cacheTtl: parseInt(groupMeta?.cacheTtl || '3600'),
          endpoints: this.convertEndpoints(value as any[]),
        };
      }
    }

    if (Object.keys(endpointGroups).length > 0) {
      spec.endpointGroups = endpointGroups;
    }

    // 단일 endpoints (그룹 없는 경우)
    if (parsed.endpoints && !spec.endpointGroups) {
      spec.endpoints = this.convertEndpoints(parsed.endpoints);
    }

    // Tools
    if (parsed.tools) {
      spec.tools = parsed.tools.map((tool: any) => ({
        name: tool.name,
        description: tool.description,
        category: tool.category || 'general',
        inputSchema: {}, // 추후 구현
        usesEndpoints: tool.usesEndpoints?.split(',').map((s: string) => s.trim()) || [],
      }));
    }

    return spec;
  }

  /**
   * 파라미터 배열 변환
   */
  private convertParameters(data: any[]): any[] {
    if (!data) return [];

    return data.map(param => ({
      name: param.name,
      type: param.type,
      required: param.required === 'true' || param.required === true,
      description: param.description,
      enum: param.enum?.split('|'),
      default: param.default,
      example: param.example,
    }));
  }

  /**
   * Endpoint 배열 변환
   */
  private convertEndpoints(data: any[]): any[] {
    if (!data) return [];

    return data.map(ep => ({
      id: ep.id,
      apiType: ep.apiType,
      name: ep.name,
      category: ep.category,
      description: ep.description,
      schoolTypes: ep.schoolTypes?.split(',').map((s: string) => s.trim()),
      parameters: [], // Factory에서 조합
    }));
  }
}
