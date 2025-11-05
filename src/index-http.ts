#!/usr/bin/env node

/**
 * EDU API MCP Server - HTTP Version
 *
 * Streamable HTTP transport를 사용하여 원격 클라이언트 지원
 * KERIS_AI_Chatbot 등 웹 애플리케이션에서 사용 가능
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  JSONRPCRequest,
  JSONRPCResponse,
} from '@modelcontextprotocol/sdk/types.js';
import { resolve } from 'path';

import { ProviderLoader } from './core/provider-loader.js';
import { ProviderFactory } from './core/provider-factory.js';
import { ToolRegistry } from './core/tool-registry.js';
import type { ProviderSpec } from './types/index.js';

// 환경 변수
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const PROVIDERS_DIR = process.env.PROVIDERS_DIR || resolve(process.cwd(), 'providers');

// MCP 서버 및 Registry
const registry = new ToolRegistry();
const server = new Server(
  {
    name: 'edu-api-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * MCP 핸들러 설정
 */
function setupMCPHandlers(): void {
  // ListTools 핸들러
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const tools = registry.listTools();
    return { tools };
  });

  // CallTool 핸들러
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    console.log(`\n🔧 Tool called: ${name}`);
    console.log(`   Arguments:`, JSON.stringify(args, null, 2));

    const result = await registry.executeTool(name, args || {});

    if (result.success) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result.data, null, 2),
          },
        ],
      };
    } else {
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
 * Provider 로드 및 등록
 */
async function loadProviders(): Promise<void> {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 EDU API MCP Server (HTTP) - Starting...');
  console.log('='.repeat(60) + '\n');

  console.log(`📂 Scanning providers directory: ${PROVIDERS_DIR}\n`);

  // 1. TOON 파일 로드
  const loader = new ProviderLoader(PROVIDERS_DIR);
  const specs: ProviderSpec[] = await loader.loadAllProviders();

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
    registry.registerProvider(providers[i], specs[i]);
  }

  // 4. 통계 출력
  const stats = registry.getStats();

  console.log('\n' + '='.repeat(60));
  console.log('✅ Provider initialization complete!');
  console.log('='.repeat(60));
  console.log(`\n📊 Statistics:`);
  console.log(`   • Total Providers: ${stats.totalProviders}`);
  console.log(`   • Total Tools: ${stats.totalTools}`);
  console.log('\n   Tools by Provider:');

  for (const [providerId, count] of Object.entries(stats.toolsByProvider)) {
    console.log(`     - ${providerId}: ${count} tool(s)`);
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

/**
 * JSON-RPC 요청 처리
 */
async function handleJSONRPC(request: JSONRPCRequest): Promise<JSONRPCResponse> {
  try {
    // MCP SDK의 내부 핸들러 호출
    // @ts-expect-error - SDK 내부 메서드 접근
    const response = await server._handleRequest(request);
    return response;
  } catch (error: unknown) {
    const err = error as Error;
    return {
      jsonrpc: '2.0',
      id: request.id ?? null,
      error: {
        code: -32603,
        message: err.message || 'Internal error',
      },
    } as unknown as JSONRPCResponse;
  }
}

/**
 * Express 앱 초기화
 */
async function createApp(): Promise<express.Application> {
  const app = express();

  // Middleware
  app.use(cors({
    origin: '*', // 프로덕션에서는 특정 도메인으로 제한
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));
  app.use(express.json());

  // Health check
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'edu-api-mcp-server',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // MCP 엔드포인트 (JSON-RPC over HTTP)
  app.post('/mcp', async (req: Request, res: Response) => {
    try {
      const request = req.body as JSONRPCRequest;

      // JSON-RPC 요청 검증
      if (!request.jsonrpc || request.jsonrpc !== '2.0') {
        res.status(400).json({
          jsonrpc: '2.0',
          id: request.id ?? null,
          error: {
            code: -32600,
            message: 'Invalid Request: jsonrpc must be "2.0"',
          },
        } as unknown as JSONRPCResponse);
        return;
      }

      if (!request.method) {
        res.status(400).json({
          jsonrpc: '2.0',
          id: request.id ?? null,
          error: {
            code: -32600,
            message: 'Invalid Request: method is required',
          },
        } as unknown as JSONRPCResponse);
        return;
      }

      // 요청 처리
      const response = await handleJSONRPC(request);
      res.json(response);
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Error handling MCP request:', err);
      res.status(500).json({
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32603,
          message: err.message || 'Internal server error',
        },
      } as unknown as JSONRPCResponse);
    }
  });

  // 404 핸들러
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      error: 'Not Found',
      message: 'Available endpoints: GET /health, POST /mcp',
    });
  });

  return app;
}

/**
 * 서버 시작
 */
async function main(): Promise<void> {
  try {
    // MCP 핸들러 설정
    setupMCPHandlers();

    // Provider 로드
    await loadProviders();

    // Express 앱 생성
    const app = await createApp();

    // HTTP 서버 시작
    const httpServer = app.listen(Number(PORT), HOST, () => {
      console.log('='.repeat(60));
      console.log('🌐 HTTP Server Started!');
      console.log('='.repeat(60));
      console.log(`\n📍 Endpoints:`);
      console.log(`   • Health Check: http://${HOST}:${PORT}/health`);
      console.log(`   • MCP Endpoint:  http://${HOST}:${PORT}/mcp`);
      console.log('\n💡 Usage:');
      console.log('   POST /mcp with JSON-RPC 2.0 formatted requests');
      console.log('\n' + '='.repeat(60) + '\n');
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log('\n\n⚠️  Shutting down gracefully...');
      httpServer.close(() => {
        console.log('👋 HTTP Server stopped.\n');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// 서버 시작
main();
