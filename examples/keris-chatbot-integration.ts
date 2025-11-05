/**
 * KERIS AI Chatbot 통합 예제
 *
 * KERIS_AI_Chatbot에서 MCP HTTP 서버를 사용하는 방법
 * Vercel/Next.js 환경에서 사용 가능
 */

import { JSONRPCRequest, JSONRPCResponse } from '@modelcontextprotocol/sdk/types.js';

// 환경 변수로 MCP 서버 URL 설정
const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'https://your-mcp-server.fly.dev/mcp';

/**
 * MCP 클라이언트 클래스
 */
export class EducationMCPClient {
  private serverUrl: string;
  private requestId = 0;

  constructor(serverUrl: string = MCP_SERVER_URL) {
    this.serverUrl = serverUrl;
  }

  /**
   * JSON-RPC 요청 전송
   */
  private async sendRequest(
    method: string,
    params?: Record<string, unknown>
  ): Promise<JSONRPCResponse> {
    const request: JSONRPCRequest = {
      jsonrpc: '2.0',
      id: ++this.requestId,
      method,
      params: params || {},
    };

    const response = await fetch(this.serverUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`MCP Server Error: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as JSONRPCResponse;
  }

  /**
   * 사용 가능한 도구 목록 조회
   */
  async listTools(): Promise<Array<{ name: string; description?: string; inputSchema?: unknown }>> {
    const response = await this.sendRequest('tools/list');

    if ('result' in response) {
      const result = response.result as { tools: Array<{ name: string; description?: string; inputSchema?: unknown }> };
      return result.tools;
    } else {
      throw new Error(response.error?.message || 'Failed to list tools');
    }
  }

  /**
   * 도구 호출
   */
  async callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
    const response = await this.sendRequest('tools/call', {
      name,
      arguments: args,
    });

    if ('result' in response) {
      const result = response.result as { content: Array<{ type: string; text: string }> };
      if (result.content && result.content[0]?.type === 'text') {
        return JSON.parse(result.content[0].text);
      }
      return result;
    } else {
      throw new Error(response.error?.message || 'Tool execution failed');
    }
  }

  /**
   * 학교 검색
   */
  async searchSchools(params: {
    region?: string; // 'B10' (서울), 'C10' (부산) 등
    schoolLevel?: string; // '초등학교', '중학교', '고등학교'
    schoolName?: string;
  }): Promise<unknown> {
    const args: Record<string, unknown> = {};

    if (params.region) {
      args.ATPT_OFCDC_SC_CODE = params.region;
    }
    if (params.schoolLevel) {
      args.SCHUL_KND_SC_NM = params.schoolLevel;
    }
    if (params.schoolName) {
      args.SCHUL_NM = params.schoolName;
    }

    return this.callTool('search-schools', args);
  }

  /**
   * 학교 기본 정보 조회
   */
  async getSchoolInfo(params: {
    schoolCode: string;
    region: string;
  }): Promise<unknown> {
    return this.callTool('get-school-info', {
      SD_SCHUL_CODE: params.schoolCode,
      ATPT_OFCDC_SC_CODE: params.region,
    });
  }

  /**
   * 학위논문 검색 (RISS)
   */
  async searchThesis(params: {
    query: string;
    count?: number;
  }): Promise<unknown> {
    return this.callTool('search-thesis', {
      query: params.query,
      displayCount: params.count || 10,
    });
  }
}

/**
 * Next.js API Route 사용 예제
 * 파일 위치: app/api/education/route.ts
 */
export async function POST(request: Request) {
  try {
    const { action, params } = await request.json();

    const mcpClient = new EducationMCPClient();

    let result;

    switch (action) {
      case 'searchSchools':
        result = await mcpClient.searchSchools(params);
        break;

      case 'getSchoolInfo':
        result = await mcpClient.getSchoolInfo(params);
        break;

      case 'searchThesis':
        result = await mcpClient.searchThesis(params);
        break;

      case 'listTools':
        result = await mcpClient.listTools();
        break;

      default:
        // 일반 도구 호출
        result = await mcpClient.callTool(action, params);
    }

    return Response.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return Response.json(
      {
        success: false,
        error: err.message,
      },
      { status: 500 }
    );
  }
}

/**
 * 프론트엔드에서 사용 예제
 */
export async function exampleUsageInFrontend() {
  // 학교 검색
  const schoolsResponse = await fetch('/api/education', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'searchSchools',
      params: {
        region: 'B10', // 서울
        schoolLevel: '중학교',
      },
    }),
  });

  const schools = await schoolsResponse.json();
  console.log('검색된 학교:', schools);

  // 학위논문 검색
  const thesisResponse = await fetch('/api/education', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'searchThesis',
      params: {
        query: '인공지능 교육',
        count: 20,
      },
    }),
  });

  const thesis = await thesisResponse.json();
  console.log('검색된 논문:', thesis);
}

/**
 * AI 챗봇 통합 예제
 */
export async function handleChatbotQuery(userMessage: string): Promise<string> {
  const mcpClient = new EducationMCPClient();

  // 간단한 의도 분류 (실제로는 LLM을 사용)
  if (userMessage.includes('학교') && userMessage.includes('검색')) {
    // 학교 검색 요청
    const schools = await mcpClient.searchSchools({
      region: 'B10',
      schoolLevel: '중학교',
    });

    return `서울의 중학교 목록을 찾았습니다:\n${JSON.stringify(schools, null, 2)}`;
  } else if (userMessage.includes('논문') && userMessage.includes('검색')) {
    // 논문 검색 요청
    const thesis = await mcpClient.searchThesis({
      query: '교육',
      count: 5,
    });

    return `관련 논문을 찾았습니다:\n${JSON.stringify(thesis, null, 2)}`;
  } else {
    return 'MCP 도구를 사용하여 학교 정보나 학위논문을 검색할 수 있습니다.';
  }
}

/**
 * 사용 예제 실행
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const client = new EducationMCPClient();

  console.log('🧪 Testing MCP Client...\n');

  // 도구 목록
  client
    .listTools()
    .then((tools) => {
      console.log('✅ Available tools:', tools.length);
      tools.forEach((tool) => {
        console.log(`  - ${tool.name}: ${tool.description || 'No description'}`);
      });
    })
    .catch((error: unknown) => {
      const err = error as Error;
      console.error('❌ Error:', err.message);
    });

  // 학교 검색
  client
    .searchSchools({
      region: 'B10',
      schoolLevel: '중학교',
    })
    .then((result) => {
      console.log('\n✅ Search schools result:', JSON.stringify(result, null, 2).substring(0, 500));
    })
    .catch((error: unknown) => {
      const err = error as Error;
      console.error('❌ Error:', err.message);
    });
}
