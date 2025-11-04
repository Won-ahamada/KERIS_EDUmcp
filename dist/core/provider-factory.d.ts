/**
 * Provider Factory
 *
 * ProviderSpec으로부터 실행 가능한 Provider 인스턴스를 생성
 */
import type { ProviderSpec, Endpoint, ApiResponse } from '../types/index.js';
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
export declare class ProviderFactory {
    /**
     * ProviderSpec으로부터 실행 가능한 Provider 생성
     */
    static createProvider(spec: ProviderSpec): ExecutableProvider;
    /**
     * Endpoint 정의로부터 실행 가능한 Endpoint 생성
     */
    private static createExecutableEndpoint;
    /**
     * 파라미터 검증
     */
    private static validateParameters;
    /**
     * URL 생성
     */
    private static buildUrl;
    /**
     * HTTP 요청 실행
     */
    private static makeRequest;
    /**
     * JSON을 XML로 변환 (간단한 구현)
     */
    private static convertToXML;
    /**
     * 모든 Provider 생성
     */
    static createProviders(specs: ProviderSpec[]): ExecutableProvider[];
}
export {};
//# sourceMappingURL=provider-factory.d.ts.map