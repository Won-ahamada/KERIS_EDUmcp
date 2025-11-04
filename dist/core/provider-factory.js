/**
 * Provider Factory
 *
 * ProviderSpec으로부터 실행 가능한 Provider 인스턴스를 생성
 */
export class ProviderFactory {
    /**
     * ProviderSpec으로부터 실행 가능한 Provider 생성
     */
    static createProvider(spec) {
        const { provider, commonParameters, endpointGroups, endpoints } = spec;
        console.log(`🏭 Creating provider: ${provider.name} v${provider.version}`);
        // Endpoint Map 생성
        const endpointMap = new Map();
        // endpointGroups에서 endpoints 추출
        if (endpointGroups) {
            for (const [_groupName, group] of Object.entries(endpointGroups)) {
                for (const endpointDef of group.endpoints) {
                    const fullEndpoint = this.createExecutableEndpoint(provider, endpointDef, commonParameters, {
                        requiresYear: group.requiresYear,
                        cacheTtl: group.cacheTtl,
                    });
                    endpointMap.set(fullEndpoint.id, fullEndpoint);
                }
            }
        }
        // 단독 endpoints 처리
        if (endpoints) {
            for (const endpointDef of endpoints) {
                const fullEndpoint = this.createExecutableEndpoint(provider, endpointDef, commonParameters);
                endpointMap.set(fullEndpoint.id, fullEndpoint);
            }
        }
        console.log(`✅ Created ${endpointMap.size} endpoint(s) for ${provider.name}`);
        // ExecutableProvider 반환
        return {
            id: provider.id,
            name: provider.name,
            version: provider.version,
            endpoints: endpointMap,
            getEndpoint(id) {
                return endpointMap.get(id);
            },
            async executeEndpoint(endpointId, params) {
                const endpoint = endpointMap.get(endpointId);
                if (!endpoint) {
                    return {
                        success: false,
                        error: {
                            code: 'ENDPOINT_NOT_FOUND',
                            message: `Endpoint '${endpointId}' not found in provider '${provider.name}'`,
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
    static createExecutableEndpoint(provider, endpointDef, commonParameters, groupConfig) {
        // 파라미터 조합: common + endpoint-specific
        const allParameters = [];
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
        const execute = async (params) => {
            try {
                // 1. 파라미터 검증
                const validation = this.validateParameters(allParameters, params);
                if (!validation.valid) {
                    return {
                        success: false,
                        error: {
                            code: 'INVALID_PARAMETERS',
                            message: validation.error || 'Invalid parameters',
                        },
                    };
                }
                // 2. apiType 파라미터 주입 (학교알리미 같은 경우)
                if (endpointDef.apiType) {
                    params.apiType = endpointDef.apiType;
                }
                // 3. URL 생성
                const url = this.buildUrl(provider.baseUrl, params, provider.method);
                console.log(`🌐 Calling ${endpointDef.name} (${endpointDef.id})`);
                console.log(`   URL: ${url}`);
                // 4. HTTP 요청
                const response = await this.makeRequest(url, provider.method, params, provider.dataFormat, provider.authentication);
                return response;
            }
            catch (error) {
                console.error(`❌ Error executing ${endpointDef.id}:`, error.message);
                return {
                    success: false,
                    error: {
                        code: 'EXECUTION_ERROR',
                        message: error.message,
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
     * 파라미터 검증
     */
    static validateParameters(schema, params) {
        // Required 파라미터 체크
        for (const param of schema) {
            if (param.required && !(param.name in params)) {
                return {
                    valid: false,
                    error: `Required parameter '${param.name}' is missing`,
                };
            }
        }
        // Enum 체크
        for (const param of schema) {
            if (param.enum && params[param.name]) {
                if (!param.enum.includes(String(params[param.name]))) {
                    return {
                        valid: false,
                        error: `Parameter '${param.name}' must be one of: ${param.enum.join(', ')}`,
                    };
                }
            }
        }
        return { valid: true };
    }
    /**
     * URL 생성
     */
    static buildUrl(baseUrl, params, method) {
        if (method === 'GET') {
            const queryString = new URLSearchParams(params).toString();
            return `${baseUrl}?${queryString}`;
        }
        return baseUrl;
    }
    /**
     * HTTP 요청 실행
     */
    static async makeRequest(url, method, params, dataFormat, authentication) {
        try {
            const options = {
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
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            // 응답 파싱
            const contentType = response.headers.get('content-type') || '';
            let data;
            if (contentType.includes('application/json')) {
                data = await response.json();
            }
            else if (contentType.includes('application/xml') || contentType.includes('text/xml')) {
                const text = await response.text();
                data = { xml: text }; // XML 파싱은 추후 구현
            }
            else {
                data = await response.text();
            }
            return {
                success: true,
                data,
            };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: 'HTTP_ERROR',
                    message: error.message,
                },
            };
        }
    }
    /**
     * JSON을 XML로 변환 (간단한 구현)
     */
    static convertToXML(obj) {
        const entries = Object.entries(obj);
        const xmlParts = entries.map(([key, value]) => `<${key}>${value}</${key}>`);
        return `<request>${xmlParts.join('')}</request>`;
    }
    /**
     * 모든 Provider 생성
     */
    static createProviders(specs) {
        console.log(`\n🏭 Creating ${specs.length} provider(s)...\n`);
        const providers = specs.map(spec => this.createProvider(spec));
        console.log(`\n✅ Successfully created ${providers.length} provider(s)\n`);
        return providers;
    }
}
//# sourceMappingURL=provider-factory.js.map