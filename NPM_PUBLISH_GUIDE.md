# NPM 발행 가이드

EDU API MCP Server를 NPM 레지스트리에 발행하여 누구나 쉽게 설치할 수 있도록 합니다.

---

## 🎯 왜 NPM 발행인가?

### ✅ 장점

1. **사용자 친화적**
   ```bash
   npm install -g edu-api-mcp-server
   ```
   한 줄로 설치 완료!

2. **자동 빌드**
   - NPM이 설치 시 자동으로 `prepublishOnly` 실행
   - 사용자는 빌드된 파일 받음

3. **버전 관리**
   - Semantic versioning 지원
   - 업데이트 관리 용이

4. **Global 설치**
   - 어디서나 `edu-api-mcp` 명령으로 실행 가능

5. **의존성 자동 관리**
   - NPM이 모든 의존성 자동 설치

---

## 🚀 NPM 발행 방법

### 1단계: NPM 계정 생성

#### 웹에서 생성
1. https://www.npmjs.com/signup 방문
2. 계정 정보 입력
3. 이메일 인증

#### CLI로 생성
```bash
npm adduser
```

---

### 2단계: 로그인

```bash
npm login
```

입력 사항:
- **Username**: NPM 사용자명
- **Password**: NPM 비밀번호
- **Email**: 등록된 이메일

확인:
```bash
npm whoami
# 출력: your-username
```

---

### 3단계: 패키지 이름 확인

```bash
# 현재 이름이 사용 가능한지 확인
npm search edu-api-mcp-server
```

**만약 이미 사용 중이면**:
```json
// package.json
{
  "name": "@your-username/edu-api-mcp-server"
}
```

Scoped package로 변경 (무조건 사용 가능!)

---

### 4단계: 발행 전 테스트

```bash
# 1. 클린 빌드
rm -rf dist/ node_modules/
npm install
npm run build

# 2. 로컬 테스트
npm link
edu-api-mcp  # 또는 node dist/index.js

# 3. 패키지 내용 확인
npm pack --dry-run
```

---

### 5단계: 발행!

```bash
# 처음 발행
npm publish --access public

# 성공 메시지
# + edu-api-mcp-server@1.0.0
```

**Scoped package인 경우**:
```bash
npm publish --access public
```

---

## 📦 발행 후 사용 방법

### 사용자 설치

```bash
# Global 설치
npm install -g edu-api-mcp-server

# 또는 npx로 직접 실행
npx edu-api-mcp-server
```

### Claude Desktop 설정

```json
{
  "mcpServers": {
    "edu-api": {
      "command": "npx",
      "args": ["-y", "edu-api-mcp-server"]
    }
  }
}
```

또는 글로벌 설치 후:
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

## 🔄 업데이트 발행

### 버전 업그레이드

```bash
# Patch (1.0.0 → 1.0.1) - 버그 수정
npm version patch

# Minor (1.0.0 → 1.1.0) - 새 기능
npm version minor

# Major (1.0.0 → 2.0.0) - Breaking change
npm version major
```

### 재발행

```bash
# 자동으로 git tag 생성됨
git push --follow-tags

# NPM 발행
npm publish
```

---

## ⚠️ 발행 전 체크리스트

- [ ] `package.json` 정보 완전히 작성됨
  - name, version, description
  - repository, homepage, bugs
  - keywords (검색 최적화)

- [ ] `README.md` 작성됨
  - 설치 방법
  - 사용 예시
  - API 키 설정 방법

- [ ] `LICENSE` 파일 포함

- [ ] `.npmignore` 또는 `package.json의 files` 설정
  - 불필요한 파일 제외
  - 필수 파일만 포함

- [ ] 빌드 테스트 완료
  ```bash
  npm run build
  npm start
  ```

- [ ] `prepublishOnly` 스크립트 확인
  ```json
  {
    "scripts": {
      "prepublishOnly": "npm run build"
    }
  }
  ```

---

## 🐛 문제 해결

### Q: 패키지 이름이 이미 사용 중입니다

**A:** Scoped package 사용:
```json
{
  "name": "@won-ahamada/edu-api-mcp-server"
}
```

### Q: 401 Unauthorized

**A:** 로그인 확인:
```bash
npm logout
npm login
npm whoami
```

### Q: 403 Forbidden

**A:** 퍼블릭 설정:
```bash
npm publish --access public
```

### Q: 빌드 파일이 포함되지 않습니다

**A:** `package.json` files 확인:
```json
{
  "files": [
    "dist",
    "providers",
    "README.md",
    "LICENSE"
  ]
}
```

---

## 📊 NPM vs 다른 방법 비교

| 방법 | 설치 난이도 | 업데이트 | 버전 관리 | 추천도 |
|------|------------|---------|-----------|---------|
| **NPM 발행** | ⭐ 쉬움 | 자동 | 완벽 | ⭐⭐⭐⭐⭐ |
| GitHub clone | ⭐⭐⭐ 어려움 | 수동 | Git tag | ⭐⭐ |
| Smithery | ⭐⭐ 보통 | 자동 | 자동 | ⭐⭐⭐ (빌드 이슈) |
| Docker | ⭐⭐⭐⭐ 복잡 | 수동 | Tag | ⭐ (stdio 어려움) |

---

## 🎯 권장 전략

### 1차: NPM 발행 (즉시!)
```bash
npm login
npm publish --access public
```

### 2차: README에 설치 방법 추가
```markdown
## 설치

\`\`\`bash
npm install -g edu-api-mcp-server
\`\`\`
```

### 3차: GitHub README 배지 추가
```markdown
[![npm version](https://badge.fury.io/js/edu-api-mcp-server.svg)](https://www.npmjs.com/package/edu-api-mcp-server)
[![downloads](https://img.shields.io/npm/dm/edu-api-mcp-server.svg)](https://www.npmjs.com/package/edu-api-mcp-server)
```

---

## 📈 발행 후 할 일

1. **NPM 페이지 확인**
   - https://www.npmjs.com/package/edu-api-mcp-server

2. **README 업데이트**
   - NPM 설치 방법 추가
   - NPM 배지 추가

3. **사용자 피드백 수집**
   - GitHub Issues
   - NPM 리뷰

4. **정기적 업데이트**
   - 버그 수정
   - 새 기능 추가
   - 의존성 업데이트

---

## 🆘 도움말

- **NPM 문서**: https://docs.npmjs.com/
- **발행 가이드**: https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry
- **버전 관리**: https://semver.org/

---

## 🎉 NPM 발행이 가장 좋은 방법입니다!

**간단하고, 안정적이며, 사용자 친화적입니다.**

발행 준비가 되면:
```bash
npm login
npm publish --access public
```

**끝!** 🚀
