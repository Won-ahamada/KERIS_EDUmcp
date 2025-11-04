/**
 * MCP Tool Registry
 *
 * Provider의 Endpoint를 MCP Tool로 자동 등록
 */
import type { ProviderSpec } from '../types/index.js';
interface ExecutableProvider {
    id: string;
    name: string;
    version: string;
    endpoints: Map<string, any>;
    executeEndpoint: (endpointId: string, params: Record<string, any>) => Promise<any>;
}
interface MCPTool {
    name: string;
    description: string;
    inputSchema: {
        type: 'object';
        properties: Record<string, any>;
        required: string[];
    };
    handler: (args: Record<string, any>) => Promise<any>;
}
export declare class ToolRegistry {
    private tools;
    private providers;
    /**
     * Provider 등록 및 Tools 자동 생성
     */
    registerProvider(provider: ExecutableProvider, spec: ProviderSpec): void;
    /**
     * Endpoint를 MCP Tool로 등록
     */
    private registerEndpointTools;
    /**
     * Custom Tool 정의 등록 (여러 Endpoint 조합)
     */
    private registerCustomTools;
    /**
     * Custom Tool 실행 (여러 Endpoint 조합)
     */
    private executeCustomTool;
    /**
     * Tool 설명 생성
     */
    private createToolDescription;
    /**
     * Input Schema 생성 (JSON Schema 형식)
     */
    private createInputSchema;
    /**
     * 모든 등록된 Tool 가져오기
     */
    getAllTools(): MCPTool[];
    /**
     * 특정 Tool 가져오기
     */
    getTool(name: string): MCPTool | undefined;
    /**
     * Tool 실행
     */
    executeTool(name: string, args: Record<string, any>): Promise<any>;
    /**
     * Tool 목록 조회 (MCP ListTools 응답 형식)
     */
    listTools(): Array<{
        name: string;
        description: string;
        inputSchema: any;
    }>;
    /**
     * Provider별 Tool 목록
     */
    getToolsByProvider(providerId: string): MCPTool[];
    /**
     * 통계 정보
     */
    getStats(): {
        totalTools: number;
        totalProviders: number;
        toolsByProvider: Record<string, number>;
    };
}
export {};
//# sourceMappingURL=tool-registry.d.ts.map