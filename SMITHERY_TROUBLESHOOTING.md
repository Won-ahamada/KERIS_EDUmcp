# Smithery 배포 에러 해결 가이드

## 🔴 에러: "Failed to read repository files"

### 현재 상황
- **에러 메시지**: "Failed to read repository files. This appears to be a system issue."
- **발생 시점**: Validating files 단계
- **커밋**: 90419d7
- **저장소**: https://github.com/Won-ahamada/KERIS_EDUmcp (Public)
- **모든 파일 커밋 완료**: ✅

---

## 🔍 문제 원인 분석

### 1. Smithery 시스템 이슈 (가능성 높음)
Smithery의 GitHub API 접근에 일시적 문제가 있을 수 있습니다.

### 2. 저장소 크기 문제
- 현재 `node_modules/` 포함 시 저장소가 클 수 있음
- `.gitignore`에 있지만 Smithery가 clone 시도 시 문제 발생 가능

### 3. 브랜치 문제
- 기본 브랜치가 `main`인지 확인 필요
- Smithery가 잘못된 브랜치를 참조할 수 있음

---

## ✅ 해결 방안 (우선순위 순)

---

## 옵션 1: 시간 대기 및 재시도 ⏰
**난이도**: ⭐ (쉬움)
**예상 성공률**: 60%
**소요 시간**: 30분 ~ 2시간

### 실행 방법
```
1. 30분 정도 대기
2. Smithery에서 다시 Deploy 클릭
3. 여전히 실패하면 1-2시간 후 재시도
```

### 이유
- "This appears to be a system issue" 메시지는 Smithery 서버 문제를 시사
- 일시적 GitHub API rate limit 가능성
- Smithery 배포 큐가 혼잡할 수 있음

### 장점
- 추가 작업 불필요
- 가장 간단

### 단점
- 시간이 걸림
- 근본 원인 미해결 시 다시 발생 가능

---

## 옵션 2: 최소 구조로 단순화 🔧
**난이도**: ⭐⭐ (보통)
**예상 성공률**: 75%
**소요 시간**: 15분

### 실행 방법

#### Step 1: 필수 파일만 남기고 단순화
```bash
# 백업 브랜치 생성
git checkout -b smithery-minimal

# 불필요한 파일 임시 제거
git rm -r docs/
git rm -r examples/
git rm PHASE1_SUMMARY.md SMITHERY_DEPLOYMENT.md

# 커밋
git commit -m "chore: Minimal config for Smithery deployment"
git push -u origin smithery-minimal
```

#### Step 2: Smithery에서 새 브랜치로 배포
- Branch: `smithery-minimal`로 선택

#### Step 3: 성공 시 main 브랜치로 다시 배포

### 이유
- 저장소 크기 축소
- 파일 수 감소로 읽기 부담 감소
- Smithery 파서가 처리하기 쉬운 구조

### 장점
- 빠른 테스트 가능
- 문제 원인 파악 용이

### 단점
- 브랜치 관리 필요
- 임시 해결책

---

## 옵션 3: smithery.json 단순화 📝
**난이도**: ⭐ (쉬움)
**예상 성공률**: 50%
**소요 시간**: 5분

### 실행 방법

현재 smithery.json을 최소한으로 축소:

```json
{
  "name": "KERIS EDU MCP Server",
  "description": "Korean Education API MCP Server",
  "version": "1.0.0",
  "author": "Won-ahamada",
  "repository": {
    "type": "git",
    "url": "https://github.com/Won-ahamada/KERIS_EDUmcp"
  }
}
```

### 이유
- 복잡한 configSchema가 파싱 문제를 일으킬 수 있음
- 최소 설정으로 배포 후 점진적 확장

### 장점
- 빠른 수정
- 위험 낮음

### 단점
- 기능 제한적
- 근본 해결 아닐 수 있음

---

## 옵션 4: 저장소 권한 및 GitHub App 재연결 🔐
**난이도**: ⭐⭐ (보통)
**예상 성공률**: 70%
**소요 시간**: 10분

### 실행 방법

#### Step 1: GitHub에서 Smithery App 권한 확인
1. GitHub Settings → Applications → Authorized OAuth Apps
2. "Smithery" 찾기
3. 권한 확인 (Repository access: All repositories 또는 Selected)

#### Step 2: 권한 재부여
```
1. Smithery 앱 권한 Revoke
2. Smithery 웹사이트에서 다시 로그인
3. 저장소 접근 권한 다시 부여
4. 배포 재시도
```

#### Step 3: Repository 접근 설정 확인
- Repository Settings → Manage access
- Smithery bot 접근 권한 확인

### 이유
- GitHub App 토큰 만료 가능성
- 권한 변경으로 접근 제한 발생 가능

### 장점
- 권한 문제 해결
- 향후 안정적 배포

### 단점
- GitHub 설정 접근 필요

---

## 옵션 5: 대체 배포 방식 - NPM 퍼블리싱 📦
**난이도**: ⭐⭐⭐ (어려움)
**예상 성공률**: 90%
**소요 시간**: 30분

### 실행 방법

#### Step 1: NPM 계정 준비
```bash
npm login
```

#### Step 2: 패키지 준비
```bash
# package.json 확인 (이미 준비됨)
npm run build

# 배포 테스트
npm publish --dry-run
```

#### Step 3: NPM 퍼블리시
```bash
npm publish --access public
```

#### Step 4: Smithery에서 NPM 패키지로 설치
- Smithery는 NPM 패키지도 지원
- Package name: `edu-api-mcp-server`

### 이유
- Smithery의 GitHub 통합 우회
- NPM은 더 안정적인 배포 방식
- 이미 NPM 퍼블리싱 준비 완료 (NPM_PUBLISH_GUIDE.md 참조)

### 장점
- 가장 안정적
- 버전 관리 용이
- 다른 사용자도 쉽게 설치 가능

### 단점
- NPM 계정 필요
- 추가 설정 필요

---

## 옵션 6: 로컬 MCP 서버로 우회 💻
**난이도**: ⭐⭐ (보통)
**예상 성공률**: 100%
**소요 시간**: 10분

### 실행 방법

#### Step 1: 로컬 빌드
```bash
cd KERIS_EDUmcp
npm run build
```

#### Step 2: Claude Desktop 설정
`~/Library/Application Support/Claude/claude_desktop_config.json` (Mac)
`%APPDATA%\Claude\claude_desktop_config.json` (Windows)

```json
{
  "mcpServers": {
    "keris-edu": {
      "command": "node",
      "args": [
        "C:/Users/ahama/Desktop/AI CLIs/KERIS_EDUmcp/dist/index.js"
      ],
      "env": {
        "CACHE_ENABLED": "true",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

#### Step 3: Claude Desktop 재시작

### 이유
- Smithery 우회
- 즉시 테스트 가능

### 장점
- 100% 작동 보장
- 디버깅 용이
- API 키 관리 쉬움

### 단점
- Smithery의 편의 기능 사용 불가
- 로컬에서만 작동

---

## 옵션 7: 새 저장소 생성 및 재배포 🆕
**난이도**: ⭐⭐⭐ (어려움)
**예상 성공률**: 80%
**소요 시간**: 20분

### 실행 방법

#### Step 1: 새 저장소 생성
```bash
# GitHub에서 새 저장소 생성: KERIS_EDUmcp_v2

# 필수 파일만 복사
mkdir ../KERIS_EDUmcp_v2
cd ../KERIS_EDUmcp_v2

# Git 초기화
git init
git remote add origin https://github.com/Won-ahamada/KERIS_EDUmcp_v2
```

#### Step 2: 필수 파일만 복사
```bash
# 필수 파일들
cp -r ../KERIS_EDUmcp/src .
cp -r ../KERIS_EDUmcp/providers .
cp ../KERIS_EDUmcp/package.json .
cp ../KERIS_EDUmcp/tsconfig.json .
cp ../KERIS_EDUmcp/smithery.json .
cp ../KERIS_EDUmcp/Dockerfile .
cp ../KERIS_EDUmcp/.dockerignore .
cp ../KERIS_EDUmcp/README.md .
cp ../KERIS_EDUmcp/LICENSE .

# 커밋
git add .
git commit -m "Initial commit: Clean MCP server setup"
git push -u origin main
```

#### Step 3: 새 저장소로 Smithery 배포

### 이유
- 깨끗한 히스토리
- 이전 커밋의 문제 회피
- Smithery 캐시 초기화

### 장점
- 깨끗한 시작
- 문제 원인 완전 제거

### 단점
- 작업량 많음
- 히스토리 손실
- URL 변경

---

## 📊 옵션 비교표

| 옵션 | 난이도 | 성공률 | 시간 | 추천도 |
|------|--------|--------|------|--------|
| 1. 시간 대기 | ⭐ | 60% | 30분-2시간 | ⭐⭐⭐ |
| 2. 최소 구조 | ⭐⭐ | 75% | 15분 | ⭐⭐⭐⭐ |
| 3. JSON 단순화 | ⭐ | 50% | 5분 | ⭐⭐ |
| 4. 권한 재연결 | ⭐⭐ | 70% | 10분 | ⭐⭐⭐⭐ |
| 5. NPM 퍼블리싱 | ⭐⭐⭐ | 90% | 30분 | ⭐⭐⭐⭐⭐ |
| 6. 로컬 실행 | ⭐⭐ | 100% | 10분 | ⭐⭐⭐⭐⭐ |
| 7. 새 저장소 | ⭐⭐⭐ | 80% | 20분 | ⭐⭐⭐ |

---

## 🎯 권장 실행 순서

### Phase 1: 즉시 시도 (0-10분)
1. **옵션 6 (로컬 실행)** - 일단 작동 확인
2. **옵션 3 (JSON 단순화)** - 빠른 테스트
3. **옵션 1 (시간 대기)** - 30분 후 재시도

### Phase 2: 근본 해결 (10-30분)
4. **옵션 4 (권한 재연결)** - GitHub 설정 확인
5. **옵션 2 (최소 구조)** - 테스트 브랜치 생성

### Phase 3: 최종 대안 (30분+)
6. **옵션 5 (NPM 퍼블리싱)** - 가장 안정적
7. **옵션 7 (새 저장소)** - 최후의 수단

---

## 🚀 즉시 실행 가능한 빠른 해결책

### Quick Fix 1: 로컬 실행 (5분)
```bash
cd KERIS_EDUmcp
npm run build

# Claude Desktop 설정 파일 열기
notepad "%APPDATA%\Claude\claude_desktop_config.json"

# 다음 추가:
{
  "mcpServers": {
    "keris-edu": {
      "command": "node",
      "args": ["C:/Users/ahama/Desktop/AI CLIs/KERIS_EDUmcp/dist/index.js"]
    }
  }
}

# Claude Desktop 재시작
```

### Quick Fix 2: smithery.json 최소화 (2분)
```bash
# smithery.json을 다음으로 교체:
{
  "name": "KERIS EDU MCP Server",
  "description": "Korean Education API MCP Server",
  "version": "1.0.0"
}

git add smithery.json
git commit -m "fix: Simplify smithery.json"
git push

# Smithery에서 재배포
```

---

## 📞 추가 지원

### Smithery Support
- Discord: https://discord.gg/smithery
- GitHub Issues: https://github.com/smithery-ai/smithery

### 프로젝트 Issues
- https://github.com/Won-ahamada/KERIS_EDUmcp/issues

---

**업데이트**: 2025-11-05
**상태**: 배포 에러 해결 중
**현재 커밋**: 90419d7
