/**
 * MCP Server Core
 *
 * MCP 프로토콜을 구현하고 Provider들을 관리
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { ProviderLoader } from './provider-loader.js';
import { ProviderFactory } from './provider-factory.js';
import { ToolRegistry } from './tool-registry.js';
export class MCPServer {
    server;
    registry;
    providersDir;
    constructor(providersDir = './providers') {
        this.providersDir = providersDir;
        this.registry = new ToolRegistry();
        // MCP Server 초기화
        this.server = new Server({
            name: 'edu-api-mcp-server',
            version: '1.0.0',
        }, {
            capabilities: {
                tools: {},
            },
        });
        this.setupHandlers();
    }
    /**
     * MCP 핸들러 설정
     */
    setupHandlers() {
        // ListTools 핸들러
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            const tools = this.registry.listTools();
            return {
                tools,
            };
        });
        // CallTool 핸들러
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            console.log(`\n🔧 Tool called: ${name}`);
            console.log(`   Arguments:`, JSON.stringify(args, null, 2));
            const result = await this.registry.executeTool(name, args || {});
            // MCP 응답 형식으로 변환
            if (result.success) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result.data, null, 2),
                        },
                    ],
                };
            }
            else {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error: ${result.error?.message || 'Unknown error'}`,
                        },
                    ],
                    isError: true,
                };
            }
        });
    }
    /**
     * Provider 폴더에서 모든 TOON 파일 로드 및 등록
     */
    async loadProviders() {
        console.log('\n' + '='.repeat(60));
        console.log('🚀 EDU API MCP Server - Starting...');
        console.log('='.repeat(60) + '\n');
        console.log(`📂 Scanning providers directory: ${this.providersDir}\n`);
        // 1. TOON 파일 로드
        const loader = new ProviderLoader(this.providersDir);
        const specs = await loader.loadAllProviders();
        if (specs.length === 0) {
            console.warn('\n⚠️  No providers found. Please add .toon files to the providers/ directory.\n');
            return;
        }
        console.log('\n' + '-'.repeat(60) + '\n');
        // 2. Provider 생성
        const providers = ProviderFactory.createProviders(specs);
        console.log('-'.repeat(60) + '\n');
        // 3. Tools 등록
        console.log('📝 Registering MCP tools...\n');
        for (let i = 0; i < providers.length; i++) {
            this.registry.registerProvider(providers[i], specs[i]);
        }
        // 4. 통계 출력
        const stats = this.registry.getStats();
        console.log('\n' + '='.repeat(60));
        console.log('✅ Server initialization complete!');
        console.log('='.repeat(60));
        console.log(`\n📊 Statistics:`);
        console.log(`   • Total Providers: ${stats.totalProviders}`);
        console.log(`   • Total Tools: ${stats.totalTools}`);
        console.log('\n   Tools by Provider:');
        for (const [providerId, count] of Object.entries(stats.toolsByProvider)) {
            console.log(`     - ${providerId}: ${count} tool(s)`);
        }
        console.log('\n' + '='.repeat(60) + '\n');
        console.log('✅ MCP Server is ready to accept requests.\n');
    }
    /**
     * 서버 시작
     */
    async start() {
        try {
            // Provider 로드
            await this.loadProviders();
            // Stdio 트랜스포트로 연결
            const transport = new StdioServerTransport();
            await this.server.connect(transport);
            console.log('🎉 Server started successfully!\n');
        }
        catch (error) {
            console.error('❌ Failed to start server:', error);
            process.exit(1);
        }
    }
    /**
     * 서버 종료
     */
    async stop() {
        await this.server.close();
        console.log('\n👋 Server stopped.\n');
    }
    /**
     * Registry 접근 (테스트/디버깅용)
     */
    getRegistry() {
        return this.registry;
    }
}
//# sourceMappingURL=mcp-server.js.map