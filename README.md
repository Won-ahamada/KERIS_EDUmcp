# EDU API MCP Server

확장 가능한 교육 API 통합 MCP 서버 - **TOON 파일만 넣으면 자동 확장**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-1.0-green.svg)](https://modelcontextprotocol.io/)

## 🚀 주요 특징

- **제로 코드 확장**: `.toon` 파일만 `providers/` 폴더에 넣으면 자동으로 API가 MCP Tool로 등록됩니다
- **자동 스캔**: 서버 시작 시 provider 폴더를 자동으로 스캔하여 모든 TOON 파일 로드
- **타입 안전성**: 100% TypeScript로 작성되어 타입 안전성 보장
- **압축 효율**: TOON 포맷을 사용하여 API 스펙을 85% 압축 (JSON 대비)
- **플러그인 아키텍처**: 각 API는 독립적인 Provider로 동작
- **🌐 웹 통합 지원**: HTTP 버전으로 웹 애플리케이션에서도 사용 가능 (NEW!)

## 📋 포함된 Provider

### 1. 학교알리미 API (school-alrimi)
- **제공기관**: 교육부 학교알리미
- **엔드포인트**: 12개
  - 학교 기본정보
  - 학생/학급 통계
  - 교원 정보
  - 학교폭력 예방 실적 등
- **MCP Tools**: 17개

### 2. RISS API (riss)
- **제공기관**: 한국교육학술정보원
- **엔드포인트**: 1개 (학위논문 검색)
- **MCP Tools**: 1개

## 📦 설치

### 필수 요구사항

- Node.js >= 20.0.0
- npm 또는 yarn

### 설치 방법

```bash
# 1. 저장소 클론
git clone https://github.com/Won-ahamada/KERIS_EDUmcp.git
cd KERIS_EDUmcp

# 2. 의존성 설치
npm install

# 3. 빌드
npm run build
```

## 🎯 사용 방법

### 1. 기본 실행

```bash
npm start
```

### 2. Claude Desktop에서 사용

Claude Desktop의 설정 파일(`claude_desktop_config.json`)에 다음을 추가:

```json
{
  "mcpServers": {
    "edu-api": {
      "command": "node",
      "args": [
        "/absolute/path/to/KERIS_EDUmcp/dist/index.js"
      ]
    }
  }
}
```

**Windows 예시:**
```json
{
  "mcpServers": {
    "edu-api": {
      "command": "node",
      "args": [
        "C:\\Users\\YourName\\KERIS_EDUmcp\\dist\\index.js"
      ]
    }
  }
}
```

**macOS/Linux 예시:**
```json
{
  "mcpServers": {
    "edu-api": {
      "command": "node",
      "args": [
        "/home/yourname/KERIS_EDUmcp/dist/index.js"
      ]
    }
  }
}
```

### 3. Claude Desktop 재시작

설정 변경 후 Claude Desktop을 재시작하면 MCP Tools가 자동으로 로드됩니다.

---

## 🌐 HTTP 버전 (웹 애플리케이션 통합)

**NEW!** MCP 서버를 HTTP로 실행하여 웹 애플리케이션 (KERIS_AI_Chatbot 등)에서 사용할 수 있습니다.

### HTTP 서버 실행

```bash
# 개발 모드 (watch)
npm run dev:http

# 프로덕션 모드
npm run start:http
```

서버가 `http://localhost:3000`에서 시작됩니다.

### Endpoints

- **Health Check**: `GET /health`
- **MCP API**: `POST /mcp` (JSON-RPC 2.0)

### 웹 클라이언트에서 사용

```typescript
// 도구 목록 조회
const response = await fetch('http://localhost:3000/mcp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list',
    params: {}
  })
});

const { result } = await response.json();
console.log('사용 가능한 도구:', result.tools);
```

### 원격 배포 (무료)

#### Fly.io 배포
```bash
fly deploy --dockerfile Dockerfile.http
```

#### Railway 배포
웹사이트에서 GitHub 저장소 연결 후 배포

### 상세 가이드

**완전한 HTTP 통합 가이드**: [HTTP_DEPLOYMENT_GUIDE.md](HTTP_DEPLOYMENT_GUIDE.md)

- KERIS_AI_Chatbot 통합 예제
- Next.js API Route 예제
- Fly.io/Railway 배포 가이드
- 문제 해결 가이드

## ➕ 새 Provider 추가하기

### 단계 1: TOON 파일 작성

`providers/` 폴더에 새 `.toon` 파일을 생성합니다.

```toon
# my-api.toon

## Provider 정보
provider{id,name,version,baseUrl,method,dataFormat}:
  my-api,My API,1.0.0,https://api.example.com,GET,JSON

authentication{type,parameterName,location}:
  apiKey,api_key,query

## 공통 파라미터
commonParameters.required[1]{name,type,description}:
  api_key,string,API 인증키

## 엔드포인트
endpoints[2]{id,apiType,name,description}:
  get-data,01,데이터조회,데이터를조회합니다
  get-stats,02,통계조회,통계를조회합니다
```

### 단계 2: 서버 재시작

```bash
npm run build
npm start
```

**그게 전부입니다!** 새 API가 자동으로 MCP Tool로 등록됩니다.

## 🏗️ 프로젝트 구조

```
KERIS_EDUmcp/
├── src/
│   ├── core/
│   │   ├── provider-loader.ts    # TOON 파일 자동 스캔 및 로드
│   │   ├── provider-factory.ts   # Provider 인스턴스 생성
│   │   ├── tool-registry.ts      # MCP Tool 자동 등록
│   │   └── mcp-server.ts         # MCP 서버 메인 로직
│   ├── lib/
│   │   └── toon-parser.ts        # TOON 파서
│   ├── types/
│   │   └── index.ts              # 타입 정의
│   └── index.ts                  # 진입점
├── providers/                    # 🔥 여기에 .toon 파일 추가
│   ├── school-alrimi.toon
│   └── riss.toon
├── docs/                         # 문서
│   ├── API_연계_확장_계획.md
│   ├── MCP_서버_확장_계획.md
│   ├── toon-format-guide.md
│   └── ...
├── examples/                     # 예시 파일
│   ├── school-alrimi-api-spec.toon
│   ├── riss-api-spec.toon
│   └── ...
├── dist/                         # 빌드 결과물
├── package.json
├── tsconfig.json
├── smithery.json
├── README.md
├── CHANGELOG.md
├── DEPLOYMENT_GUIDE.md
└── LICENSE
```

## 📖 TOON 포맷 가이드

TOON (Token-Oriented Object Notation)은 테이블 형식 데이터를 표현하는 압축 포맷입니다.

### 기본 문법

```toon
# 주석
tableName[rowCount]{field1,field2,field3}:
  value1,value2,value3
  value4,value5,value6
```

### 실전 예시

```toon
## Provider 정보
provider{id,name,version,baseUrl}:
  school-api,학교API,1.0.0,https://api.school.kr

## 엔드포인트 정의
endpoints[3]{id,apiType,name,description}:
  school-info,01,학교정보,학교기본정보조회
  student-count,02,학생수,학생수통계
  teacher-info,03,교원정보,교원현황조회
```

### 중첩 경로 지원

```toon
endpoints.basic[1]{id,name}:
  school-info,학교기본정보

endpoints.student[2]{id,name}:
  student-count,학생수
  student-transfer,전출입학생
```

이것은 다음과 같이 파싱됩니다:

```json
{
  "endpoints": {
    "basic": [
      {"id": "school-info", "name": "학교기본정보"}
    ],
    "student": [
      {"id": "student-count", "name": "학생수"},
      {"id": "student-transfer", "name": "전출입학생"}
    ]
  }
}
```

## 🛠️ 개발

### 개발 모드 실행

```bash
npm run dev
```

### 빌드

```bash
npm run build
```

### Provider 목록 조회

```bash
npm run providers:list
```

### Provider 검증

```bash
npm run providers:validate
```

## 🚢 Smithery 배포

Smithery는 MCP 서버를 쉽게 배포하고 공유할 수 있는 플랫폼입니다.

### 1. smithery.json 생성

프로젝트 루트에 `smithery.json` 파일 생성:

```json
{
  "name": "edu-api-mcp-server",
  "version": "1.0.0",
  "description": "확장 가능한 교육 API 통합 MCP 서버",
  "author": "Your Name",
  "homepage": "https://github.com/Won-ahamada/KERIS_EDUmcp",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/Won-ahamada/KERIS_EDUmcp.git"
  },
  "runtime": "node",
  "entrypoint": "dist/index.js",
  "buildCommand": "npm run build",
  "installCommand": "npm install"
}
```

### 2. Smithery에 배포

```bash
# Smithery CLI 설치 (최초 1회)
npm install -g @smithery/cli

# 로그인
smithery login

# 배포
smithery publish
```

### 3. 사용자가 설치하는 방법

배포 후 다른 사용자는 다음과 같이 설치:

```bash
smithery install edu-api-mcp-server
```

또는 Claude Desktop 설정에서:

```json
{
  "mcpServers": {
    "edu-api": {
      "command": "smithery",
      "args": ["run", "edu-api-mcp-server"]
    }
  }
}
```

## 📊 통계

- **총 Provider**: 2개
- **총 Endpoint**: 13개
- **총 MCP Tools**: 18개
- **TOON 압축률**: 85% (JSON 대비)
- **코드 라인 수**: ~1,500 LOC

## 🔒 환경 변수

API 키는 환경 변수로 설정하는 것을 권장합니다:

```bash
# .env 파일 생성
SCHOOL_ALRIMI_API_KEY=your_api_key_here
RISS_API_KEY=your_riss_api_key_here
```

Claude Desktop 설정에서:

```json
{
  "mcpServers": {
    "edu-api": {
      "command": "node",
      "args": ["C:\\path\\to\\dist\\index.js"],
      "env": {
        "SCHOOL_ALRIMI_API_KEY": "your_key_here",
        "RISS_API_KEY": "your_key_here"
      }
    }
  }
}
```

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 🙏 감사의 글

- [Model Context Protocol](https://modelcontextprotocol.io/) - MCP 프레임워크
- [교육부 학교알리미](https://www.schoolinfo.go.kr/) - 학교 정보 API
- [한국교육학술정보원](https://www.riss.kr/) - 학위논문 검색 API

## 📮 문의

프로젝트 관련 문의사항은 [GitHub Issues](https://github.com/Won-ahamada/KERIS_EDUmcp/issues)에 등록해주세요.

---

**Made with ❤️ for Korean Education Data**
