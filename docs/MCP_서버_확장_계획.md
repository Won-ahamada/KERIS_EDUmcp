# 확장 가능한 MCP 서버 제작 계획서
## 20개 이상 API 통합을 위한 플러그인 아키텍처

---

## 📋 목차
1. [개요](#개요)
2. [아키텍처 설계](#아키텍처-설계)
3. [핵심 설계 패턴](#핵심-설계-패턴)
4. [프로젝트 구조](#프로젝트-구조)
5. [단계별 구현 계획](#단계별-구현-계획)
6. [API 추가 프로세스](#api-추가-프로세스)
7. [예상 통합 API 목록](#예상-통합-api-목록)
8. [테스트 전략](#테스트-전략)
9. [문서화 전략](#문서화-전략)
10. [성능 및 확장성](#성능-및-확장성)

---

## 개요

### 프로젝트 목표
**20개 이상의 공공 API를 통합하는 확장 가능한 MCP 서버**를 구축하여 교육 데이터의 단일 접근점(Single Point of Access)을 제공

### 핵심 요구사항

#### ✅ 기능적 요구사항
- 현재 학교알리미 API 12개 통합
- 최소 20개 이상 API로 확장 가능
- API별 독립적인 추가/제거 가능
- 통합 쿼리 및 데이터 조합 지원
- 실시간 및 캐시 데이터 혼합 지원

#### ✅ 비기능적 요구사항
- **확장성**: 새 API 추가 시 기존 코드 최소 수정
- **유지보수성**: 명확한 책임 분리 및 표준화
- **타입 안전성**: TypeScript 완전 활용
- **성능**: 평균 응답 시간 < 500ms
- **안정성**: 에러율 < 1%, 개별 API 장애 격리

### 현재 상태
- ✅ 학교알리미 API 12개 분석 완료
- ✅ 시도/시군구 코드 데이터 확보
- 📝 MCP 서버 아키텍처 설계 필요
- 📝 확장 가능한 구조 구축 필요

---

## 아키텍처 설계

### 전체 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────────────────┐
│                        MCP Client (Claude)                       │
└────────────────────────────┬────────────────────────────────────┘
                             │ MCP Protocol
┌────────────────────────────┴────────────────────────────────────┐
│                        MCP Server Core                           │
│  ┌────────────────────────────────────────────────────────┐    │
│  │            Tool Registry & Router                       │    │
│  │  - Dynamic tool registration                            │    │
│  │  - Request routing                                      │    │
│  │  - Response formatting                                  │    │
│  └────────────┬───────────────────────────────────────────┘    │
└───────────────┼──────────────────────────────────────────────────┘
                │
┌───────────────┴──────────────────────────────────────────────────┐
│                   Provider Manager                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Provider   │  │   Provider   │  │   Provider   │          │
│  │   Loader     │  │   Registry   │  │   Factory    │  ...     │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└───────────────┬──────────────────────────────────────────────────┘
                │
    ┌───────────┼───────────┬───────────────┬────────────────┐
    │           │           │               │                │
┌───┴────┐  ┌──┴─────┐  ┌──┴──────┐  ┌────┴─────┐  ┌──────┴──────┐
│ School │  │  Meal  │  │  NEIS   │  │  College │  │   Custom    │
│ Alrimi │  │Service │  │   API   │  │   Info   │  │  Provider   │
│Provider│  │Provider│  │ Provider│  │ Provider │  │  (Plugin)   │
└───┬────┘  └───┬────┘  └────┬────┘  └─────┬────┘  └──────┬──────┘
    │           │            │             │              │
┌───┴────┐  ┌──┴─────┐  ┌──┴──────┐  ┌────┴─────┐  ┌──────┴──────┐
│API Type│  │API Type│  │API Type │  │API Type  │  │  API Type   │
│  0-94  │  │ 1-5    │  │ 1-10    │  │  1-8     │  │   Custom    │
└───┬────┘  └───┬────┘  └────┬────┘  └─────┬────┘  └──────┬──────┘
    │           │            │             │              │
┌───┴─────────────────────────┴─────────────┴──────────────┴──────┐
│                      Common Services Layer                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  Cache   │  │  Logger  │  │Validator │  │   HTTP   │        │
│  │  Layer   │  │  Service │  │  Service │  │  Client  │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
└───────────────────────────────┬───────────────────────────────────┘
                                │
┌───────────────────────────────┴───────────────────────────────────┐
│                      Data Layer                                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │PostgreSQL│  │  Redis   │  │  SQLite  │  │   JSON   │         │
│  │  (Main)  │  │ (Cache)  │  │  (Meta)  │  │  Files   │         │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘         │
└───────────────────────────────────────────────────────────────────┘
```

### 핵심 레이어 설명

#### 1. MCP Server Core
- MCP 프로토콜 처리
- Tool 등록 및 라우팅
- 요청/응답 변환
- 에러 핸들링

#### 2. Provider Manager
- Provider 생명주기 관리
- 동적 로딩 및 등록
- 의존성 주입
- 설정 관리

#### 3. Provider Layer (플러그인)
- 각 API 제공자별 독립 구현
- 표준 인터페이스 준수
- API별 비즈니스 로직
- 자체 설정 및 검증

#### 4. Common Services
- 캐싱, 로깅, 검증 등 공통 기능
- 모든 Provider가 공유
- 횡단 관심사(Cross-cutting Concerns)

#### 5. Data Layer
- 다중 데이터 소스 지원
- 캐시 전략
- 메타데이터 관리

---

## 핵심 설계 패턴

### 1. Provider Pattern (핵심)

```typescript
// 모든 API Provider가 구현해야 하는 기본 인터페이스
interface IApiProvider {
  // Provider 메타데이터
  readonly id: string;                    // 고유 식별자
  readonly name: string;                  // 표시 이름
  readonly version: string;               // 버전
  readonly description: string;           // 설명

  // 생명주기 메서드
  initialize(config: ProviderConfig): Promise<void>;
  shutdown(): Promise<void>;
  healthCheck(): Promise<HealthStatus>;

  // API 엔드포인트 정의
  getEndpoints(): ApiEndpoint[];

  // MCP Tools 등록
  registerTools(registry: ToolRegistry): void;

  // 요청 처리
  handleRequest(endpoint: string, params: unknown): Promise<unknown>;
}

// Provider 설정 타입
interface ProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
  retryPolicy?: RetryPolicy;
  cache?: CacheConfig;
  [key: string]: unknown;
}

// API 엔드포인트 정의
interface ApiEndpoint {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  params: ParamDefinition[];
  response: ResponseDefinition;
  cache?: CacheStrategy;
}
```

### 2. Plugin Architecture

```typescript
// Provider를 플러그인으로 로드
class ProviderLoader {
  async loadProvider(path: string): Promise<IApiProvider> {
    const module = await import(path);
    const ProviderClass = module.default;
    return new ProviderClass();
  }

  async loadAllProviders(directory: string): Promise<IApiProvider[]> {
    const files = await fs.readdir(directory);
    const providers = await Promise.all(
      files
        .filter(f => f.endsWith('.provider.ts'))
        .map(f => this.loadProvider(path.join(directory, f)))
    );
    return providers;
  }
}

// Provider 등록 및 관리
class ProviderRegistry {
  private providers = new Map<string, IApiProvider>();

  register(provider: IApiProvider): void {
    if (this.providers.has(provider.id)) {
      throw new Error(`Provider ${provider.id} already registered`);
    }
    this.providers.set(provider.id, provider);
  }

  get(id: string): IApiProvider | undefined {
    return this.providers.get(id);
  }

  getAll(): IApiProvider[] {
    return Array.from(this.providers.values());
  }
}
```

### 3. Factory Pattern

```typescript
// HTTP 클라이언트 팩토리
class HttpClientFactory {
  createClient(config: HttpClientConfig): HttpClient {
    return new AxiosHttpClient(config);
  }
}

// 캐시 팩토리
class CacheFactory {
  createCache(strategy: CacheStrategy): Cache {
    switch (strategy.type) {
      case 'memory':
        return new MemoryCache(strategy.config);
      case 'redis':
        return new RedisCache(strategy.config);
      case 'none':
        return new NoOpCache();
    }
  }
}
```

### 4. Strategy Pattern (인증)

```typescript
// 다양한 인증 방식 지원
interface AuthStrategy {
  authenticate(request: HttpRequest): Promise<HttpRequest>;
}

class ApiKeyAuthStrategy implements AuthStrategy {
  constructor(private apiKey: string, private headerName: string = 'X-API-Key') {}

  async authenticate(request: HttpRequest): Promise<HttpRequest> {
    request.headers[this.headerName] = this.apiKey;
    return request;
  }
}

class OAuth2Strategy implements AuthStrategy {
  async authenticate(request: HttpRequest): Promise<HttpRequest> {
    const token = await this.getAccessToken();
    request.headers['Authorization'] = `Bearer ${token}`;
    return request;
  }
}

class NoAuthStrategy implements AuthStrategy {
  async authenticate(request: HttpRequest): Promise<HttpRequest> {
    return request;
  }
}
```

### 5. Decorator Pattern (캐싱, 로깅)

```typescript
// Provider에 캐싱 기능 추가
class CachedProvider implements IApiProvider {
  constructor(
    private provider: IApiProvider,
    private cache: Cache
  ) {}

  async handleRequest(endpoint: string, params: unknown): Promise<unknown> {
    const cacheKey = this.generateCacheKey(endpoint, params);
    const cached = await this.cache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const result = await this.provider.handleRequest(endpoint, params);
    await this.cache.set(cacheKey, result);
    return result;
  }

  // 다른 메서드는 위임
  get id() { return this.provider.id; }
  get name() { return this.provider.name; }
  // ...
}

// Provider에 로깅 기능 추가
class LoggedProvider implements IApiProvider {
  constructor(
    private provider: IApiProvider,
    private logger: Logger
  ) {}

  async handleRequest(endpoint: string, params: unknown): Promise<unknown> {
    this.logger.info(`[${this.provider.id}] Request: ${endpoint}`, params);
    const start = Date.now();

    try {
      const result = await this.provider.handleRequest(endpoint, params);
      const duration = Date.now() - start;
      this.logger.info(`[${this.provider.id}] Success: ${endpoint} (${duration}ms)`);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.logger.error(`[${this.provider.id}] Error: ${endpoint} (${duration}ms)`, error);
      throw error;
    }
  }

  // 다른 메서드는 위임
}
```

### 6. Composite Pattern (데이터 조합)

```typescript
// 여러 Provider의 데이터를 조합
class CompositeQuery {
  async execute(query: QueryDefinition): Promise<CompositeResult> {
    const results = await Promise.all(
      query.sources.map(source =>
        this.providerRegistry
          .get(source.providerId)
          .handleRequest(source.endpoint, source.params)
      )
    );

    return this.combineResults(results, query.combineStrategy);
  }

  private combineResults(
    results: unknown[],
    strategy: CombineStrategy
  ): CompositeResult {
    switch (strategy) {
      case 'merge':
        return this.mergeResults(results);
      case 'join':
        return this.joinResults(results);
      case 'aggregate':
        return this.aggregateResults(results);
    }
  }
}
```

---

## 프로젝트 구조

```
251104-mcp-edu/
├── README.md
├── package.json
├── tsconfig.json
├── .env.example
├── .env.local
├── .gitignore
│
├── src/
│   ├── index.ts                          # 엔트리 포인트
│   │
│   ├── core/                             # MCP 서버 코어
│   │   ├── server.ts                     # MCP 서버 메인
│   │   ├── tool-registry.ts              # Tool 등록 관리
│   │   ├── router.ts                     # 요청 라우팅
│   │   └── error-handler.ts              # 에러 처리
│   │
│   ├── providers/                        # Provider 플러그인
│   │   ├── base/                         # 기본 추상 클래스
│   │   │   ├── api-provider.base.ts      # Provider 기본 클래스
│   │   │   ├── endpoint.base.ts          # Endpoint 기본 클래스
│   │   │   └── types.ts                  # 공통 타입 정의
│   │   │
│   │   ├── school-alrimi/                # 학교알리미 Provider
│   │   │   ├── school-alrimi.provider.ts # Provider 구현
│   │   │   ├── config.ts                 # 설정
│   │   │   ├── endpoints/                # API 엔드포인트
│   │   │   │   ├── school-info.endpoint.ts        (apiType: 0)
│   │   │   │   ├── class-days.endpoint.ts         (apiType: 08)
│   │   │   │   ├── free-semester.endpoint.ts      (apiType: 04)
│   │   │   │   ├── school-status.endpoint.ts      (apiType: 62)
│   │   │   │   ├── student-gender.endpoint.ts     (apiType: 63)
│   │   │   │   ├── student-by-grade.endpoint.ts   (apiType: 09)
│   │   │   │   ├── student-transfer.endpoint.ts   (apiType: 10)
│   │   │   │   ├── teacher-position.endpoint.ts   (apiType: 22)
│   │   │   │   ├── teacher-license.endpoint.ts    (apiType: 64)
│   │   │   │   ├── teacher-subject.endpoint.ts    (apiType: 24)
│   │   │   │   ├── violence-edu.endpoint.ts       (apiType: 94)
│   │   │   │   └── enrollment.endpoint.ts         (apiType: 51)
│   │   │   ├── tools/                    # MCP Tools
│   │   │   │   ├── search-schools.tool.ts
│   │   │   │   ├── get-student-stats.tool.ts
│   │   │   │   ├── get-teacher-stats.tool.ts
│   │   │   │   └── analyze-school.tool.ts
│   │   │   ├── types.ts                  # 타입 정의
│   │   │   └── README.md                 # Provider 문서
│   │   │
│   │   ├── meal-service/                 # 급식 Provider (예정)
│   │   │   ├── meal-service.provider.ts
│   │   │   ├── config.ts
│   │   │   ├── endpoints/
│   │   │   ├── tools/
│   │   │   └── README.md
│   │   │
│   │   ├── neis/                         # 나이스 Provider (예정)
│   │   │   └── ...
│   │   │
│   │   ├── college-info/                 # 대학정보 Provider (예정)
│   │   │   └── ...
│   │   │
│   │   └── provider.registry.ts          # Provider 등록
│   │
│   ├── services/                         # 공통 서비스
│   │   ├── cache/
│   │   │   ├── cache.interface.ts
│   │   │   ├── memory-cache.ts
│   │   │   ├── redis-cache.ts
│   │   │   └── cache-factory.ts
│   │   ├── http/
│   │   │   ├── http-client.interface.ts
│   │   │   ├── axios-client.ts
│   │   │   ├── retry-policy.ts
│   │   │   └── http-factory.ts
│   │   ├── auth/
│   │   │   ├── auth-strategy.interface.ts
│   │   │   ├── api-key-strategy.ts
│   │   │   ├── oauth2-strategy.ts
│   │   │   └── no-auth-strategy.ts
│   │   ├── logger/
│   │   │   ├── logger.interface.ts
│   │   │   ├── winston-logger.ts
│   │   │   └── logger-factory.ts
│   │   ├── validator/
│   │   │   ├── validator.ts
│   │   │   └── schemas/
│   │   └── database/
│   │       ├── connection.ts
│   │       ├── repositories/
│   │       └── migrations/
│   │
│   ├── utils/                            # 유틸리티
│   │   ├── code-loader.ts                # 시도/시군구 코드
│   │   ├── date-utils.ts
│   │   ├── string-utils.ts
│   │   └── error-utils.ts
│   │
│   ├── config/                           # 설정
│   │   ├── app.config.ts                 # 앱 설정
│   │   ├── providers.config.ts           # Provider 설정
│   │   └── constants.ts                  # 상수
│   │
│   └── types/                            # 전역 타입
│       ├── mcp.types.ts
│       ├── api.types.ts
│       └── common.types.ts
│
├── data/                                 # 정적 데이터
│   ├── sido-codes.json                   # 시도 코드
│   ├── school-types.json                 # 학교급 코드
│   └── README.md
│
├── tests/                                # 테스트
│   ├── unit/                             # 단위 테스트
│   │   ├── providers/
│   │   ├── services/
│   │   └── utils/
│   ├── integration/                      # 통합 테스트
│   │   └── providers/
│   ├── e2e/                             # E2E 테스트
│   │   └── scenarios/
│   └── fixtures/                        # 테스트 데이터
│       └── responses/
│
├── docs/                                # 문서
│   ├── architecture.md                  # 아키텍처 문서
│   ├── api-reference.md                 # API 레퍼런스
│   ├── provider-guide.md                # Provider 작성 가이드
│   ├── deployment.md                    # 배포 가이드
│   └── examples/                        # 예제
│       ├── basic-usage.md
│       ├── custom-provider.md
│       └── advanced-queries.md
│
├── scripts/                             # 스크립트
│   ├── generate-provider.ts            # Provider 스캐폴딩
│   ├── generate-docs.ts                # 문서 자동 생성
│   ├── test-providers.ts               # Provider 테스트
│   └── migrate-db.ts                   # DB 마이그레이션
│
└── .vscode/                            # VSCode 설정
    ├── settings.json
    ├── launch.json
    └── extensions.json
```

---

## 단계별 구현 계획

### 🎯 Phase 0: 프로젝트 초기화 (Week 1)

#### 목표
프로젝트 기반 구조 및 개발 환경 구축

#### 작업 항목
1. **프로젝트 초기화**
   ```bash
   npm init -y
   npm install typescript @types/node tsx
   npm install @modelcontextprotocol/sdk
   npm install zod axios winston
   npm install -D jest @types/jest ts-jest
   ```

2. **TypeScript 설정**
   - tsconfig.json 작성
   - 엄격한 타입 체크 활성화
   - Path alias 설정 (@/, @providers/, @services/)

3. **개발 도구 설정**
   - ESLint + Prettier
   - Husky (pre-commit hook)
   - GitHub Actions (CI/CD)

4. **기본 구조 작성**
   ```typescript
   // src/index.ts
   // src/core/server.ts
   // src/providers/base/api-provider.base.ts
   // src/services/logger/logger.ts
   ```

#### 성공 기준
- [ ] TypeScript 컴파일 성공
- [ ] 기본 MCP 서버 실행 가능
- [ ] 로깅 시스템 작동
- [ ] 테스트 프레임워크 설정 완료

#### 예상 소요시간: 6-8시간

---

### 🎯 Phase 1: 코어 시스템 구축 (Week 2-3)

#### 목표
Provider 플러그인 시스템 핵심 구현

#### 작업 항목

1. **Provider 기본 인터페이스 구현**
   ```typescript
   // src/providers/base/api-provider.base.ts
   export abstract class ApiProviderBase implements IApiProvider {
     abstract readonly id: string;
     abstract readonly name: string;

     protected httpClient: HttpClient;
     protected cache: Cache;
     protected logger: Logger;

     async initialize(config: ProviderConfig): Promise<void> {
       this.httpClient = httpClientFactory.create(config.http);
       this.cache = cacheFactory.create(config.cache);
       this.logger = loggerFactory.create(config.logger);

       await this.onInitialize(config);
     }

     protected abstract onInitialize(config: ProviderConfig): Promise<void>;

     async handleRequest(endpoint: string, params: unknown): Promise<unknown> {
       const endpointDef = this.findEndpoint(endpoint);
       if (!endpointDef) {
         throw new Error(`Endpoint not found: ${endpoint}`);
       }

       // 캐시 확인
       const cacheKey = this.generateCacheKey(endpoint, params);
       const cached = await this.cache.get(cacheKey);
       if (cached) return cached;

       // API 호출
       const result = await this.executeRequest(endpointDef, params);

       // 캐시 저장
       await this.cache.set(cacheKey, result, endpointDef.cache?.ttl);

       return result;
     }

     protected abstract executeRequest(
       endpoint: ApiEndpoint,
       params: unknown
     ): Promise<unknown>;
   }
   ```

2. **Provider Registry 구현**
   ```typescript
   // src/providers/provider.registry.ts
   export class ProviderRegistry {
     private providers = new Map<string, IApiProvider>();
     private loader = new ProviderLoader();

     async loadAll(config: ProvidersConfig): Promise<void> {
       for (const providerConfig of config.providers) {
         const provider = await this.loader.load(providerConfig);
         await provider.initialize(providerConfig);
         this.register(provider);
       }
     }

     register(provider: IApiProvider): void {
       this.logger.info(`Registering provider: ${provider.id}`);
       this.providers.set(provider.id, provider);
     }

     get(id: string): IApiProvider {
       const provider = this.providers.get(id);
       if (!provider) {
         throw new Error(`Provider not found: ${id}`);
       }
       return provider;
     }
   }
   ```

3. **Tool Registry 구현**
   ```typescript
   // src/core/tool-registry.ts
   export class ToolRegistry {
     private tools = new Map<string, ToolDefinition>();

     register(tool: ToolDefinition): void {
       if (this.tools.has(tool.name)) {
         throw new Error(`Tool already registered: ${tool.name}`);
       }
       this.tools.set(tool.name, tool);
     }

     getAll(): ToolDefinition[] {
       return Array.from(this.tools.values());
     }

     async executeTool(name: string, args: unknown): Promise<unknown> {
       const tool = this.tools.get(name);
       if (!tool) {
         throw new Error(`Tool not found: ${name}`);
       }

       // 입력 검증
       const validatedArgs = tool.inputSchema.parse(args);

       // 실행
       return await tool.handler(validatedArgs);
     }
   }
   ```

4. **MCP Server Core 구현**
   ```typescript
   // src/core/server.ts
   export class McpServer {
     private providerRegistry: ProviderRegistry;
     private toolRegistry: ToolRegistry;
     private server: Server;

     async start(): Promise<void> {
       // Provider 로드
       await this.providerRegistry.loadAll(config.providers);

       // 각 Provider의 Tools 등록
       for (const provider of this.providerRegistry.getAll()) {
         provider.registerTools(this.toolRegistry);
       }

       // MCP 서버 시작
       this.server = new Server({
         name: 'edu-api-mcp-server',
         version: '1.0.0',
       }, {
         capabilities: {
           tools: {},
         },
       });

       // Tool 핸들러 등록
       this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
         tools: this.toolRegistry.getAll(),
       }));

       this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
         const result = await this.toolRegistry.executeTool(
           request.params.name,
           request.params.arguments
         );
         return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
       });

       // 서버 연결
       const transport = new StdioServerTransport();
       await this.server.connect(transport);

       this.logger.info('MCP Server started successfully');
     }
   }
   ```

5. **공통 서비스 구현**
   - HTTP Client (Axios 기반)
   - Cache Service (Memory + Redis)
   - Logger Service (Winston)
   - Validator Service (Zod)

#### 성공 기준
- [ ] Provider 동적 로드 가능
- [ ] Tool 자동 등록 작동
- [ ] 기본 MCP 프로토콜 응답
- [ ] 에러 핸들링 구현
- [ ] 로깅 및 모니터링 작동

#### 예상 소요시간: 20-25시간

---

### 🎯 Phase 2: 학교알리미 Provider 구현 (Week 4-5)

#### 목표
첫 번째 실제 Provider 완성 (12개 API)

#### 작업 항목

1. **Provider 클래스 작성**
   ```typescript
   // src/providers/school-alrimi/school-alrimi.provider.ts
   export class SchoolAlrimiProvider extends ApiProviderBase {
     readonly id = 'school-alrimi';
     readonly name = '학교알리미';
     readonly version = '1.0.0';

     private apiKey: string;
     private baseUrl = 'http://www.schoolinfo.go.kr/openApi.do';

     protected async onInitialize(config: ProviderConfig): Promise<void> {
       this.apiKey = config.apiKey || process.env.SCHOOL_ALRIMI_API_KEY;
       if (!this.apiKey) {
         throw new Error('School Alrimi API key is required');
       }
     }

     getEndpoints(): ApiEndpoint[] {
       return [
         new SchoolInfoEndpoint(),
         new ClassDaysEndpoint(),
         new FreeSemesterEndpoint(),
         // ... 나머지 9개
       ];
     }

     registerTools(registry: ToolRegistry): void {
       registry.register(new SearchSchoolsTool(this));
       registry.register(new GetStudentStatsTool(this));
       registry.register(new GetTeacherStatsTool(this));
       registry.register(new AnalyzeSchoolTool(this));
     }

     protected async executeRequest(
       endpoint: ApiEndpoint,
       params: unknown
     ): Promise<unknown> {
       const url = new URL(this.baseUrl);
       url.searchParams.set('apiKey', this.apiKey);
       url.searchParams.set('apiType', endpoint.id);

       // params를 URL 파라미터로 변환
       Object.entries(params as Record<string, string>).forEach(([key, value]) => {
         if (value !== undefined) {
           url.searchParams.set(key, value);
         }
       });

       const response = await this.httpClient.get(url.toString());
       return this.parseResponse(response.data);
     }

     private parseResponse(data: any): SchoolAlrimiResponse {
       // 응답 파싱 및 검증
       if (data.resultCode === 'fail') {
         throw new ApiError(data.resultMsg);
       }
       return data;
     }
   }
   ```

2. **Endpoint 클래스 작성 (12개)**
   ```typescript
   // src/providers/school-alrimi/endpoints/school-info.endpoint.ts
   export class SchoolInfoEndpoint extends EndpointBase {
     readonly id = '0';
     readonly method = 'GET';
     readonly path = '/openApi.do';
     readonly description = '학교 기본정보 조회';

     readonly params: ParamDefinition[] = [
       {
         name: 'sidoCode',
         type: 'string',
         required: false,
         description: '시도코드',
       },
       {
         name: 'sggCode',
         type: 'string',
         required: false,
         description: '시군구코드',
       },
       {
         name: 'schulKndCode',
         type: 'string',
         required: true,
         description: '학교급구분 (02:초등, 03:중등, 04:고등)',
       },
     ];

     readonly response: ResponseDefinition = {
       type: 'object',
       properties: {
         SCHUL_CODE: { type: 'string', description: '학교코드' },
         SCHUL_NM: { type: 'string', description: '학교명' },
         ATPT_OFCDC_ORG_NM: { type: 'string', description: '시도교육청' },
         // ... 35개 필드
       },
     };

     readonly cache: CacheStrategy = {
       enabled: true,
       ttl: 86400, // 24시간
       key: (params) => `school-info:${params.sidoCode}:${params.schulKndCode}`,
     };
   }
   ```

3. **MCP Tools 작성 (4개)**
   ```typescript
   // src/providers/school-alrimi/tools/search-schools.tool.ts
   export class SearchSchoolsTool implements ToolDefinition {
     readonly name = 'search_schools';
     readonly description = '조건에 맞는 학교 검색';

     readonly inputSchema = z.object({
       region: z.string().optional().describe('지역 (예: 서울특별시, 부산광역시)'),
       district: z.string().optional().describe('시군구 (예: 강남구, 해운대구)'),
       schoolType: z.enum(['02', '03', '04', '05', '06', '07']).describe('학교급 (02:초등, 03:중등, 04:고등)'),
       schoolName: z.string().optional().describe('학교명 검색어'),
     });

     constructor(private provider: SchoolAlrimiProvider) {}

     async handler(args: z.infer<typeof this.inputSchema>): Promise<SchoolInfo[]> {
       // 지역명 -> 코드 변환
       const sidoCode = args.region ? await codeLoader.getSidoCode(args.region) : undefined;
       const sggCode = args.district ? await codeLoader.getSggCode(args.district) : undefined;

       // API 호출
       const response = await this.provider.handleRequest('0', {
         sidoCode,
         sggCode,
         schulKndCode: args.schoolType,
       });

       // 학교명 필터링
       let schools = response.list as SchoolInfo[];
       if (args.schoolName) {
         schools = schools.filter(s =>
           s.SCHUL_NM.includes(args.schoolName!)
         );
       }

       return schools;
     }
   }
   ```

4. **시도/시군구 코드 로더**
   ```typescript
   // src/utils/code-loader.ts
   export class CodeLoader {
     private sidoCodes: Map<string, string>;
     private sggCodes: Map<string, Map<string, string>>;

     async load(): Promise<void> {
       const data = await fs.readFile('data/sido-codes.json', 'utf-8');
       const codes = JSON.parse(data);

       this.sidoCodes = new Map();
       this.sggCodes = new Map();

       for (const item of codes) {
         this.sidoCodes.set(item.sidoName, item.sidoCode);

         if (!this.sggCodes.has(item.sidoCode)) {
           this.sggCodes.set(item.sidoCode, new Map());
         }
         this.sggCodes.get(item.sidoCode)!.set(item.sggName, item.sggCode);
       }
     }

     getSidoCode(name: string): string | undefined {
       return this.sidoCodes.get(name);
     }

     getSggCode(sidoCode: string, sggName: string): string | undefined {
       return this.sggCodes.get(sidoCode)?.get(sggName);
     }
   }
   ```

5. **타입 정의**
   ```typescript
   // src/providers/school-alrimi/types.ts
   export interface SchoolInfo {
     SCHUL_CODE: string;           // 학교코드
     SCHUL_NM: string;             // 학교명
     ATPT_OFCDC_ORG_NM: string;   // 시도교육청
     JU_ORG_NM: string;            // 교육지원청
     SCHUL_KND_SC_CODE: string;    // 학교급코드
     ADRES_BRKDN: string;          // 주소
     LTTUD: string;                // 위도
     LGTUD: string;                // 경도
     USER_TELNO: string;           // 전화번호
     HMPG_ADRES: string;           // 홈페이지
     // ... 나머지 25개 필드
   }

   export interface StudentStats {
     // 학생 통계 타입
   }

   export interface TeacherStats {
     // 교원 통계 타입
   }
   ```

6. **테스트 작성**
   ```typescript
   // tests/integration/providers/school-alrimi.test.ts
   describe('SchoolAlrimiProvider', () => {
     let provider: SchoolAlrimiProvider;

     beforeAll(async () => {
       provider = new SchoolAlrimiProvider();
       await provider.initialize({ apiKey: process.env.TEST_API_KEY });
     });

     test('학교 기본정보 조회', async () => {
       const result = await provider.handleRequest('0', {
         sidoCode: '11',
         schulKndCode: '04',
       });

       expect(result).toHaveProperty('list');
       expect(result.list.length).toBeGreaterThan(0);
     });

     test('학교 검색 Tool', async () => {
       const tool = new SearchSchoolsTool(provider);
       const result = await tool.handler({
         region: '서울특별시',
         schoolType: '04',
         schoolName: '고등학교',
       });

       expect(result.length).toBeGreaterThan(0);
       expect(result[0]).toHaveProperty('SCHUL_NM');
     });
   });
   ```

#### 성공 기준
- [ ] 12개 API 엔드포인트 모두 작동
- [ ] 4개 MCP Tools 정상 응답
- [ ] 시도/시군구 코드 변환 작동
- [ ] 캐싱 적용 및 성능 향상
- [ ] 단위/통합 테스트 통과

#### 예상 소요시간: 25-30시간

---

### 🎯 Phase 3: 추가 Provider 구현 (Week 6-8)

#### 목표
4개의 추가 Provider 구현 (각 3-5개 API)

#### Provider 목록

**1. 급식서비스 Provider (5개 API)**
```typescript
// src/providers/meal-service/meal-service.provider.ts
export class MealServiceProvider extends ApiProviderBase {
  readonly id = 'meal-service';
  readonly name = '급식서비스';

  getEndpoints(): ApiEndpoint[] {
    return [
       new MealInfoEndpoint(),           // 급식 메뉴
       new MealCountEndpoint(),          // 급식 인원
       new MealScheduleEndpoint(),       // 급식 일정
       new NutritionalInfoEndpoint(),    // 영양 정보
       new AllergyInfoEndpoint(),        // 알레르기 정보
    ];
  }

  registerTools(registry: ToolRegistry): void {
    registry.register(new GetMealMenuTool(this));
    registry.register(new SearchMealByDateTool(this));
  }
}
```

**2. 나이스 교육정보 Provider (8개 API)**
```typescript
// src/providers/neis/neis.provider.ts
export class NeisProvider extends ApiProviderBase {
  readonly id = 'neis';
  readonly name = '나이스 교육정보';

  getEndpoints(): ApiEndpoint[] {
    return [
      new AcademicScheduleEndpoint(),      // 학사일정
      new ClassroomInfoEndpoint(),         // 교실 정보
      new SchoolFacilityEndpoint(),        // 학교 시설
      new SchoolBusEndpoint(),             // 통학버스
      new AfterSchoolEndpoint(),           // 방과후 과정
      new SpecialClassEndpoint(),          // 특수학급
      new CareerCounselingEndpoint(),      // 진로상담
      new SchoolHistoryEndpoint(),         // 학교 연혁
    ];
  }
}
```

**3. 대학정보공시 Provider (5개 API)**
```typescript
// src/providers/college-info/college-info.provider.ts
export class CollegeInfoProvider extends ApiProviderBase {
  readonly id = 'college-info';
  readonly name = '대학정보공시';

  getEndpoints(): ApiEndpoint[] {
    return [
      new UniversityBasicEndpoint(),       // 대학 기본정보
      new DepartmentInfoEndpoint(),        // 학과 정보
      new TuitionEndpoint(),               // 등록금 정보
      new ScholarshipEndpoint(),           // 장학금 정보
      new EmploymentRateEndpoint(),        // 취업률
    ];
  }
}
```

**4. 교육통계 Provider (3개 API)**
```typescript
// src/providers/edu-statistics/edu-statistics.provider.ts
export class EduStatisticsProvider extends ApiProviderBase {
  readonly id = 'edu-statistics';
  readonly name = '교육통계';

  getEndpoints(): ApiEndpoint[] {
    return [
      new RegionalStatsEndpoint(),         // 지역별 통계
      new SchoolTypeStatsEndpoint(),       // 학교급별 통계
      new TrendAnalysisEndpoint(),         // 추세 분석
    ];
  }
}
```

#### 작업 프로세스
1. Provider 스캐폴딩 스크립트 사용
   ```bash
   npm run generate:provider -- --name meal-service --api-count 5
   ```

2. API 문서 분석 및 Endpoint 구현

3. MCP Tools 설계 및 구현

4. 테스트 작성 및 검증

5. 문서 작성

#### 성공 기준
- [ ] 4개 Provider 모두 작동
- [ ] 총 21개 추가 API 통합 (누적 33개)
- [ ] 각 Provider별 최소 2개 Tools
- [ ] 통합 테스트 통과
- [ ] Provider별 문서 완성

#### 예상 소요시간: 40-50시간

---

### 🎯 Phase 4: 고급 기능 구현 (Week 9-10)

#### 목표
데이터 조합, 분석, 최적화 기능

#### 작업 항목

1. **Cross-Provider Query**
   ```typescript
   // 여러 Provider의 데이터를 조합하는 Tool
   export class ComprehensiveSchoolAnalysisTool implements ToolDefinition {
     readonly name = 'analyze_school_comprehensive';
     readonly description = '학교의 종합 분석 (기본정보 + 급식 + 통계)';

     async handler(args: { schoolCode: string }): Promise<SchoolAnalysis> {
       // 학교알리미: 기본정보 + 학생수 + 교원수
       const [schoolInfo, studentStats, teacherStats] = await Promise.all([
         this.schoolAlrimiProvider.handleRequest('0', { ... }),
         this.schoolAlrimiProvider.handleRequest('63', { ... }),
         this.schoolAlrimiProvider.handleRequest('22', { ... }),
       ]);

       // 급식서비스: 이번 주 급식
       const meals = await this.mealProvider.handleRequest('meal-info', { ... });

       // 나이스: 학사일정
       const schedule = await this.neisProvider.handleRequest('academic-schedule', { ... });

       // 데이터 조합 및 분석
       return {
         basic: schoolInfo,
         statistics: {
           students: this.analyzeStudents(studentStats),
           teachers: this.analyzeTeachers(teacherStats),
           ratio: this.calculateRatio(studentStats, teacherStats),
         },
         meal: this.formatMeals(meals),
         schedule: this.formatSchedule(schedule),
         insights: this.generateInsights({
           schoolInfo,
           studentStats,
           teacherStats,
         }),
       };
     }
   }
   ```

2. **배치 처리 및 스케줄링**
   ```typescript
   // src/services/scheduler/batch-processor.ts
   export class BatchProcessor {
     async updateAllSchoolsCache(): Promise<void> {
       const schools = await this.getAllSchools();

       for (const school of schools) {
         await this.updateSchoolCache(school.SCHUL_CODE);
         await this.delay(100); // Rate limiting
       }
     }

     async updateSchoolCache(schoolCode: string): Promise<void> {
       // 모든 관련 데이터를 미리 캐시
       await Promise.all([
         this.fetchAndCache('student-stats', schoolCode),
         this.fetchAndCache('teacher-stats', schoolCode),
         this.fetchAndCache('meal-info', schoolCode),
       ]);
     }
   }
   ```

3. **데이터베이스 통합**
   ```typescript
   // src/services/database/repositories/school.repository.ts
   export class SchoolRepository {
     async saveSchool(school: SchoolInfo): Promise<void> {
       await this.db.query(
         `INSERT INTO schools (code, name, region, ...)
          VALUES ($1, $2, $3, ...)
          ON CONFLICT (code) DO UPDATE SET ...`,
         [school.SCHUL_CODE, school.SCHUL_NM, ...]
       );
     }

     async searchSchools(criteria: SearchCriteria): Promise<SchoolInfo[]> {
       // 복잡한 검색은 DB에서 처리
       return await this.db.query(
         `SELECT * FROM schools
          WHERE region = $1 AND student_count BETWEEN $2 AND $3
          ORDER BY student_count DESC`,
         [criteria.region, criteria.minStudents, criteria.maxStudents]
       );
     }
   }
   ```

4. **고급 분석 Tools**
   ```typescript
   // src/tools/analytics/trend-analysis.tool.ts
   export class TrendAnalysisTool implements ToolDefinition {
     readonly name = 'analyze_trends';
     readonly description = '교육 데이터 추세 분석';

     async handler(args: {
       region: string;
       years: number[];
       metric: 'student_count' | 'teacher_count' | 'school_count';
     }): Promise<TrendAnalysis> {
       const data = await this.fetchHistoricalData(args);

       return {
         trend: this.calculateTrend(data),
         prediction: this.predictFuture(data),
         insights: this.generateInsights(data),
         visualization: this.generateChartData(data),
       };
     }
   }
   ```

5. **성능 최적화**
   - Query 최적화
   - Connection pooling
   - Batch request
   - Response compression
   - Parallel processing

#### 성공 기준
- [ ] Cross-provider query 작동
- [ ] 배치 처리 시스템 구현
- [ ] 데이터베이스 통합 완료
- [ ] 평균 응답시간 < 300ms
- [ ] 동시 요청 100개 처리 가능

#### 예상 소요시간: 25-30시간

---

### 🎯 Phase 5: 문서화 및 배포 (Week 11-12)

#### 목표
완전한 문서화 및 프로덕션 준비

#### 작업 항목

1. **자동 문서 생성**
   ```typescript
   // scripts/generate-docs.ts
   export class DocumentationGenerator {
     async generateProviderDocs(): Promise<void> {
       const providers = this.providerRegistry.getAll();

       for (const provider of providers) {
         const doc = {
           name: provider.name,
           id: provider.id,
           version: provider.version,
           endpoints: provider.getEndpoints().map(e => ({
             id: e.id,
             description: e.description,
             params: e.params,
             response: e.response,
             example: this.generateExample(e),
           })),
           tools: this.extractTools(provider),
         };

         await this.writeMarkdown(`docs/providers/${provider.id}.md`, doc);
       }
     }
   }
   ```

2. **API Reference 생성**
   - 모든 Tools의 입력/출력 스키마
   - 예제 코드
   - 에러 코드 및 처리 방법

3. **배포 가이드**
   - Docker 컨테이너화
   - 환경변수 설정
   - 모니터링 설정
   - 백업 전략

4. **개발자 가이드**
   - Custom Provider 작성 튜토리얼
   - 플러그인 개발 가이드
   - 테스트 작성 가이드
   - 기여 가이드라인

#### 성공 기준
- [ ] 완전한 API 문서
- [ ] Provider 작성 가이드
- [ ] Docker 배포 지원
- [ ] CI/CD 파이프라인
- [ ] 모니터링 대시보드

#### 예상 소요시간: 15-20시간

---

## API 추가 프로세스

### 신규 Provider 추가 절차

#### 1. Provider 스캐폴딩
```bash
npm run generate:provider -- --name my-api --base-url https://api.example.com
```

자동 생성되는 파일:
```
src/providers/my-api/
├── my-api.provider.ts        # Provider 기본 구조
├── config.ts                  # 설정 타입
├── types.ts                   # 타입 정의
├── endpoints/                 # Endpoint 폴더
│   └── .gitkeep
├── tools/                     # Tools 폴더
│   └── .gitkeep
├── README.md                  # Provider 문서
└── __tests__/                 # 테스트 폴더
    └── my-api.provider.test.ts
```

#### 2. Endpoint 추가
```bash
npm run generate:endpoint -- --provider my-api --name user-info --method GET
```

생성된 템플릿 수정:
```typescript
// src/providers/my-api/endpoints/user-info.endpoint.ts
export class UserInfoEndpoint extends EndpointBase {
  readonly id = 'user-info';
  readonly method = 'GET';
  readonly path = '/api/v1/users/{userId}';
  readonly description = '사용자 정보 조회';

  readonly params: ParamDefinition[] = [
    {
      name: 'userId',
      type: 'string',
      required: true,
      description: '사용자 ID',
    },
  ];

  readonly response: ResponseDefinition = {
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      email: { type: 'string' },
    },
  };

  readonly cache: CacheStrategy = {
    enabled: true,
    ttl: 300, // 5분
  };
}
```

#### 3. Tool 추가
```bash
npm run generate:tool -- --provider my-api --name get-user
```

```typescript
// src/providers/my-api/tools/get-user.tool.ts
export class GetUserTool implements ToolDefinition {
  readonly name = 'my_api_get_user';
  readonly description = '사용자 정보 조회';

  readonly inputSchema = z.object({
    userId: z.string().describe('사용자 ID'),
  });

  constructor(private provider: MyApiProvider) {}

  async handler(args: z.infer<typeof this.inputSchema>) {
    return await this.provider.handleRequest('user-info', {
      userId: args.userId,
    });
  }
}
```

#### 4. Provider에 등록
```typescript
// src/providers/my-api/my-api.provider.ts
export class MyApiProvider extends ApiProviderBase {
  // ...

  getEndpoints(): ApiEndpoint[] {
    return [
      new UserInfoEndpoint(),
      // 추가 endpoint들...
    ];
  }

  registerTools(registry: ToolRegistry): void {
    registry.register(new GetUserTool(this));
    // 추가 tool들...
  }
}
```

#### 5. 설정 추가
```typescript
// src/config/providers.config.ts
export const providersConfig: ProvidersConfig = {
  providers: [
    // 기존 providers...
    {
      id: 'my-api',
      enabled: true,
      config: {
        apiKey: process.env.MY_API_KEY,
        baseUrl: 'https://api.example.com',
        timeout: 5000,
        cache: {
          enabled: true,
          ttl: 300,
        },
      },
    },
  ],
};
```

#### 6. 테스트 작성
```typescript
// src/providers/my-api/__tests__/my-api.provider.test.ts
describe('MyApiProvider', () => {
  let provider: MyApiProvider;

  beforeAll(async () => {
    provider = new MyApiProvider();
    await provider.initialize({
      apiKey: 'test-key',
    });
  });

  test('사용자 정보 조회', async () => {
    const result = await provider.handleRequest('user-info', {
      userId: '123',
    });

    expect(result).toHaveProperty('id', '123');
  });
});
```

#### 7. 문서 작성
```markdown
<!-- src/providers/my-api/README.md -->
# My API Provider

## 개요
My API의 사용자 정보를 조회하는 Provider입니다.

## 설정
환경변수:
- `MY_API_KEY`: API 키 (필수)

## Endpoints
### user-info
사용자 정보를 조회합니다.

**Parameters:**
- `userId` (string, required): 사용자 ID

**Response:**
```json
{
  "id": "123",
  "name": "홍길동",
  "email": "hong@example.com"
}
```

## Tools
### my_api_get_user
사용자 정보를 조회하는 MCP Tool입니다.
```

### 체크리스트
- [ ] Provider 클래스 구현
- [ ] Endpoint 정의 (최소 1개)
- [ ] Tool 구현 (최소 1개)
- [ ] 설정 추가
- [ ] 테스트 작성
- [ ] 문서 작성
- [ ] 타입 정의
- [ ] 에러 핸들링

---

## 예상 통합 API 목록

### 현재 통합 (12개)
1. ✅ 학교알리미 - 학교기본정보
2. ✅ 학교알리미 - 수업일수
3. ✅ 학교알리미 - 자유학기제
4. ✅ 학교알리미 - 학교현황
5. ✅ 학교알리미 - 성별학생수
6. ✅ 학교알리미 - 학년별학생수
7. ✅ 학교알리미 - 전출입학생
8. ✅ 학교알리미 - 직위별교원
9. ✅ 학교알리미 - 자격종별교원
10. ✅ 학교알리미 - 과목별교원
11. ✅ 학교알리미 - 학교폭력예방
12. ✅ 학교알리미 - 입학생현황

### Phase 3 추가 (21개)
13. 📝 급식서비스 - 급식메뉴
14. 📝 급식서비스 - 급식인원
15. 📝 급식서비스 - 급식일정
16. 📝 급식서비스 - 영양정보
17. 📝 급식서비스 - 알레르기정보
18. 📝 나이스 - 학사일정
19. 📝 나이스 - 교실정보
20. 📝 나이스 - 학교시설
21. 📝 나이스 - 통학버스
22. 📝 나이스 - 방과후과정
23. 📝 나이스 - 특수학급
24. 📝 나이스 - 진로상담
25. 📝 나이스 - 학교연혁
26. 📝 대학정보 - 대학기본정보
27. 📝 대학정보 - 학과정보
28. 📝 대학정보 - 등록금
29. 📝 대학정보 - 장학금
30. 📝 대학정보 - 취업률
31. 📝 교육통계 - 지역별통계
32. 📝 교육통계 - 학교급별통계
33. 📝 교육통계 - 추세분석

### 추가 확장 가능 (10개+)
34. 💡 기상청 - 학교주변날씨
35. 💡 교통정보 - 학교주변교통
36. 💡 문화시설 - 주변도서관
37. 💡 문화시설 - 주변박물관
38. 💡 안전정보 - 스쿨존정보
39. 💡 안전정보 - 통학로안전
40. 💡 입시정보 - 대입전형
41. 💡 입시정보 - 수능통계
42. 💡 학원정보 - 주변학원
43. 💡 학원정보 - 강사정보
44. 💡 특수교육 - 특수학교정보
45. 💡 특수교육 - 지원센터

**총 예상: 45개 이상 API 통합 가능**

---

## 테스트 전략

### 테스트 피라미드

```
        ┌─────────────┐
        │   E2E (5%)  │  ← 시나리오 테스트
        ├─────────────┤
        │Integration  │  ← Provider 통합 테스트
        │   (15%)     │
        ├─────────────┤
        │    Unit     │  ← 단위 테스트
        │   (80%)     │
        └─────────────┘
```

### 1. 단위 테스트 (80%)
```typescript
// tests/unit/services/cache.test.ts
describe('MemoryCache', () => {
  let cache: MemoryCache;

  beforeEach(() => {
    cache = new MemoryCache();
  });

  test('should store and retrieve value', async () => {
    await cache.set('key1', 'value1');
    const value = await cache.get('key1');
    expect(value).toBe('value1');
  });

  test('should expire after TTL', async () => {
    await cache.set('key1', 'value1', 100); // 100ms
    await delay(150);
    const value = await cache.get('key1');
    expect(value).toBeUndefined();
  });
});
```

### 2. 통합 테스트 (15%)
```typescript
// tests/integration/providers/school-alrimi.integration.test.ts
describe('SchoolAlrimiProvider Integration', () => {
  let provider: SchoolAlrimiProvider;
  let cache: Cache;
  let httpClient: HttpClient;

  beforeAll(async () => {
    cache = new MemoryCache();
    httpClient = new AxiosHttpClient();

    provider = new SchoolAlrimiProvider();
    await provider.initialize({
      apiKey: process.env.TEST_API_KEY,
      cache,
      httpClient,
    });
  });

  test('should fetch and cache school info', async () => {
    // 첫 번째 요청 - API 호출
    const start1 = Date.now();
    const result1 = await provider.handleRequest('0', {
      sidoCode: '11',
      schulKndCode: '04',
    });
    const duration1 = Date.now() - start1;

    // 두 번째 요청 - 캐시에서 가져옴
    const start2 = Date.now();
    const result2 = await provider.handleRequest('0', {
      sidoCode: '11',
      schulKndCode: '04',
    });
    const duration2 = Date.now() - start2;

    expect(result1).toEqual(result2);
    expect(duration2).toBeLessThan(duration1 / 10); // 캐시가 10배 이상 빠름
  });
});
```

### 3. E2E 테스트 (5%)
```typescript
// tests/e2e/scenarios/school-search.e2e.test.ts
describe('School Search Scenario', () => {
  let mcpServer: McpServer;
  let client: McpClient;

  beforeAll(async () => {
    mcpServer = new McpServer();
    await mcpServer.start();

    client = new McpClient(mcpServer.getTransport());
  });

  test('complete school search workflow', async () => {
    // 1. 학교 검색
    const schools = await client.callTool('search_schools', {
      region: '서울특별시',
      district: '강남구',
      schoolType: '04',
    });

    expect(schools.length).toBeGreaterThan(0);
    const school = schools[0];

    // 2. 학생 통계 조회
    const studentStats = await client.callTool('get_student_stats', {
      schoolCode: school.SCHUL_CODE,
      year: 2024,
    });

    expect(studentStats).toHaveProperty('totalStudents');

    // 3. 교원 통계 조회
    const teacherStats = await client.callTool('get_teacher_stats', {
      schoolCode: school.SCHUL_CODE,
      year: 2024,
    });

    expect(teacherStats).toHaveProperty('totalTeachers');

    // 4. 종합 분석
    const analysis = await client.callTool('analyze_school_comprehensive', {
      schoolCode: school.SCHUL_CODE,
    });

    expect(analysis).toHaveProperty('basic');
    expect(analysis).toHaveProperty('statistics');
    expect(analysis).toHaveProperty('insights');
  });
});
```

### 4. 성능 테스트
```typescript
// tests/performance/load.test.ts
describe('Load Testing', () => {
  test('should handle 100 concurrent requests', async () => {
    const requests = Array(100).fill(null).map(() =>
      provider.handleRequest('0', {
        sidoCode: '11',
        schulKndCode: '04',
      })
    );

    const start = Date.now();
    const results = await Promise.all(requests);
    const duration = Date.now() - start;

    expect(results).toHaveLength(100);
    expect(duration).toBeLessThan(5000); // 5초 이내
  });
});
```

### 5. Mock 데이터 관리
```typescript
// tests/fixtures/responses/school-alrimi.fixture.ts
export const schoolInfoResponse = {
  resultCode: 'success',
  resultMsg: '정상',
  list: [
    {
      SCHUL_CODE: '7010001',
      SCHUL_NM: '테스트고등학교',
      ATPT_OFCDC_ORG_NM: '서울특별시교육청',
      // ...
    },
  ],
};

// 테스트에서 사용
jest.mock('axios');
mockedAxios.get.mockResolvedValue({ data: schoolInfoResponse });
```

---

## 문서화 전략

### 1. 자동 생성 문서

#### API Reference
```typescript
// scripts/generate-api-reference.ts
export class ApiReferenceGenerator {
  async generate(): Promise<void> {
    const providers = await this.loadAllProviders();

    const reference = {
      version: '1.0.0',
      providers: providers.map(p => ({
        id: p.id,
        name: p.name,
        endpoints: this.extractEndpoints(p),
        tools: this.extractTools(p),
      })),
    };

    // Markdown 생성
    await this.writeMarkdown('docs/api-reference.md', reference);

    // OpenAPI 스펙 생성
    await this.writeOpenApiSpec('docs/openapi.yaml', reference);

    // HTML 문서 생성
    await this.generateHtml('docs/api-reference.html', reference);
  }
}
```

#### Tool Reference
```markdown
<!-- 자동 생성: docs/tools/search_schools.md -->
# search_schools

**Provider**: school-alrimi
**Description**: 조건에 맞는 학교 검색

## Input Schema
```json
{
  "region": {
    "type": "string",
    "description": "지역 (예: 서울특별시)",
    "required": false
  },
  "schoolType": {
    "type": "string",
    "enum": ["02", "03", "04", "05", "06", "07"],
    "description": "학교급",
    "required": true
  }
}
```

## Example
```typescript
const result = await mcpClient.callTool('search_schools', {
  region: '서울특별시',
  district: '강남구',
  schoolType: '04',
});
```

## Response
```json
[
  {
    "SCHUL_CODE": "7010001",
    "SCHUL_NM": "테스트고등학교",
    "ATPT_OFCDC_ORG_NM": "서울특별시교육청"
  }
]
```
```

### 2. 개발자 가이드

#### Provider 작성 가이드
```markdown
<!-- docs/guides/creating-provider.md -->
# Custom Provider 작성 가이드

## 1. 개요
새로운 API를 통합하기 위한 Provider를 작성하는 방법을 설명합니다.

## 2. 사전 준비
- API 문서 확인
- API 키 발급
- 테스트 계정 준비

## 3. Provider 생성
\```bash
npm run generate:provider -- --name my-api
\```

## 4. Endpoint 구현
각 API 엔드포인트에 대해 EndpointBase를 상속한 클래스를 작성합니다.

\```typescript
export class MyEndpoint extends EndpointBase {
  // 구현...
}
\```

## 5. Tool 구현
MCP Tool을 구현하여 Claude가 사용할 수 있게 합니다.

## 6. 테스트 작성
단위 테스트와 통합 테스트를 작성합니다.

## 7. 문서 작성
Provider의 README.md를 작성합니다.
```

### 3. 인터랙티브 문서

#### Swagger/OpenAPI UI
```yaml
# docs/openapi.yaml
openapi: 3.0.0
info:
  title: Education API MCP Server
  version: 1.0.0
  description: MCP Server for Korean Education APIs

servers:
  - url: http://localhost:3000
    description: Local development

paths:
  /tools/search_schools:
    post:
      summary: 학교 검색
      operationId: searchSchools
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SearchSchoolsInput'
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/SchoolInfo'
```

### 4. 예제 컬렉션

#### Postman/Insomnia Collection
```json
{
  "name": "Education API MCP Server",
  "requests": [
    {
      "name": "Search Schools",
      "method": "POST",
      "url": "http://localhost:3000/tools/search_schools",
      "body": {
        "region": "서울특별시",
        "schoolType": "04"
      }
    }
  ]
}
```

---

## 성능 및 확장성

### 성능 목표

| 메트릭 | 목표 | 측정 방법 |
|--------|------|----------|
| 평균 응답 시간 | < 500ms | Prometheus + Grafana |
| P95 응답 시간 | < 1000ms | Prometheus + Grafana |
| P99 응답 시간 | < 2000ms | Prometheus + Grafana |
| 동시 요청 처리 | 100+ | Load testing |
| 캐시 적중률 | > 70% | Redis stats |
| 에러율 | < 1% | Error tracking |
| 가동 시간 | > 99.9% | Uptime monitoring |

### 확장성 전략

#### 1. 수평 확장 (Scale Out)
```yaml
# docker-compose.yml
version: '3.8'
services:
  mcp-server-1:
    image: edu-api-mcp-server
    environment:
      - INSTANCE_ID=1

  mcp-server-2:
    image: edu-api-mcp-server
    environment:
      - INSTANCE_ID=2

  mcp-server-3:
    image: edu-api-mcp-server
    environment:
      - INSTANCE_ID=3

  load-balancer:
    image: nginx
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    ports:
      - "3000:3000"
    depends_on:
      - mcp-server-1
      - mcp-server-2
      - mcp-server-3
```

#### 2. 캐시 전략
```typescript
// 3-tier caching
export class MultiLevelCache implements Cache {
  constructor(
    private l1: MemoryCache,      // 로컬 메모리 (빠름, 작음)
    private l2: RedisCache,       // Redis (중간, 중간)
    private l3: DatabaseCache     // DB (느림, 큼)
  ) {}

  async get(key: string): Promise<unknown> {
    // L1 체크
    let value = await this.l1.get(key);
    if (value) return value;

    // L2 체크
    value = await this.l2.get(key);
    if (value) {
      await this.l1.set(key, value); // L1에 복사
      return value;
    }

    // L3 체크
    value = await this.l3.get(key);
    if (value) {
      await this.l2.set(key, value); // L2에 복사
      await this.l1.set(key, value); // L1에 복사
      return value;
    }

    return undefined;
  }
}
```

#### 3. Rate Limiting
```typescript
// Per-provider rate limiting
export class RateLimiter {
  private buckets = new Map<string, TokenBucket>();

  async checkLimit(providerId: string): Promise<boolean> {
    const bucket = this.getBucket(providerId);
    return bucket.consume();
  }

  private getBucket(providerId: string): TokenBucket {
    if (!this.buckets.has(providerId)) {
      const config = this.getProviderRateLimit(providerId);
      this.buckets.set(providerId, new TokenBucket(config));
    }
    return this.buckets.get(providerId)!;
  }
}
```

#### 4. 배치 처리
```typescript
// Batch multiple requests
export class BatchProcessor {
  private queue: Request[] = [];
  private timer: NodeJS.Timeout | null = null;

  async enqueue(request: Request): Promise<Response> {
    return new Promise((resolve, reject) => {
      this.queue.push({ ...request, resolve, reject });
      this.scheduleBatch();
    });
  }

  private scheduleBatch(): void {
    if (this.timer) return;

    this.timer = setTimeout(() => {
      this.processBatch();
    }, 100); // 100ms 대기 후 일괄 처리
  }

  private async processBatch(): Promise<void> {
    const batch = this.queue.splice(0, 100); // 최대 100개씩
    if (batch.length === 0) return;

    const results = await this.executeBatch(batch);

    batch.forEach((req, i) => {
      req.resolve(results[i]);
    });
  }
}
```

### 모니터링

#### Metrics Collection
```typescript
// src/services/metrics/prometheus.ts
import { Counter, Histogram, Gauge } from 'prom-client';

export class MetricsCollector {
  private requestCounter = new Counter({
    name: 'mcp_requests_total',
    help: 'Total number of MCP requests',
    labelNames: ['provider', 'endpoint', 'status'],
  });

  private responseTime = new Histogram({
    name: 'mcp_response_duration_seconds',
    help: 'Response time in seconds',
    labelNames: ['provider', 'endpoint'],
    buckets: [0.1, 0.3, 0.5, 1, 2, 5],
  });

  private cacheHitRate = new Gauge({
    name: 'mcp_cache_hit_rate',
    help: 'Cache hit rate',
    labelNames: ['provider'],
  });

  recordRequest(provider: string, endpoint: string, status: string): void {
    this.requestCounter.inc({ provider, endpoint, status });
  }

  recordResponseTime(provider: string, endpoint: string, duration: number): void {
    this.responseTime.observe({ provider, endpoint }, duration);
  }
}
```

---

## 총 개발 일정 요약

| Phase | 기간 | 주요 작업 | 소요시간 | 완료 API 수 |
|-------|------|----------|----------|------------|
| Phase 0 | Week 1 | 프로젝트 초기화 | 6-8h | 0 |
| Phase 1 | Week 2-3 | 코어 시스템 구축 | 20-25h | 0 |
| Phase 2 | Week 4-5 | 학교알리미 Provider | 25-30h | 12 |
| Phase 3 | Week 6-8 | 4개 Provider 추가 | 40-50h | 33 |
| Phase 4 | Week 9-10 | 고급 기능 | 25-30h | 33 |
| Phase 5 | Week 11-12 | 문서화 및 배포 | 15-20h | 33 |
| **총계** | **12주** | | **131-163h** | **33개** |

**추가 확장 가능**: 10개 이상 API (총 43개+)

---

## 결론

### ✅ 핵심 강점

1. **확장 가능성**
   - Provider 플러그인 아키텍처로 무한 확장 가능
   - API 추가 시 기존 코드 수정 최소화
   - 스캐폴딩 도구로 빠른 개발

2. **유지보수성**
   - 명확한 책임 분리 (Provider, Endpoint, Tool)
   - 표준화된 인터페이스
   - 자동 문서 생성

3. **성능**
   - 다층 캐싱 전략
   - 배치 처리 지원
   - 수평 확장 가능

4. **개발자 경험**
   - TypeScript 완전 타입 안전성
   - 풍부한 예제와 문서
   - 쉬운 테스트 작성

### 🎯 로드맵

**Short-term (3개월)**
- Phase 1-3 완료: 33개 API 통합
- 기본 MCP Tools 제공
- Docker 배포 지원

**Mid-term (6개월)**
- Phase 4-5 완료: 고급 분석 기능
- 10개 이상 추가 API 통합
- 모니터링 및 대시보드

**Long-term (1년)**
- 50개 이상 API 통합
- AI 기반 교육 인사이트
- 오픈소스 커뮤니티 구축

### 💡 핵심 가치 제안

이 아키텍처는 **단순히 API를 통합하는 것을 넘어**, 한국 교육 데이터에 대한 **단일 접근점(Single Point of Access)**을 제공하여 AI 에이전트가 교육 관련 복잡한 질문에 답할 수 있게 합니다.

**예시:**
- "서울 강남구에서 학생-교사 비율이 가장 좋은 고등학교는?"
- "지난 3년간 학생 수가 가장 많이 증가한 지역은?"
- "급식 만족도와 학업 성취도의 상관관계는?"

이러한 질문들은 **여러 API의 데이터를 조합**해야 답할 수 있으며, 이 MCP 서버는 이를 **자동화**합니다.
