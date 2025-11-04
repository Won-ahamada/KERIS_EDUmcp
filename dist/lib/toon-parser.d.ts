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
export declare class ToonParser {
    private options;
    constructor(options?: ToonParserOptions);
    /**
     * TOON 문자열을 파싱하여 객체로 변환
     */
    parse(toonString: string): ToonParseResult;
    /**
     * 스키마 라인 여부 확인
     */
    private isSchemaLine;
    /**
     * 주석 제거
     */
    private removeComment;
    /**
     * 스키마 라인 파싱
     *
     * @example
     * users[2]{id,name,role}:
     * endpoints.student[6]{id,apiType,name}:
     */
    private parseSchema;
    /**
     * 데이터 라인 파싱
     *
     * @example
     * 1,Alice,admin
     * "Laptop 15\"",999,true
     */
    private parseDataLine;
    /**
     * CSV 라인 파싱 (따옴표 처리 포함)
     */
    private parseCsvLine;
    /**
     * 값 타입 변환
     */
    private parseValue;
    /**
     * 행 개수 검증
     */
    private validateCount;
    /**
     * 중첩 객체 빌드 (점 표기법 지원)
     *
     * @example
     * endpoints.student → { endpoints: { student: [...] } }
     */
    private buildNestedObject;
    /**
     * JSON으로 변환
     */
    toJSON(parsed: ToonParseResult, pretty?: boolean): string;
    /**
     * TOON으로 역변환 (JSON → TOON)
     */
    static fromJSON(json: any, tableName?: string): string;
}
/**
 * TOON 파일 로드 및 파싱
 */
export declare function loadToonFile(filePath: string, options?: ToonParserOptions): Promise<ToonParseResult>;
/**
 * 객체를 TOON 파일로 저장
 */
export declare function saveToonFile(filePath: string, data: any, tableName?: string): Promise<void>;
/**
 * 여러 테이블을 TOON 형식으로 변환
 */
export declare function multiTableToToon(tables: Record<string, any[]>): string;
export declare function isToonSchema(line: string): boolean;
export declare function isToonComment(line: string, commentChar?: string): boolean;
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
//# sourceMappingURL=toon-parser.d.ts.map