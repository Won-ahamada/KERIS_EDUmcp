# TOON Format Guide
## Token-Oriented Object Notation

---

## 개요

TOON은 **구조가 반복되는 데이터를 극도로 압축**하여 표현하는 데이터 포맷입니다.

### 핵심 아이디어
```
스키마는 한 번, 데이터는 테이블로
```

---

## 기본 문법

### 1. 배열 + 객체 구조

#### JSON
```json
{
  "users": [
    { "id": 1, "name": "Alice", "role": "admin" },
    { "id": 2, "name": "Bob", "role": "user" }
  ]
}
```

#### TOON
```toon
users[2]{id,name,role}:
  1,Alice,admin
  2,Bob,user
```

**구문 해석:**
- `users` - 배열/컬렉션 이름
- `[2]` - 요소 개수 (선택사항, 검증용)
- `{id,name,role}` - 각 객체의 필드명 (스키마)
- `:` - 데이터 시작 구분자
- 각 줄 = 한 객체의 데이터 (CSV 형식)

---

## 크기 비교

### 학교알리미 API 스펙

| 포맷 | 크기 | 압축률 | 가독성 |
|------|------|--------|--------|
| **JSON v1** | 33KB | 기준 | 😐 중복 많음 |
| **JSON v2** | 16KB | -52% | 😊 개선됨 |
| **TOON** | 4KB | -88% | 😍 매우 좋음 |

### 압축 효과 분석

**12개 엔드포인트 정의:**

```
JSON v1: 33,000 bytes
JSON v2: 16,000 bytes  (중복 제거)
TOON:     4,000 bytes  (테이블 형식)

절약: 29,000 bytes (88%)
```

---

## 장점

### ✅ 1. 극도의 압축
```toon
# TOON: 4KB
endpoints.student[6]{id,apiType,name,category,schoolTypes}:
  class-days,08,수업일수및수업시수,학사/학생,"02,03,04,05"
  school-status,62,학교현황,학사/학생,"02,03,04,05,06,07"
  student-gender,63,성별학생수,학사/학생,"02,03,04,05,06,07"
```

```json
// JSON v2: 16KB
{
  "endpointGroups": {
    "student": {
      "endpoints": [
        {
          "id": "class-days",
          "apiType": "08",
          "name": "수업일수및수업시수",
          "category": "학사/학생",
          "schoolTypes": ["02", "03", "04", "05"]
        },
        {
          "id": "school-status",
          "apiType": "62",
          "name": "학교현황",
          "category": "학사/학생",
          "schoolTypes": ["02", "03", "04", "05", "06", "07"]
        }
        // ...
      ]
    }
  }
}
```

### ✅ 2. 시각적 명확성

테이블 형식이라 **한눈에 파악 가능**:

```toon
schoolTypes[7]{code,name}:
  02,초등학교
  03,중학교
  04,고등학교
  05,특수학교
  06,그외
  07,각종학교
```

vs

```json
{
  "schoolTypes": {
    "02": "초등학교",
    "03": "중학교",
    "04": "고등학교",
    "05": "특수학교",
    "06": "그외",
    "07": "각종학교"
  }
}
```

### ✅ 3. 스프레드시트처럼 편집 가능

```toon
# 새 행 추가하기 쉬움
endpoints.student[7]{id,apiType,name,category,schoolTypes}:
  class-days,08,수업일수및수업시수,학사/학생,"02,03,04,05"
  school-status,62,학교현황,학사/학생,"02,03,04,05,06,07"
  new-endpoint,99,새로운정보,학사/학생,"02,03,04"  ← 추가!
```

### ✅ 4. 주석 친화적

```toon
# 이것은 주석입니다
users[2]{id,name,role}:
  1,Alice,admin  # 관리자
  2,Bob,user     # 일반 사용자
```

---

## TOON 파서 구현

### TypeScript 파서

```typescript
interface ToonSchema {
  name: string;
  count?: number;
  fields: string[];
}

interface ToonRow {
  [key: string]: any;
}

class ToonParser {
  /**
   * TOON 형식 파싱
   *
   * @example
   * users[2]{id,name,role}:
   *   1,Alice,admin
   *   2,Bob,user
   */
  parse(toonString: string): Record<string, ToonRow[]> {
    const result: Record<string, ToonRow[]> = {};
    const lines = toonString.split('\n');

    let currentSchema: ToonSchema | null = null;
    let currentData: ToonRow[] = [];

    for (const line of lines) {
      const trimmed = line.trim();

      // 주석 및 빈 줄 무시
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      // 스키마 라인 파싱: name[count]{fields}:
      if (trimmed.includes('{') && trimmed.includes('}:')) {
        // 이전 데이터 저장
        if (currentSchema && currentData.length > 0) {
          result[currentSchema.name] = currentData;
          currentData = [];
        }

        currentSchema = this.parseSchema(trimmed);
        continue;
      }

      // 데이터 라인 파싱
      if (currentSchema) {
        const row = this.parseDataLine(trimmed, currentSchema);
        currentData.push(row);
      }
    }

    // 마지막 데이터 저장
    if (currentSchema && currentData.length > 0) {
      result[currentSchema.name] = currentData;
    }

    return result;
  }

  private parseSchema(line: string): ToonSchema {
    // users[2]{id,name,role}:
    const match = line.match(/^([a-zA-Z0-9._-]+)(\[(\d+)\])?\{([^}]+)\}:/);

    if (!match) {
      throw new Error(`Invalid schema: ${line}`);
    }

    const [, name, , count, fieldsStr] = match;

    return {
      name,
      count: count ? parseInt(count) : undefined,
      fields: fieldsStr.split(',').map(f => f.trim()),
    };
  }

  private parseDataLine(line: string, schema: ToonSchema): ToonRow {
    // 1,Alice,admin
    const values = this.parseCsvLine(line);

    if (values.length !== schema.fields.length) {
      throw new Error(
        `Field count mismatch. Expected ${schema.fields.length}, got ${values.length}`
      );
    }

    const row: ToonRow = {};
    for (let i = 0; i < schema.fields.length; i++) {
      row[schema.fields[i]] = this.parseValue(values[i]);
    }

    return row;
  }

  private parseCsvLine(line: string): string[] {
    // CSV 파싱 (따옴표 처리 포함)
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    if (current) {
      values.push(current.trim());
    }

    return values;
  }

  private parseValue(value: string): any {
    // 숫자 변환
    if (/^\d+$/.test(value)) {
      return parseInt(value);
    }

    // 불린 변환
    if (value === 'true') return true;
    if (value === 'false') return false;

    // 따옴표 제거
    if (value.startsWith('"') && value.endsWith('"')) {
      return value.slice(1, -1);
    }

    return value;
  }

  /**
   * 파싱 결과를 JSON으로 변환
   */
  toJSON(parsed: Record<string, ToonRow[]>): string {
    return JSON.stringify(parsed, null, 2);
  }
}

// 사용 예시
const toonData = `
users[2]{id,name,role}:
  1,Alice,admin
  2,Bob,user

products[3]{id,name,price,inStock}:
  101,Laptop,999,true
  102,Mouse,25,true
  103,Keyboard,75,false
`;

const parser = new ToonParser();
const parsed = parser.parse(toonData);

console.log(parsed);
/*
{
  users: [
    { id: 1, name: 'Alice', role: 'admin' },
    { id: 2, name: 'Bob', role: 'user' }
  ],
  products: [
    { id: 101, name: 'Laptop', price: 999, inStock: true },
    { id: 102, name: 'Mouse', price: 25, inStock: true },
    { id: 103, name: 'Keyboard', price: 75, inStock: false }
  ]
}
*/
```

---

## 고급 기능

### 1. 중첩 경로 표현

```toon
# 점(.)으로 중첩 구조 표현
endpoints.student[6]{id,apiType,name}:
  class-days,08,수업일수
  school-status,62,학교현황

endpoints.teacher[2]{id,apiType,name}:
  teacher-position,22,직위별교원
  teacher-license,64,자격종별교원
```

파싱 후:
```json
{
  "endpoints": {
    "student": [...],
    "teacher": [...]
  }
}
```

### 2. 배열 필드 (따옴표로 감싸기)

```toon
endpoints[3]{id,schoolTypes}:
  basic,\"02,03,04,05,06,07\"
  special,\"03\"
  all,\"02,03,04,05\"
```

### 3. 멀티라인 값 (파이프 이스케이프)

```toon
docs[1]{title,content}:
  "User Guide","Welcome to our app|This is a multiline description|Enjoy!"
```

---

## 학교알리미 스펙에 적용

### 엔드포인트 정의 비교

#### JSON v2 (16KB)
```json
{
  "endpointGroups": {
    "student": {
      "requiresYear": true,
      "cacheTtl": 2592000,
      "endpoints": [
        {
          "id": "class-days",
          "apiType": "08",
          "name": "수업일수",
          "category": "학사/학생",
          "schoolTypes": ["02", "03", "04", "05"]
        }
        // ... 5개 더
      ]
    }
  }
}
```

#### TOON (4KB)
```toon
endpointGroups[6]{groupId,requiresYear,cacheTtl}:
  student,true,2592000

endpoints.student[6]{id,apiType,name,category,schoolTypes}:
  class-days,08,수업일수,학사/학생,"02,03,04,05"
  school-status,62,학교현황,학사/학생,"02,03,04,05,06,07"
  student-gender,63,성별학생수,학사/학생,"02,03,04,05,06,07"
  student-by-grade,09,학년별학생수,학사/학생,"02,03,04,05,06,07"
  student-transfer,10,전출입학생수,학사/학생,"02,03,04,05"
  enrollment,51,입학생현황,학사/학생,"02,03,04,05"
```

**한눈에 비교 가능! 📊**

---

## 사용 시나리오

### ✅ 적합한 경우
1. **구조가 반복되는 데이터**
   - API 엔드포인트 목록
   - 데이터베이스 스키마
   - 설정 파일

2. **테이블 형태 데이터**
   - 사용자 목록
   - 제품 카탈로그
   - 코드-이름 매핑

3. **사람이 직접 편집**
   - 설정 파일
   - 메타데이터
   - 문서

### ❌ 부적합한 경우
1. **구조가 불규칙한 데이터**
   - 계층이 깊은 JSON
   - 필드가 객체마다 다른 경우

2. **프로그램 간 통신**
   - REST API 응답 (JSON 사용)
   - 실시간 데이터 (JSON/Protocol Buffers)

3. **바이너리 효율성 필요**
   - 대용량 데이터 전송
   - 성능이 중요한 경우

---

## TOON vs 기타 포맷

| 포맷 | 크기 | 가독성 | 편집 용이성 | 파싱 복잡도 |
|------|------|--------|-------------|-------------|
| **JSON** | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| **YAML** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **CSV** | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **TOON** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

---

## 실전 적용

### MCP 서버에서 TOON 사용

```typescript
import { ToonParser } from './toon-parser';
import fs from 'fs';

// 1. TOON 스펙 로드
const toonSpec = fs.readFileSync('school-alrimi-api-spec.toon', 'utf-8');

// 2. 파싱
const parser = new ToonParser();
const spec = parser.parse(toonSpec);

// 3. Endpoint Factory에 전달
const endpoints = spec['endpoints.student'].map(data => ({
  id: data.id,
  apiType: data.apiType,
  name: data.name,
  category: data.category,
  schoolTypes: data.schoolTypes.split(','),
}));

// 4. 사용
console.log(endpoints);
// [
//   { id: 'class-days', apiType: '08', ... },
//   { id: 'school-status', apiType: '62', ... },
//   ...
// ]
```

---

## 확장 아이디어

### 1. TOON → JSON 변환기
```bash
toon-cli convert school-alrimi.toon --output school-alrimi.json
```

### 2. JSON → TOON 변환기
```bash
toon-cli compress large-config.json --output config.toon
```

### 3. 실시간 검증
```typescript
const schema = parser.parseSchema(toonLine);
// 데이터 추가 시 자동 검증
parser.validate(newRow, schema);
```

### 4. 버전 관리 친화적
```diff
 endpoints.student[6]{id,apiType,name,category,schoolTypes}:
   class-days,08,수업일수,학사/학생,"02,03,04,05"
+  new-endpoint,99,새정보,학사/학생,"02,03,04"
```

---

## 결론

### TOON의 핵심 가치

> **"스키마는 한 번, 데이터는 테이블로"**

### 언제 사용하나?

**✅ YES:**
- 구조 반복 데이터 (API 스펙, 설정)
- 사람이 편집하는 파일
- 크기 최적화 필요

**❌ NO:**
- 프로그램 간 통신
- 복잡한 중첩 구조
- 실시간 데이터

### 최종 비교

| 지표 | JSON v1 | JSON v2 | TOON |
|------|---------|---------|------|
| 크기 | 33KB | 16KB | **4KB** |
| 압축률 | 0% | -52% | **-88%** |
| 가독성 | 😐 | 😊 | **😍** |
| 편집성 | 😐 | 😊 | **😍** |
| 새 항목 추가 | 50줄 | 5줄 | **1줄** |

---

**TOON: 구조가 반복되는 데이터의 완벽한 솔루션** 🚀
