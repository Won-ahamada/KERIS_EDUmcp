/**
 * MCP HTTP Client Test
 *
 * HTTP MCP 서버를 테스트하는 예제 클라이언트
 * KERIS_AI_Chatbot 등에서 참고할 수 있는 통합 예제
 */

import { JSONRPCRequest, JSONRPCResponse } from '@modelcontextprotocol/sdk/types.js';

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:3000/mcp';

/**
 * MCP JSON-RPC 요청 전송
 */
async function sendMCPRequest(
  method: string,
  params?: Record<string, unknown>
): Promise<JSONRPCResponse> {
  const request: JSONRPCRequest = {
    jsonrpc: '2.0',
    id: Date.now(),
    method,
    params: params || {},
  };

  console.log('\n📤 Sending request:');
  console.log(JSON.stringify(request, null, 2));

  const response = await fetch(MCP_SERVER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const result = (await response.json()) as JSONRPCResponse;

  console.log('\n📥 Response:');
  console.log(JSON.stringify(result, null, 2));

  return result;
}

/**
 * 사용 가능한 도구 목록 조회
 */
async function listTools(): Promise<void> {
  console.log('\n' + '='.repeat(60));
  console.log('🔍 Listing available tools...');
  console.log('='.repeat(60));

  const response = await sendMCPRequest('tools/list');

  if ('result' in response) {
    const tools = (response.result as { tools: Array<{ name: string; description?: string }> }).tools;
    console.log(`\n✅ Found ${tools.length} tools:\n`);
    tools.forEach((tool, index) => {
      console.log(`${index + 1}. ${tool.name}`);
      if (tool.description) {
        console.log(`   ${tool.description}`);
      }
    });
  } else {
    console.error('❌ Error:', response.error);
  }
}

/**
 * 도구 호출 예제 - 학교 검색
 */
async function callSearchSchoolsTool(): Promise<void> {
  console.log('\n' + '='.repeat(60));
  console.log('🔧 Calling search-schools tool...');
  console.log('='.repeat(60));

  const response = await sendMCPRequest('tools/call', {
    name: 'search-schools',
    arguments: {
      ATPT_OFCDC_SC_CODE: 'B10', // 서울
      SCHUL_KND_SC_NM: '중학교',
    },
  });

  if ('result' in response) {
    console.log('\n✅ Tool execution successful!');
    const result = response.result as { content: Array<{ type: string; text: string }> };
    if (result.content && result.content[0]) {
      const data = JSON.parse(result.content[0].text);
      console.log('\n📊 Result preview:');
      console.log(JSON.stringify(data, null, 2).substring(0, 500) + '...');
    }
  } else {
    console.error('❌ Error:', response.error);
  }
}

/**
 * Health Check
 */
async function healthCheck(): Promise<void> {
  console.log('\n' + '='.repeat(60));
  console.log('❤️  Health Check...');
  console.log('='.repeat(60));

  const response = await fetch(MCP_SERVER_URL.replace('/mcp', '/health'));
  const data = await response.json();

  console.log('\n📊 Server Status:');
  console.log(JSON.stringify(data, null, 2));
}

/**
 * 메인 테스트 실행
 */
async function main(): Promise<void> {
  try {
    console.log('\n🚀 MCP HTTP Client Test\n');
    console.log(`📍 Server URL: ${MCP_SERVER_URL}\n`);

    // 1. Health Check
    await healthCheck();

    // 2. List Tools
    await listTools();

    // 3. Call Tool (예제)
    await callSearchSchoolsTool();

    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests completed!');
    console.log('='.repeat(60) + '\n');
  } catch (error: unknown) {
    const err = error as Error;
    console.error('\n❌ Test failed:', err.message);
    process.exit(1);
  }
}

main();
