# 배포 가이드

EDU API MCP Server의 배포 및 사용 가이드입니다.

## 📋 목차

1. [GitHub 저장소 확인](#github-저장소-확인)
2. [Claude Desktop 설치](#claude-desktop-설치)
3. [로컬 설치 및 실행](#로컬-설치-및-실행)
4. [Smithery 배포](#smithery-배포)
5. [API 키 설정](#api-키-설정)
6. [문제 해결](#문제-해결)

---

## 🔗 GitHub 저장소 확인

프로젝트가 성공적으로 업로드되었습니다:

**저장소 URL**: https://github.com/Won-ahamada/KERIS_EDUmcp

### 저장소 구조

```
KERIS_EDUmcp/
├── mcp-server/              # MCP 서버 메인 프로젝트
│   ├── src/                 # 소스 코드
│   ├── providers/           # TOON 파일들
│   ├── README.md            # 상세 문서
│   ├── package.json
│   └── smithery.json        # Smithery 설정
├── *.toon                   # TOON 스펙 파일들
├── *.json                   # API 스펙 파일들
└── *.md                     # 문서들
```

---

## 🖥️ Claude Desktop 설치

### 1. Claude Desktop 다운로드

Windows/macOS에서 Claude Desktop 앱을 다운로드하여 설치합니다.

### 2. 설정 파일 위치

- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

---

## 💻 로컬 설치 및 실행

### 방법 1: GitHub에서 클론

```bash
# 1. 저장소 클론
git clone https://github.com/Won-ahamada/KERIS_EDUmcp.git
cd KERIS_EDUmcp/mcp-server

# 2. 의존성 설치
npm install

# 3. 빌드
npm run build
```

### 방법 2: 직접 다운로드

1. https://github.com/Won-ahamada/KERIS_EDUmcp 방문
2. "Code" → "Download ZIP" 클릭
3. 압축 해제 후 `mcp-server` 폴더로 이동
4. 터미널에서 `npm install && npm run build` 실행

### Claude Desktop 설정

설정 파일(`claude_desktop_config.json`)에 다음 추가:

#### Windows 예시

```json
{
  "mcpServers": {
    "edu-api": {
      "command": "node",
      "args": [
        "C:\\Users\\YourName\\KERIS_EDUmcp\\mcp-server\\dist\\index.js"
      ]
    }
  }
}
```

#### macOS 예시

```json
{
  "mcpServers": {
    "edu-api": {
      "command": "node",
      "args": [
        "/Users/yourname/KERIS_EDUmcp/mcp-server/dist/index.js"
      ]
    }
  }
}
```

### 재시작

Claude Desktop을 재시작하면 MCP 서버가 자동으로 로드됩니다.

---

## 🚢 Smithery 배포

Smithery는 MCP 서버를 쉽게 배포하고 공유할 수 있는 플랫폼입니다.

### 관리자용: 배포 방법

```bash
# 1. Smithery CLI 설치 (최초 1회)
npm install -g @smithery/cli

# 2. 로그인
smithery login

# 3. 프로젝트 루트에서 배포
cd KERIS_EDUmcp/mcp-server
smithery publish
```

### 사용자용: 설치 방법

#### 방법 1: Smithery CLI 사용

```bash
smithery install edu-api-mcp-server
```

#### 방법 2: Claude Desktop 설정

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

---

## 🔑 API 키 설정

### 필요한 API 키

1. **학교알리미 API 키**
   - 발급 URL: https://www.schoolinfo.go.kr/
   - 회원가입 → API 신청

2. **RISS API 키**
   - 발급 URL: https://www.riss.kr/
   - 회원가입 → 오픈 API 신청

### 설정 방법

#### 방법 1: 환경 변수 (권장)

Claude Desktop 설정에서:

```json
{
  "mcpServers": {
    "edu-api": {
      "command": "node",
      "args": ["C:\\path\\to\\dist\\index.js"],
      "env": {
        "SCHOOL_ALRIMI_API_KEY": "your_school_alrimi_key",
        "RISS_API_KEY": "your_riss_key"
      }
    }
  }
}
```

#### 방법 2: .env 파일

프로젝트 루트에 `.env` 파일 생성:

```env
SCHOOL_ALRIMI_API_KEY=your_school_alrimi_key
RISS_API_KEY=your_riss_key
```

---

## 🐛 문제 해결

### 문제 1: 서버가 시작되지 않음

**증상**: Claude Desktop에서 MCP 서버를 찾을 수 없음

**해결책**:
1. 경로가 올바른지 확인 (절대 경로 사용)
2. `npm run build`로 빌드했는지 확인
3. Node.js 버전 확인 (>= 20.0.0 필요)
4. Claude Desktop 로그 확인

### 문제 2: API 호출 실패

**증상**: "API key is missing" 또는 "Authentication failed"

**해결책**:
1. API 키가 올바르게 설정되었는지 확인
2. API 키 유효 기간 확인
3. API 사용량 제한 확인

### 문제 3: 빌드 에러

**증상**: `npm run build` 실행 시 에러

**해결책**:
```bash
# 1. node_modules 삭제 및 재설치
rm -rf node_modules package-lock.json
npm install

# 2. 다시 빌드
npm run build
```

### 문제 4: Provider를 찾을 수 없음

**증상**: "No providers found"

**해결책**:
1. `providers/` 폴더에 `.toon` 파일이 있는지 확인
2. TOON 파일 문법이 올바른지 확인
3. 서버 재시작

### 로그 확인

**Windows**:
```powershell
# Claude Desktop 로그 위치
%APPDATA%\Claude\logs\
```

**macOS**:
```bash
# Claude Desktop 로그 위치
~/Library/Logs/Claude/
```

---

## ✅ 동작 확인

### 1. MCP 서버 로드 확인

Claude Desktop에서 새 대화를 시작하고:

```
사용 가능한 MCP 도구를 보여줘
```

다음과 같은 도구들이 표시되어야 합니다:
- `school-alrimi_school-basic-info`
- `school-alrimi_class-days`
- `riss_search_riss_thesis`
- 등등...

### 2. API 호출 테스트

```
학교알리미 API를 사용해서 서울시 초등학교 정보를 조회해줘
```

정상적으로 응답이 오면 성공!

---

## 📊 배포 체크리스트

- [ ] GitHub 저장소 확인 ✅
- [ ] 로컬에서 빌드 테스트
- [ ] Claude Desktop 설정 완료
- [ ] API 키 설정
- [ ] MCP 도구 로드 확인
- [ ] 실제 API 호출 테스트
- [ ] (선택) Smithery 배포

---

## 🆘 지원

문제가 계속되면:

1. **GitHub Issues**: https://github.com/Won-ahamada/KERIS_EDUmcp/issues
2. **문서 확인**: `mcp-server/README.md`
3. **TOON 가이드**: `toon-format-guide.md`

---

## 🎉 성공!

모든 단계가 완료되었습니다. 이제 Claude와 함께 한국 교육 데이터를 활용할 수 있습니다!

### 다음 단계

- 새 Provider 추가해보기 (`.toon` 파일만 넣으면 됩니다!)
- Custom Tool 만들어보기
- 다른 사용자와 공유하기

---

**Made with ❤️ for Korean Education Data**
