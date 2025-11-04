/**
 * Provider 로더
 *
 * providers/ 폴더를 스캔하여 모든 .toon 파일을 자동 로드
 */
import type { ProviderSpec } from '../types/index.js';
export declare class ProviderLoader {
    private parser;
    private providersDir;
    constructor(providersDir?: string);
    /**
     * providers 폴더에서 모든 .toon 파일 찾기
     */
    findProviderFiles(): Promise<string[]>;
    /**
     * 단일 TOON 파일 로드 및 파싱
     */
    loadProviderFile(filePath: string): Promise<ProviderSpec>;
    /**
     * 모든 Provider 파일 로드
     */
    loadAllProviders(): Promise<ProviderSpec[]>;
    /**
     * TOON 파싱 결과를 ProviderSpec으로 변환
     */
    private convertToProviderSpec;
    /**
     * 파라미터 배열 변환
     */
    private convertParameters;
    /**
     * Endpoint 배열 변환
     */
    private convertEndpoints;
}
//# sourceMappingURL=provider-loader.d.ts.map