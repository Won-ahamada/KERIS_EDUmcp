/**
 * MCP Server Core
 *
 * MCP 프로토콜을 구현하고 Provider들을 관리
 */
import { ToolRegistry } from './tool-registry.js';
export declare class MCPServer {
    private server;
    private registry;
    private providersDir;
    constructor(providersDir?: string);
    /**
     * MCP 핸들러 설정
     */
    private setupHandlers;
    /**
     * Provider 폴더에서 모든 TOON 파일 로드 및 등록
     */
    loadProviders(): Promise<void>;
    /**
     * 서버 시작
     */
    start(): Promise<void>;
    /**
     * 서버 종료
     */
    stop(): Promise<void>;
    /**
     * Registry 접근 (테스트/디버깅용)
     */
    getRegistry(): ToolRegistry;
}
//# sourceMappingURL=mcp-server.d.ts.map