/**
 * TOON (Token-Oriented Object Notation) Parser
 *
 * 구조가 반복되는 데이터를 극도로 압축한 포맷의 파서
 *
 * @example
 * users[2]{id,name,role}:
 *   1,Alice,admin
 *   2,Bob,user
 *
 * → { users: [{ id: 1, name: 'Alice', role: 'admin' }, ...] }
 */

// ============================================
// 타입 정의
// ============================================

export interface ToonSchema {
  /** 테이블 이름 (예: users, endpoints.student) */
  name: string;
  /** 예상 행 개수 (검증용, 선택사항) */
  count?: number;
  /** 필드명 목록 */
  fields: string[];
}

export interface ToonRow {
  [key: string]: any;
}

export interface ToonParseResult {
  [tableName: string]: ToonRow[];
}

export interface ToonParserOptions {
  /** 주석 문자 (기본값: '#') */
  commentChar?: string;
  /** 행 개수 불일치 시 에러 발생 (기본값: true) */
  strictCount?: boolean;
  /** 타입 자동 변환 (기본값: true) */
  autoConvert?: boolean;
  /** 중첩 경로 지원 (예: endpoints.student → { endpoints: { student: [...] } }) */
  nestedPaths?: boolean;
}

// ============================================
// TOON 파서
// ============================================

export class ToonParser {
  private options: Required<ToonParserOptions>;

  constructor(options: ToonParserOptions = {}) {
    this.options = {
      commentChar: options.commentChar ?? '#',
      strictCount: options.strictCount ?? true,
      autoConvert: options.autoConvert ?? true,
      nestedPaths: options.nestedPaths ?? true,
    };
  }

  /**
   * TOON 문자열을 파싱하여 객체로 변환
   */
  parse(toonString: string): ToonParseResult {
    const lines = toonString.split('\n');
    const tables: Map<string, ToonRow[]> = new Map();

    let currentSchema: ToonSchema | null = null;
    let currentData: ToonRow[] = [];
    let lineNumber = 0;

    for (const line of lines) {
      lineNumber++;
      const trimmed = this.removeComment(line).trim();

      // 빈 줄 무시
      if (!trimmed) {
        continue;
      }

      try {
        // 스키마 라인인지 확인
        if (this.isSchemaLine(trimmed)) {
          // 이전 테이블 저장
          if (currentSchema && currentData.length > 0) {
            this.validateCount(currentSchema, currentData, lineNumber);
            tables.set(currentSchema.name, currentData);
            currentData = [];
          }

          currentSchema = this.parseSchema(trimmed);
          continue;
        }

        // 데이터 라인 파싱
        if (currentSchema) {
          const row = this.parseDataLine(trimmed, currentSchema);
          currentData.push(row);
        } else {
          throw new Error('Data line found before schema definition');
        }
      } catch (error: any) {
        throw new Error(`Line ${lineNumber}: ${error.message}`);
      }
    }

    // 마지막 테이블 저장
    if (currentSchema && currentData.length > 0) {
      this.validateCount(currentSchema, currentData, lineNumber);
      tables.set(currentSchema.name, currentData);
    }

    // 중첩 경로 처리
    if (this.options.nestedPaths) {
      return this.buildNestedObject(tables);
    }

    return Object.fromEntries(tables);
  }

  /**
   * 스키마 라인 여부 확인
   */
  private isSchemaLine(line: string): boolean {
    return line.includes('{') && line.includes('}:');
  }

  /**
   * 주석 제거
   */
  private removeComment(line: string): string {
    const commentIndex = line.indexOf(this.options.commentChar);
    if (commentIndex === -1) {
      return line;
    }

    // 따옴표 안의 주석 문자는 무시
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') {
        inQuotes = !inQuotes;
      }
      if (line[i] === this.options.commentChar && !inQuotes) {
        return line.substring(0, i);
      }
    }

    return line;
  }

  /**
   * 스키마 라인 파싱
   *
   * @example
   * users[2]{id,name,role}:
   * endpoints.student[6]{id,apiType,name}:
   */
  private parseSchema(line: string): ToonSchema {
    // Regex: name[count]{fields}:
    const match = line.match(/^([a-zA-Z0-9._-]+)(?:\[(\d+)\])?\{([^}]+)\}:/);

    if (!match) {
      throw new Error(`Invalid schema syntax: ${line}`);
    }

    const [, name, count, fieldsStr] = match;

    return {
      name,
      count: count ? parseInt(count, 10) : undefined,
      fields: fieldsStr.split(',').map(f => f.trim()),
    };
  }

  /**
   * 데이터 라인 파싱
   *
   * @example
   * 1,Alice,admin
   * "Laptop 15\"",999,true
   */
  private parseDataLine(line: string, schema: ToonSchema): ToonRow {
    const values = this.parseCsvLine(line);

    if (values.length !== schema.fields.length) {
      throw new Error(
        `Field count mismatch. Expected ${schema.fields.length} fields ` +
        `[${schema.fields.join(', ')}], got ${values.length} values`
      );
    }

    const row: ToonRow = {};
    for (let i = 0; i < schema.fields.length; i++) {
      const fieldName = schema.fields[i];
      const rawValue = values[i];

      row[fieldName] = this.options.autoConvert
        ? this.parseValue(rawValue)
        : rawValue;
    }

    return row;
  }

  /**
   * CSV 라인 파싱 (따옴표 처리 포함)
   */
  private parseCsvLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    let escaped = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (escaped) {
        current += char;
        escaped = false;
        continue;
      }

      if (char === '\\') {
        escaped = true;
        continue;
      }

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    if (current || line.endsWith(',')) {
      values.push(current.trim());
    }

    return values;
  }

  /**
   * 값 타입 변환
   */
  private parseValue(value: string): any {
    // 빈 문자열
    if (value === '') {
      return null;
    }

    // 따옴표로 감싸진 문자열 (명시적)
    if (value.startsWith('"') && value.endsWith('"')) {
      return value.slice(1, -1).replace(/\\"/g, '"');
    }

    // null
    if (value === 'null') {
      return null;
    }

    // 불린
    if (value === 'true') return true;
    if (value === 'false') return false;

    // 숫자 (정수)
    if (/^-?\d+$/.test(value)) {
      return parseInt(value, 10);
    }

    // 숫자 (실수)
    if (/^-?\d+\.\d+$/.test(value)) {
      return parseFloat(value);
    }

    // 그 외는 문자열
    return value;
  }

  /**
   * 행 개수 검증
   */
  private validateCount(
    schema: ToonSchema,
    data: ToonRow[],
    lineNumber: number
  ): void {
    if (!this.options.strictCount || !schema.count) {
      return;
    }

    if (data.length !== schema.count) {
      throw new Error(
        `Row count mismatch for '${schema.name}'. ` +
        `Expected ${schema.count}, got ${data.length}`
      );
    }
  }

  /**
   * 중첩 객체 빌드 (점 표기법 지원)
   *
   * @example
   * endpoints.student → { endpoints: { student: [...] } }
   */
  private buildNestedObject(tables: Map<string, ToonRow[]>): ToonParseResult {
    const result: any = {};

    for (const [name, data] of tables.entries()) {
      const parts = name.split('.');

      let current = result;
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part];
      }

      current[parts[parts.length - 1]] = data;
    }

    return result;
  }

  /**
   * JSON으로 변환
   */
  toJSON(parsed: ToonParseResult, pretty: boolean = true): string {
    return JSON.stringify(parsed, null, pretty ? 2 : 0);
  }

  /**
   * TOON으로 역변환 (JSON → TOON)
   */
  static fromJSON(json: any, tableName: string = 'data'): string {
    if (!Array.isArray(json)) {
      throw new Error('Input must be an array');
    }

    if (json.length === 0) {
      return '';
    }

    // 필드 추출 (첫 번째 객체 기준)
    const fields = Object.keys(json[0]);

    // 스키마 라인
    const schemaLine = `${tableName}[${json.length}]{${fields.join(',')}}:`;

    // 데이터 라인들
    const dataLines = json.map(row => {
      const values = fields.map(field => {
        const value = row[field];

        // null/undefined
        if (value === null || value === undefined) {
          return 'null';
        }

        // 불린
        if (typeof value === 'boolean') {
          return value.toString();
        }

        // 숫자
        if (typeof value === 'number') {
          return value.toString();
        }

        // 문자열 (쉼표나 따옴표 포함 시 감싸기)
        if (typeof value === 'string') {
          if (value.includes(',') || value.includes('"')) {
            return `"${value.replace(/"/g, '\\"')}"`;
          }
          return value;
        }

        // 배열 (문자열로 변환)
        if (Array.isArray(value)) {
          return `"${value.join(',')}"`;
        }

        return String(value);
      });

      return `  ${values.join(',')}`;
    });

    return [schemaLine, ...dataLines].join('\n');
  }
}

// ============================================
// 사용 예시
// ============================================

if (require.main === module) {
  console.log('=== TOON Parser 테스트 ===\n');

  const toonData = `
# 사용자 데이터
users[3]{id,name,role,active}:
  1,Alice,admin,true
  2,Bob,user,true
  3,Charlie,guest,false

# 제품 데이터
products[2]{id,name,price,description}:
  101,Laptop,999,"15 inch, 16GB RAM"
  102,Mouse,25,"Wireless, ergonomic"

# 중첩 경로 테스트
endpoints.student[2]{id,apiType,name}:
  class-days,08,수업일수
  school-status,62,학교현황

endpoints.teacher[1]{id,apiType,name}:
  teacher-position,22,직위별교원
`;

  const parser = new ToonParser();

  try {
    // 파싱
    console.log('1. TOON → Object 파싱:');
    const parsed = parser.parse(toonData);
    console.log(JSON.stringify(parsed, null, 2));

    // JSON 변환
    console.log('\n2. Object → JSON:');
    const json = parser.toJSON(parsed);
    console.log(json);

    // 역변환 테스트
    console.log('\n3. JSON → TOON 역변환:');
    const users = parsed.users;
    const toon = ToonParser.fromJSON(users, 'users');
    console.log(toon);

    // 중첩 경로 테스트
    console.log('\n4. 중첩 경로 확인:');
    console.log('endpoints:', Object.keys(parsed.endpoints || {}));
    console.log('endpoints.student:', parsed.endpoints?.student);
    console.log('endpoints.teacher:', parsed.endpoints?.teacher);

  } catch (error: any) {
    console.error('파싱 에러:', error.message);
  }

  // 에러 테스트
  console.log('\n=== 에러 처리 테스트 ===\n');

  const invalidToon = `
users[2]{id,name,role}:
  1,Alice,admin
  2,Bob,user
  3,Charlie,guest
`;

  try {
    parser.parse(invalidToon);
  } catch (error: any) {
    console.log('✅ 예상된 에러:', error.message);
  }

  // 필드 불일치 테스트
  const mismatchToon = `
users[2]{id,name,role}:
  1,Alice
  2,Bob,user
`;

  try {
    parser.parse(mismatchToon);
  } catch (error: any) {
    console.log('✅ 필드 불일치 감지:', error.message);
  }
}

// ============================================
// 헬퍼 함수
// ============================================

/**
 * TOON 파일 로드 및 파싱
 */
export async function loadToonFile(
  filePath: string,
  options?: ToonParserOptions
): Promise<ToonParseResult> {
  const fs = await import('fs/promises');
  const content = await fs.readFile(filePath, 'utf-8');
  const parser = new ToonParser(options);
  return parser.parse(content);
}

/**
 * 객체를 TOON 파일로 저장
 */
export async function saveToonFile(
  filePath: string,
  data: any,
  tableName: string = 'data'
): Promise<void> {
  const fs = await import('fs/promises');
  const toon = ToonParser.fromJSON(data, tableName);
  await fs.writeFile(filePath, toon, 'utf-8');
}

/**
 * 여러 테이블을 TOON 형식으로 변환
 */
export function multiTableToToon(tables: Record<string, any[]>): string {
  const toonBlocks: string[] = [];

  for (const [tableName, data] of Object.entries(tables)) {
    const toon = ToonParser.fromJSON(data, tableName);
    toonBlocks.push(toon);
  }

  return toonBlocks.join('\n\n');
}

// ============================================
// 타입 가드
// ============================================

export function isToonSchema(line: string): boolean {
  return /^[a-zA-Z0-9._-]+(\[\d+\])?\{[^}]+\}:$/.test(line.trim());
}

export function isToonComment(line: string, commentChar: string = '#'): boolean {
  return line.trim().startsWith(commentChar);
}

// ============================================
// Export
// ============================================

export default ToonParser;

/**
 * 사용 예시 요약:
 *
 * // 1. 기본 파싱
 * const parser = new ToonParser();
 * const data = parser.parse(toonString);
 *
 * // 2. 파일에서 로드
 * const data = await loadToonFile('spec.toon');
 *
 * // 3. JSON으로 변환
 * const json = parser.toJSON(data);
 *
 * // 4. TOON으로 역변환
 * const toon = ToonParser.fromJSON(jsonArray, 'users');
 *
 * // 5. 파일로 저장
 * await saveToonFile('output.toon', jsonArray, 'users');
 *
 * // 6. 여러 테이블 변환
 * const toon = multiTableToToon({
 *   users: [...],
 *   products: [...]
 * });
 */
