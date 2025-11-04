#!/usr/bin/env node

/**
 * EDU API MCP Server
 *
 * 확장 가능한 교육 API 통합 MCP 서버
 * providers/ 폴더에 .toon 파일만 넣으면 자동으로 확장됩니다.
 */

import { MCPServer } from './core/mcp-server.js';
import { resolve } from 'path';

// Provider 폴더 경로
const providersDir = resolve(process.cwd(), 'providers');

// 서버 인스턴스 생성 및 시작
const server = new MCPServer(providersDir);

// 종료 시그널 처리
process.on('SIGINT', async () => {
  console.log('\n\n⚠️  Received SIGINT, shutting down gracefully...');
  await server.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n\n⚠️  Received SIGTERM, shutting down gracefully...');
  await server.stop();
  process.exit(0);
});

// 서버 시작
server.start().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
