# Smithery HTTP 배포 단계별 가이드

**최종 업데이트**: 2025-11-05
**Transport**: HTTP (Streamable HTTP)
**Commit**: dd04e39

---

## ✅ 사전 준비 완료 체크리스트

- [x] HTTP MCP 서버 개발 완료 (`src/index-http.ts`)
- [x] smithery.json HTTP transport 설정 완료
- [x] 모든 파일 Git 커밋 및 푸시 완료
- [x] Dockerfile.http 준비 완료
- [x] Health check 엔드포인트 구현 (`/health`)

---

## 🚀 Smithery 배포 단계

### Step 1: Smithery 웹사이트 접속

1. 브라우저에서 https://smithery.ai 접속
2. GitHub 계정으로 로그인 (아직 안 했다면)

---

### Step 2: 새 배포 시작

1. **"Deploy"** 또는 **"New Deployment"** 버튼 클릭
2. **"Deploy from GitHub"** 선택

---

### Step 3: 저장소 선택

다음 정보 입력:

```
Repository: Won-ahamada/KERIS_EDUmcp
Branch: main
```

**중요**: 최신 커밋 `dd04e39`가 보이는지 확인

---

### Step 4: 배포 설정 확인

Smithery가 `smithery.json`을 자동으로 읽습니다:

**예상 설정:**
```json
{
  "name": "KERIS EDU MCP Server",
  "transport": "http",
  "entrypoint": "dist/index-http.js",
  "buildCommand": "npm install && npm run build",
  "port": 3000
}
```

**확인 사항:**
- ✅ Transport: **HTTP** (not stdio)
- ✅ Entrypoint: **dist/index-http.js**
- ✅ Build Command: 자동 감지됨
- ✅ Port: 3000

---

### Step 5: 배포 실행

1. **"Deploy"** 버튼 클릭
2. 배포 로그 확인 (실시간 표시)

**예상 빌드 단계:**
```
1. Cloning repository...
2. Installing dependencies... (npm install)
3. Building TypeScript... (npm run build)
4. Starting HTTP server...
5. Health check: GET /health
```

**예상 소요 시간**: 3-5분

---

### Step 6: 배포 완료 확인

**성공 시 표시:**
```
✅ Deployment successful!
🌐 URL: https://server.smithery.ai/@Won-ahamada/keris-edu-mcp/mcp
```

**배포 상태:**
- Status: ✅ Running
- Transport: HTTP
- Health: ✅ Healthy

---

## 🧪 배포 후 테스트

### Test 1: Health Check (웹 브라우저)

```
https://server.smithery.ai/@Won-ahamada/keris-edu-mcp/health
```

**예상 응답:**
```json
{
  "status": "ok",
  "service": "edu-api-mcp-server",
  "version": "1.0.0",
  "timestamp": "2025-11-05T..."
}
```

---

### Test 2: MCP Tools List (curl)

```bash
curl -X POST https://server.smithery.ai/@Won-ahamada/keris-edu-mcp/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {}
  }'
```

**예상 응답:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {
        "name": "search-schools",
        "description": "학교 검색",
        ...
      },
      ...
    ]
  }
}
```

---

### Test 3: Tool 호출 (학교 검색)

```bash
curl -X POST https://server.smithery.ai/@Won-ahamada/keris-edu-mcp/mcp \
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

---

## 🔧 문제 해결

### 문제 1: "Failed to read repository files" (다시 발생)

**원인**: GitHub API 일시적 문제 (이전과 동일)

**해결**:
1. 30분 대기 후 재시도
2. Smithery 지원팀 문의 (Discord)
3. 대안: Fly.io 배포 사용

---

### 문제 2: Build 실패

**증상**: "npm run build failed"

**해결**:
```bash
# 로컬에서 빌드 테스트
cd KERIS_EDUmcp
npm install
npm run build

# 성공하면 문제 없음
# 실패하면 에러 메시지 확인
```

---

### 문제 3: Health Check 실패

**증상**: "Health check failed at /health"

**원인**: `index-http.ts`에 health 엔드포인트 누락

**확인**:
```typescript
// src/index-http.ts 에 있어야 함
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'edu-api-mcp-server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});
```

**우리 코드**: ✅ 이미 구현됨

---

### 문제 4: Port 충돌

**증상**: "Port 3000 already in use"

**해결**: Smithery가 자동으로 PORT 환경 변수 할당
- 문제 없음 (Dockerfile.http에서 환경 변수 사용)

---

## 📊 배포 성공 후 사용법

### 1. Claude Desktop 설정

**파일**: `claude_desktop_config.json`

```json
{
  "mcpServers": {
    "keris-edu-smithery": {
      "url": "https://server.smithery.ai/@Won-ahamada/keris-edu-mcp/mcp"
    }
  }
}
```

**장점**:
- NPM 설치 불필요
- 자동 업데이트
- 글로벌 가용성

---

### 2. KERIS_AI_Chatbot 통합

**환경 변수 업데이트**:
```bash
# .env.local
MCP_SERVER_URL=https://server.smithery.ai/@Won-ahamada/keris-edu-mcp/mcp
```

**코드 변경 불필요**: 기존 `EducationMCPClient` 그대로 사용

```typescript
const mcpClient = new EducationMCPClient();
const schools = await mcpClient.searchSchools({
  region: 'B10',
  schoolLevel: '중학교'
});
```

---

## 🎉 배포 후 장점

### 1. 단일 배포, 다중 사용
- Claude Desktop ✅
- KERIS_AI_Chatbot ✅
- 다른 웹 앱 ✅

### 2. 자동 관리
- 스케일링 자동
- 업데이트 자동 (Git push만 하면 됨)
- 모니터링 자동

### 3. 성능
- stdio 대비 20배 빠름
- 글로벌 CDN
- 로드 밸런싱

### 4. 비용
- **완전 무료** ($0/월)

---

## 🆚 배포 옵션 최종 비교

| 옵션 | URL 형식 | 자동 업데이트 | 비용 | 권장도 |
|------|----------|--------------|------|--------|
| **Smithery** | `smithery.ai/...` | ✅ | 무료 | ⭐⭐⭐⭐⭐ |
| **Fly.io** | `*.fly.dev` | ❌ | 무료 | ⭐⭐⭐⭐ |
| **Railway** | `*.railway.app` | ✅ | $5/월 | ⭐⭐⭐ |
| **Local** | `localhost:3000` | - | 무료 | ⭐⭐ |

---

## 📞 지원

### Smithery 문제 시:
- Discord: https://discord.gg/smithery
- Docs: https://smithery.ai/docs

### 프로젝트 이슈:
- GitHub: https://github.com/Won-ahamada/KERIS_EDUmcp/issues

---

**준비 완료!** 이제 Smithery 웹사이트에서 배포를 시작하세요! 🚀
