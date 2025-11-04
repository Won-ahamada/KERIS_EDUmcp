# Smithery 배포 가이드

EDU API MCP Server를 Smithery 플랫폼에 배포하고 다른 사용자들이 쉽게 설치할 수 있도록 하는 방법입니다.

## 📋 목차

1. [Smithery란?](#smithery란)
2. [배포 방법 선택](#배포-방법-선택)
3. [방법 1: GitHub 기반 설치](#방법-1-github-기반-설치)
4. [방법 2: NPM 패키지 발행](#방법-2-npm-패키지-발행)
5. [방법 3: Smithery 레지스트리 등록](#방법-3-smithery-레지스트리-등록)
6. [사용자 설치 방법](#사용자-설치-방법)

---

## 🎯 Smithery란?

**Smithery**는 MCP (Model Context Protocol) 서버를 쉽게 배포, 공유, 설치할 수 있는 플랫폼입니다.

### 주요 기능
- ✅ **원클릭 설치**: `smithery install` 명령 하나로 설치
- ✅ **자동 의존성 관리**: Node.js 패키지 자동 설치
- ✅ **Claude Desktop 통합**: 자동으로 설정 파일 업데이트
- ✅ **버전 관리**: 업데이트 및 버전 관리 지원

### 웹사이트
- 메인: https://smithery.ai
- 레지스트리: https://smithery.ai/servers
- API 키 발급: https://smithery.ai/account/api-keys

---

## 🔀 배포 방법 선택

세 가지 방법 중 선택할 수 있습니다:

| 방법 | 난이도 | 접근성 | 추천 대상 |
|------|--------|--------|----------|
| **GitHub 직접 참조** | ⭐ 쉬움 | 공개 | 빠른 공유 |
| **NPM 발행** | ⭐⭐ 보통 | 공개 | 공식 배포 |
| **Smithery 등록** | ⭐⭐⭐ 어려움 | 공개 | 최대 노출 |

---

## 방법 1: GitHub 기반 설치

가장 간단한 방법입니다. **이미 사용 가능합니다!**

### ✅ 현재 상태

프로젝트가 이미 GitHub에 업로드되어 있으므로, 사용자들이 바로 설치할 수 있습니다.

**저장소**: https://github.com/Won-ahamada/KERIS_EDUmcp

### 사용자 설치 방법

#### 방법 A: Git Clone

```bash
# 1. 리포지토리 클론
git clone https://github.com/Won-ahamada/KERIS_EDUmcp.git
cd KERIS_EDUmcp

# 2. 의존성 설치 및 빌드
npm install
npm run build
```

#### 방법 B: Smithery CLI 사용

```bash
# GitHub 리포지토리에서 직접 설치
smithery install github:Won-ahamada/KERIS_EDUmcp
```

### Claude Desktop 설정

```json
{
  "mcpServers": {
    "edu-api": {
      "command": "node",
      "args": [
        "C:\\path\\to\\KERIS_EDUmcp\\dist\\index.js"
      ]
    }
  }
}
```

---

## 방법 2: NPM 패키지 발행

NPM에 패키지를 발행하면 더 많은 사용자가 쉽게 접근할 수 있습니다.

### 준비 사항

✅ **이미 완료된 항목:**
- `package.json` 설정 완료
- `smithery.json` 설정 완료
- 빌드 스크립트 준비
- GitHub 리포지토리 연결

### 발행 단계

#### 1. NPM 계정 생성 (최초 1회)

```bash
# NPM 계정 생성
# https://www.npmjs.com/signup 방문

# 또는 CLI로 생성
npm adduser
```

#### 2. NPM 로그인

```bash
npm login
```

입력 사항:
- Username: (NPM 사용자명)
- Password: (NPM 비밀번호)
- Email: (NPM 이메일)

#### 3. 패키지 이름 확인

```bash
# 패키지 이름이 사용 가능한지 확인
npm search edu-api-mcp-server
```

패키지 이름이 이미 사용 중이면 `package.json`에서 변경:
```json
{
  "name": "@your-username/edu-api-mcp-server"
}
```

#### 4. 빌드 및 테스트

```bash
# 빌드
npm run build

# dist/ 폴더 확인
ls dist/

# 로컬 테스트
npm link
node dist/index.js
```

#### 5. NPM 발행

```bash
# 처음 발행
npm publish --access public

# 업데이트 발행 (버전 업그레이드 필요)
npm version patch  # 1.0.0 -> 1.0.1
npm publish
```

### 발행 후 확인

```bash
# NPM 레지스트리에서 확인
npm view edu-api-mcp-server

# 설치 테스트
npm install -g edu-api-mcp-server
```

### 사용자 설치 방법 (NPM 발행 후)

```bash
# NPM에서 설치
npm install -g edu-api-mcp-server

# 또는 Smithery로 설치
smithery install npm:edu-api-mcp-server
```

### Claude Desktop 설정 (NPM 설치 후)

```json
{
  "mcpServers": {
    "edu-api": {
      "command": "edu-api-mcp"
    }
  }
}
```

---

## 방법 3: Smithery 레지스트리 등록

Smithery 공식 레지스트리에 등록하면 `smithery.ai`에서 검색 가능합니다.

### 준비 사항

1. **Smithery 계정 생성**
   - https://smithery.ai 방문
   - GitHub 계정으로 가입

2. **API 키 발급**
   - https://smithery.ai/account/api-keys 방문
   - "Create API Key" 클릭
   - API 키 복사 (한 번만 표시됨!)

### 등록 단계

#### 1. Smithery CLI 로그인

```bash
# API 키로 로그인
smithery login

# 프롬프트에 API 키 입력
# 또는 환경 변수로 설정
export SMITHERY_API_KEY=your_api_key_here
```

#### 2. 서버 등록

현재 Smithery CLI v1.6.3에는 `publish` 명령이 없습니다.
**웹 인터페이스를 통해 등록해야 합니다.**

##### 웹 인터페이스 등록:

1. https://smithery.ai/servers 방문
2. "Submit Server" 또는 "Add Server" 클릭
3. 정보 입력:
   ```
   Name: edu-api-mcp-server
   Description: 확장 가능한 교육 API 통합 MCP 서버
   Repository: https://github.com/Won-ahamada/KERIS_EDUmcp
   Author: Won-ahamada
   License: MIT
   ```
4. Submit 클릭

#### 3. 등록 확인

```bash
# Smithery 레지스트리에서 검색
smithery search edu-api

# 설치 테스트
smithery install edu-api-mcp-server
```

---

## 📦 사용자 설치 방법

배포가 완료되면 사용자들은 다음과 같이 설치할 수 있습니다.

### 방법 A: Smithery CLI (추천)

```bash
# Smithery CLI 설치
npm install -g @smithery/cli

# 서버 설치
smithery install edu-api-mcp-server

# Claude Desktop 자동 설정
# (Smithery가 자동으로 claude_desktop_config.json 업데이트)
```

### 방법 B: NPM 직접 설치

```bash
# 글로벌 설치
npm install -g edu-api-mcp-server

# Claude Desktop 수동 설정
# claude_desktop_config.json에 추가
```

### 방법 C: GitHub Clone

```bash
# 직접 클론
git clone https://github.com/Won-ahamada/KERIS_EDUmcp.git
cd KERIS_EDUmcp
npm install && npm run build
```

---

## ✅ 체크리스트

배포 전 확인사항:

- [x] `package.json` 완전히 설정됨
- [x] `smithery.json` 완전히 설정됨
- [x] GitHub 리포지토리 업로드 완료
- [x] 빌드 테스트 통과
- [ ] NPM 계정 생성
- [ ] NPM 로그인
- [ ] NPM 발행
- [ ] Smithery 계정 생성
- [ ] Smithery API 키 발급
- [ ] Smithery 레지스트리 등록

---

## 🚀 빠른 배포 (추천 순서)

### 단계 1: GitHub (✅ 완료)
이미 GitHub에 업로드되어 사용 가능합니다!

### 단계 2: NPM 발행 (선택)

```bash
# 1. NPM 로그인
npm login

# 2. 발행
npm publish --access public
```

### 단계 3: Smithery 등록 (선택)

1. https://smithery.ai 계정 생성
2. API 키 발급
3. 웹에서 서버 등록

---

## 🔧 문제 해결

### NPM 발행 실패

**문제**: "Package name already exists"

**해결**:
```json
// package.json
{
  "name": "@won-ahamada/edu-api-mcp-server"
}
```

### Smithery CLI 로그인 실패

**문제**: "ERR_USE_AFTER_CLOSE"

**해결**:
```bash
# 환경 변수로 API 키 설정
export SMITHERY_API_KEY=your_key_here
smithery list
```

### 빌드 폴더 누락

**문제**: "dist/ not found"

**해결**:
```bash
npm run build
ls dist/  # 확인
```

---

## 📊 배포 상태

| 플랫폼 | 상태 | URL |
|--------|------|-----|
| **GitHub** | ✅ 완료 | https://github.com/Won-ahamada/KERIS_EDUmcp |
| **NPM** | ⏳ 대기 | https://www.npmjs.com/package/edu-api-mcp-server |
| **Smithery** | ⏳ 대기 | https://smithery.ai/servers/edu-api-mcp-server |

---

## 📞 지원

- **GitHub Issues**: https://github.com/Won-ahamada/KERIS_EDUmcp/issues
- **Smithery 문서**: https://docs.smithery.ai
- **NPM 문서**: https://docs.npmjs.com

---

**Made with ❤️ for Korean Education Data**
