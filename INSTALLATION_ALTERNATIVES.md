# 설치 대안 방법 정리

EDU API MCP Server를 설치하는 다양한 방법을 비교하고 안내합니다.

---

## 🏆 추천 순위

| 순위 | 방법 | 난이도 | 속도 | 안정성 | 추천도 |
|------|------|--------|------|--------|--------|
| 🥇 | **NPM 발행** | ⭐ | ⚡⚡⚡ | ✅✅✅ | ⭐⭐⭐⭐⭐ |
| 🥈 | **GitHub Release** | ⭐⭐ | ⚡⚡ | ✅✅ | ⭐⭐⭐⭐ |
| 🥉 | **Git Clone** | ⭐⭐⭐ | ⚡ | ✅ | ⭐⭐⭐ |
| 4 | **설치 스크립트** | ⭐⭐ | ⚡⚡ | ✅✅ | ⭐⭐⭐⭐ |

---

## 🥇 방법 1: NPM 발행 (최고 추천!)

### 장점
- ✅ **한 줄 설치**: `npm install -g edu-api-mcp-server`
- ✅ **자동 업데이트**: `npm update -g edu-api-mcp-server`
- ✅ **버전 관리**: Semantic versioning
- ✅ **전역 명령어**: `edu-api-mcp` 어디서나 실행
- ✅ **의존성 자동**: NPM이 모두 처리

### 사용자 설치 방법
```bash
# 설치
npm install -g edu-api-mcp-server

# Claude Desktop 설정
{
  "mcpServers": {
    "edu-api": {
      "command": "edu-api-mcp"
    }
  }
}
```

### 개발자 설정
```bash
# 1. NPM 계정 생성 (https://www.npmjs.com/signup)
# 2. 로그인
npm login

# 3. 발행
npm publish --access public
```

**자세한 가이드**: [NPM_PUBLISH_GUIDE.md](./NPM_PUBLISH_GUIDE.md)

---

## 🥈 방법 2: GitHub Release (추천!)

### 장점
- ✅ 빌드된 파일 배포
- ✅ 버전 태그 관리
- ✅ 변경 로그 자동 생성
- ✅ 다운로드 통계

### 사용자 설치 방법
```bash
# 1. Release 다운로드
curl -L https://github.com/Won-ahamada/KERIS_EDUmcp/releases/download/v1.0.0/edu-api-mcp-server.tar.gz | tar xz

# 2. 설치
cd edu-api-mcp-server
npm install --production

# 3. Claude Desktop 설정
{
  "mcpServers": {
    "edu-api": {
      "command": "node",
      "args": ["/path/to/edu-api-mcp-server/dist/index.js"]
    }
  }
}
```

### 개발자 설정
```bash
# 1. 빌드
npm run build

# 2. 압축
tar -czf edu-api-mcp-server-v1.0.0.tar.gz \
  dist/ providers/ package.json README.md LICENSE

# 3. GitHub Release 생성
# - https://github.com/Won-ahamada/KERIS_EDUmcp/releases/new
# - Tag: v1.0.0
# - Title: Release v1.0.0
# - 파일 업로드
```

---

## 🥉 방법 3: Git Clone (기본)

### 장점
- ✅ 간단함
- ✅ 최신 코드

### 단점
- ❌ 빌드 필요
- ❌ 의존성 설치 필요
- ❌ 경로 설정 복잡

### 사용자 설치 방법
```bash
# 1. Clone
git clone https://github.com/Won-ahamada/KERIS_EDUmcp.git
cd KERIS_EDUmcp

# 2. 설치 및 빌드
npm install
npm run build

# 3. Claude Desktop 설정
{
  "mcpServers": {
    "edu-api": {
      "command": "node",
      "args": ["C:\\path\\to\\KERIS_EDUmcp\\dist\\index.js"]
    }
  }
}
```

---

## 🎯 방법 4: 설치 스크립트 (추천!)

### 장점
- ✅ 원클릭 설치
- ✅ 자동 설정
- ✅ 사용자 친화적

### Windows 설치 스크립트
```powershell
# install.ps1
$ErrorActionPreference = "Stop"

Write-Host "Installing EDU API MCP Server..."

# 1. Clone
git clone https://github.com/Won-ahamada/KERIS_EDUmcp.git
cd KERIS_EDUmcp

# 2. Install
npm install
npm run build

# 3. Global link
npm link

Write-Host "✅ Installation complete!"
Write-Host "Configure Claude Desktop with:"
Write-Host '{
  "mcpServers": {
    "edu-api": {
      "command": "edu-api-mcp"
    }
  }
}'
```

### macOS/Linux 설치 스크립트
```bash
#!/bin/bash
# install.sh

set -e

echo "🚀 Installing EDU API MCP Server..."

# 1. Clone
git clone https://github.com/Won-ahamada/KERIS_EDUmcp.git
cd KERIS_EDUmcp

# 2. Install
npm install
npm run build

# 3. Global link
sudo npm link

echo "✅ Installation complete!"
echo "Configure Claude Desktop at:"
echo "  ~/Library/Application Support/Claude/claude_desktop_config.json"
```

### 사용자 설치
```bash
# Windows
powershell -c "irm https://github.com/Won-ahamada/KERIS_EDUmcp/raw/main/install.ps1 | iex"

# macOS/Linux
curl -fsSL https://github.com/Won-ahamada/KERIS_EDUmcp/raw/main/install.sh | bash
```

---

## ❌ 불가능한 방법들

### Vercel/Netlify/AWS Lambda
- ❌ MCP는 stdio 기반, HTTP 서버 아님
- ❌ 웹 호스팅 플랫폼 사용 불가
- ❌ Claude Desktop은 **로컬** 연결만 지원

### Docker (비추천)
- ❌ stdio 전달이 복잡
- ❌ 설정 어려움
- ❌ Claude Desktop 통합 복잡
- 사용 가능하지만 과도하게 복잡함

---

## 📊 방법별 상세 비교

### 설치 과정

| 방법 | 단계 수 | 시간 | 기술 수준 |
|------|---------|------|----------|
| NPM | 1 | 10초 | 초급 |
| Release | 3 | 1분 | 초급 |
| Git Clone | 5 | 3분 | 중급 |
| 스크립트 | 1 | 2분 | 초급 |

### 업데이트 과정

| 방법 | 명령어 | 자동화 |
|------|--------|--------|
| NPM | `npm update -g` | ✅ |
| Release | 재다운로드 | ❌ |
| Git Clone | `git pull && npm run build` | ❌ |
| 스크립트 | 재실행 | 부분 |

### 사용자 경험

| 방법 | 난이도 | 만족도 |
|------|--------|--------|
| NPM | ⭐ | ⭐⭐⭐⭐⭐ |
| Release | ⭐⭐ | ⭐⭐⭐⭐ |
| Git Clone | ⭐⭐⭐ | ⭐⭐⭐ |
| 스크립트 | ⭐⭐ | ⭐⭐⭐⭐ |

---

## 🎯 최종 권장 사항

### 개발자가 해야 할 일

**1순위**: NPM 발행
```bash
npm login
npm publish --access public
```
- 가장 쉽고 전문적
- 사용자 만족도 최고
- 업데이트 관리 용이

**2순위**: GitHub Release + 설치 스크립트
- NPM 계정 없을 때
- 빠른 배포 원할 때

### 사용자에게 안내할 방법

**README.md에 명시**:
```markdown
## 설치 방법

### 방법 1: NPM (추천)
\`\`\`bash
npm install -g edu-api-mcp-server
\`\`\`

### 방법 2: 설치 스크립트
\`\`\`bash
curl -fsSL https://raw.githubusercontent.com/Won-ahamada/KERIS_EDUmcp/main/install.sh | bash
\`\`\`

### 방법 3: Git Clone
\`\`\`bash
git clone https://github.com/Won-ahamada/KERIS_EDUmcp.git
cd KERIS_EDUmcp
npm install && npm run build
\`\`\`
```

---

## 🚀 지금 바로 NPM 발행하기!

**가장 간단하고 효과적인 방법입니다:**

```bash
# 1. 로그인 (최초 1회)
npm login

# 2. 발행
npm publish --access public

# 3. 완료!
```

**사용자 설치**:
```bash
npm install -g edu-api-mcp-server
```

**끝!** 🎉

---

## 📞 추가 질문

- NPM 발행 도움: [NPM_PUBLISH_GUIDE.md](./NPM_PUBLISH_GUIDE.md)
- GitHub Issues: https://github.com/Won-ahamada/KERIS_EDUmcp/issues
