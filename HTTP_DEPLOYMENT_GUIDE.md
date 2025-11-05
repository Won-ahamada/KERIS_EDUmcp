# MCP HTTP Server 배포 및 사용 가이드

**KERIS_AI_Chatbot 통합을 위한 완전한 가이드**

---

## 📋 목차

1. [개요](#개요)
2. [로컬 테스트](#로컬-테스트)
3. [배포 옵션](#배포-옵션)
4. [KERIS_AI_Chatbot 통합](#keris_ai_chatbot-통합)
5. [API 레퍼런스](#api-레퍼런스)
6. [문제 해결](#문제-해결)

---

## 🎯 개요

### MCP HTTP Server란?

기존 MCP 서버는 **stdio** transport를 사용하여 Claude Desktop 같은 로컬 클라이언트에서만 사용 가능했습니다.

**HTTP 버전**은 **JSON-RPC over HTTP**를 사용하여:
- ✅ 웹 애플리케이션에서 사용 가능 (KERIS_AI_Chatbot 등)
- ✅ 원격 서버에 배포 가능 (Fly.io, Railway, Vercel 등)
- ✅ 여러 클라이언트가 동시에 접속 가능
- ✅ HTTP API처럼 간단하게 호출

---

## 🧪 로컬 테스트

### 1단계: 빌드

```bash
cd KERIS_EDUmcp
npm run build
```

### 2단계: HTTP 서버 시작

```bash
npm run start:http
```

**예상 출력:**
```
==========================================================
🚀 EDU API MCP Server (HTTP) - Starting...
===========================================================

📂 Scanning providers directory: /path/to/providers

...

==========================================================
🌐 HTTP Server Started!
===========================================================

📍 Endpoints:
   • Health Check: http://0.0.0.0:3000/health
   • MCP Endpoint:  http://0.0.0.0:3000/mcp

💡 Usage:
   POST /mcp with JSON-RPC 2.0 formatted requests

==========================================================
```

### 3단계: Health Check 테스트

```bash
curl http://localhost:3000/health
```

**응답:**
```json
{
  "status": "ok",
  "service": "edu-api-mcp-server",
  "version": "1.0.0",
  "timestamp": "2025-11-05T03:00:00.000Z"
}
```

### 4단계: 도구 목록 조회

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {}
  }'
```

### 5단계: 도구 호출 (학교 검색)

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "search-schools",
      "arguments": {
        "ATPT_OFCDC_SC_CODE": "B10",
        "SCHUL_KND_SC_NM": "중학교"
      }
    }
  }'
```

### 6단계: 테스트 클라이언트 실행

```bash
npx tsx examples/mcp-http-client-test.ts
```

---

## 🚀 배포 옵션

### 옵션 1: Fly.io 배포 (권장) ⭐⭐⭐⭐⭐

**장점:**
- 무료 티어 제공 (3GB 스토리지, 160GB 대역폭/월)
- Auto-scaling (요청 없으면 자동 sleep)
- 글로벌 CDN
- 간단한 배포

#### 배포 단계:

```bash
# 1. Fly CLI 설치
# Windows (PowerShell)
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"

# macOS/Linux
curl -L https://fly.io/install.sh | sh

# 2. 로그인
fly auth login

# 3. 앱 생성 (최초 1회)
fly apps create keris-edu-mcp

# 4. 배포
fly deploy --dockerfile Dockerfile.http

# 5. 배포 확인
fly status
fly logs

# 6. URL 확인
fly info
# 예: https://keris-edu-mcp.fly.dev
```

#### 환경 변수 설정 (선택사항):

```bash
fly secrets set CACHE_ENABLED=true
fly secrets set CACHE_TTL=7200
fly secrets set LOG_LEVEL=info
```

---

### 옵션 2: Railway 배포 ⭐⭐⭐⭐

**장점:**
- GitHub 연동 자동 배포
- 무료 티어 ($5 credit/월)
- 간단한 UI

#### 배포 단계:

1. **Railway 웹사이트 접속**: https://railway.app
2. **New Project** 클릭
3. **Deploy from GitHub repo** 선택
4. **KERIS_EDUmcp** 저장소 선택
5. **Settings** → **Dockerfile Path**: `Dockerfile.http`
6. **Deploy** 클릭

**URL**: `https://keris-edu-mcp.up.railway.app`

---

### 옵션 3: 로컬 Docker 실행 ⭐⭐⭐

```bash
# 이미지 빌드
docker build -f Dockerfile.http -t keris-edu-mcp:http .

# 컨테이너 실행
docker run -p 3000:3000 \
  -e PORT=3000 \
  -e HOST=0.0.0.0 \
  keris-edu-mcp:http

# 백그라운드 실행
docker run -d -p 3000:3000 \
  --name keris-mcp \
  keris-edu-mcp:http

# 로그 확인
docker logs keris-mcp

# 중지
docker stop keris-mcp
```

---

## 🤖 KERIS_AI_Chatbot 통합

### 아키텍처

```
[KERIS_AI_Chatbot (Vercel)]
        ↓ HTTP POST
[MCP HTTP Server (Fly.io)]
        ↓ API 호출
[교육부 API / RISS API]
```

### Step 1: MCP 클라이언트 라이브러리 생성

**파일: `lib/mcp-client.ts`**

```typescript
import { JSONRPCRequest, JSONRPCResponse } from '@modelcontextprotocol/sdk/types.js';

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'https://keris-edu-mcp.fly.dev/mcp';

export class EducationMCPClient {
  private serverUrl: string;
  private requestId = 0;

  constructor(serverUrl: string = MCP_SERVER_URL) {
    this.serverUrl = serverUrl;
  }

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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`MCP Server Error: ${response.status}`);
    }

    return await response.json();
  }

  async listTools() {
    const response = await this.sendRequest('tools/list');
    if ('result' in response) {
      return response.result.tools;
    }
    throw new Error(response.error?.message || 'Failed to list tools');
  }

  async callTool(name: string, args: Record<string, unknown>) {
    const response = await this.sendRequest('tools/call', { name, arguments: args });
    if ('result' in response) {
      const content = response.result.content;
      if (content?.[0]?.type === 'text') {
        return JSON.parse(content[0].text);
      }
      return response.result;
    }
    throw new Error(response.error?.message || 'Tool execution failed');
  }

  // 편의 메서드
  async searchSchools(params: { region?: string; schoolLevel?: string; schoolName?: string }) {
    return this.callTool('search-schools', {
      ATPT_OFCDC_SC_CODE: params.region,
      SCHUL_KND_SC_NM: params.schoolLevel,
      SCHUL_NM: params.schoolName,
    });
  }

  async searchThesis(query: string, count: number = 10) {
    return this.callTool('search-thesis', { query, displayCount: count });
  }
}
```

### Step 2: Next.js API Route 생성

**파일: `app/api/education/route.ts`**

```typescript
import { EducationMCPClient } from '@/lib/mcp-client';

export async function POST(request: Request) {
  try {
    const { action, params } = await request.json();
    const mcpClient = new EducationMCPClient();

    let result;

    switch (action) {
      case 'searchSchools':
        result = await mcpClient.searchSchools(params);
        break;

      case 'searchThesis':
        result = await mcpClient.searchThesis(params.query, params.count);
        break;

      case 'listTools':
        result = await mcpClient.listTools();
        break;

      default:
        result = await mcpClient.callTool(action, params);
    }

    return Response.json({ success: true, data: result });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
```

### Step 3: 프론트엔드에서 사용

```typescript
// 학교 검색
const response = await fetch('/api/education', {
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

const { data } = await response.json();
console.log('검색된 학교:', data);
```

### Step 4: 환경 변수 설정

**파일: `.env.local`**

```bash
MCP_SERVER_URL=https://keris-edu-mcp.fly.dev/mcp
```

---

## 📚 API 레퍼런스

### JSON-RPC 2.0 형식

모든 요청은 다음 형식을 따릅니다:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "METHOD_NAME",
  "params": {}
}
```

### 메서드

#### 1. `tools/list` - 도구 목록 조회

**요청:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {}
}
```

**응답:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {
        "name": "search-schools",
        "description": "학교 검색",
        "inputSchema": { ... }
      }
    ]
  }
}
```

#### 2. `tools/call` - 도구 호출

**요청:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "search-schools",
    "arguments": {
      "ATPT_OFCDC_SC_CODE": "B10",
      "SCHUL_KND_SC_NM": "중학교"
    }
  }
}
```

**응답:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"schools\": [...]}"
      }
    ]
  }
}
```

---

## 🔧 문제 해결

### 1. Connection Refused

**증상**: `ECONNREFUSED` 에러

**해결**:
```bash
# 서버가 실행 중인지 확인
curl http://localhost:3000/health

# 로그 확인
npm run start:http
```

### 2. CORS 에러

**증상**: 브라우저에서 `CORS policy` 에러

**해결**: `src/index-http.ts`에서 CORS 설정 수정
```typescript
app.use(cors({
  origin: 'https://your-chatbot-domain.com', // 특정 도메인만 허용
  credentials: true,
}));
```

### 3. Tool Not Found

**증상**: `Tool 'xxx' not found` 에러

**해결**:
```bash
# 도구 목록 확인
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

---

## 📊 성능 및 비용

### Fly.io 무료 티어 (권장)

| 항목 | 제한 |
|------|------|
| 메모리 | 256MB (충분) |
| 스토리지 | 3GB |
| 대역폭 | 160GB/월 |
| 요청 수 | 무제한 |
| **비용** | **무료** |

### Railway 무료 티어

| 항목 | 제한 |
|------|------|
| 크레딧 | $5/월 |
| 메모리 | 512MB |
| **예상 사용 시간** | **~100시간/월** |

---

## 🎯 다음 단계

1. ✅ **로컬 테스트 완료**
2. ✅ **Fly.io 배포**
3. ⬜ **KERIS_AI_Chatbot 통합**
4. ⬜ **프로덕션 모니터링**

---

**작성일**: 2025-11-05
**버전**: 1.0.0
**저자**: Won-ahamada
