/**
 * MCP Server Error Handling System
 *
 * 체계화된 에러 클래스와 에러 코드를 제공합니다.
 */

/**
 * 에러 코드 분류
 */
export enum ErrorCode {
  // Provider 관련 에러
  PROVIDER_NOT_FOUND = 'PROVIDER_NOT_FOUND',
  PROVIDER_INIT_FAILED = 'PROVIDER_INIT_FAILED',
  PROVIDER_LOAD_FAILED = 'PROVIDER_LOAD_FAILED',

  // Endpoint 관련 에러
  ENDPOINT_NOT_FOUND = 'ENDPOINT_NOT_FOUND',
  ENDPOINT_EXECUTION_FAILED = 'ENDPOINT_EXECUTION_FAILED',

  // 파라미터 검증 에러
  INVALID_PARAMETERS = 'INVALID_PARAMETERS',
  REQUIRED_PARAMETER_MISSING = 'REQUIRED_PARAMETER_MISSING',
  INVALID_PARAMETER_TYPE = 'INVALID_PARAMETER_TYPE',
  INVALID_PARAMETER_VALUE = 'INVALID_PARAMETER_VALUE',

  // API 요청 관련 에러
  API_REQUEST_FAILED = 'API_REQUEST_FAILED',
  API_TIMEOUT = 'API_TIMEOUT',
  API_RATE_LIMITED = 'API_RATE_LIMITED',
  API_AUTHENTICATION_FAILED = 'API_AUTHENTICATION_FAILED',

  // HTTP 에러
  HTTP_ERROR = 'HTTP_ERROR',
  HTTP_CLIENT_ERROR = 'HTTP_CLIENT_ERROR',
  HTTP_SERVER_ERROR = 'HTTP_SERVER_ERROR',

  // 파싱 관련 에러
  TOON_PARSE_ERROR = 'TOON_PARSE_ERROR',
  SCHEMA_VALIDATION_FAILED = 'SCHEMA_VALIDATION_FAILED',
  JSON_PARSE_ERROR = 'JSON_PARSE_ERROR',
  XML_PARSE_ERROR = 'XML_PARSE_ERROR',

  // 캐시 관련 에러
  CACHE_ERROR = 'CACHE_ERROR',
  CACHE_WRITE_FAILED = 'CACHE_WRITE_FAILED',
  CACHE_READ_FAILED = 'CACHE_READ_FAILED',

  // 일반 에러
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
}

/**
 * 에러 심각도
 */
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

/**
 * 에러 컨텍스트 인터페이스
 */
export interface ErrorContext {
  providerId?: string;
  endpointId?: string;
  parameters?: Record<string, unknown>;
  url?: string;
  statusCode?: number;
  timestamp?: number;
  [key: string]: unknown;
}

/**
 * MCP 커스텀 에러 클래스
 */
export class MCPError extends Error {
  public readonly code: ErrorCode;
  public readonly severity: ErrorSeverity;
  public readonly context?: ErrorContext;
  public readonly timestamp: number;
  public readonly isOperational: boolean;

  constructor(
    code: ErrorCode,
    message: string,
    options?: {
      severity?: ErrorSeverity;
      context?: ErrorContext;
      isOperational?: boolean;
      cause?: Error;
    }
  ) {
    super(message);
    this.name = 'MCPError';
    this.code = code;
    this.severity = options?.severity || this.inferSeverity(code);
    this.context = options?.context;
    this.timestamp = Date.now();
    this.isOperational = options?.isOperational ?? true;

    if (options?.cause) {
      this.cause = options.cause;
    }

    // 프로토타입 체인 유지
    Object.setPrototypeOf(this, MCPError.prototype);

    // 스택 트레이스 캡처
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * 에러 코드로부터 심각도를 추론
   */
  private inferSeverity(code: ErrorCode): ErrorSeverity {
    const criticalErrors = [
      ErrorCode.PROVIDER_INIT_FAILED,
      ErrorCode.INTERNAL_ERROR,
    ];

    const highErrors = [
      ErrorCode.PROVIDER_NOT_FOUND,
      ErrorCode.API_AUTHENTICATION_FAILED,
      ErrorCode.HTTP_SERVER_ERROR,
    ];

    const mediumErrors = [
      ErrorCode.ENDPOINT_NOT_FOUND,
      ErrorCode.API_REQUEST_FAILED,
      ErrorCode.HTTP_CLIENT_ERROR,
      ErrorCode.TOON_PARSE_ERROR,
    ];

    if (criticalErrors.includes(code)) return ErrorSeverity.CRITICAL;
    if (highErrors.includes(code)) return ErrorSeverity.HIGH;
    if (mediumErrors.includes(code)) return ErrorSeverity.MEDIUM;
    return ErrorSeverity.LOW;
  }

  /**
   * 에러를 JSON으로 직렬화
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      severity: this.severity,
      context: this.context,
      timestamp: this.timestamp,
      isOperational: this.isOperational,
      stack: this.stack,
    };
  }

  /**
   * 사용자 친화적 메시지 생성
   */
  getUserMessage(): string {
    const baseMessages: Record<ErrorCode, string> = {
      [ErrorCode.PROVIDER_NOT_FOUND]: '요청한 데이터 제공자를 찾을 수 없습니다.',
      [ErrorCode.ENDPOINT_NOT_FOUND]: '요청한 API 엔드포인트를 찾을 수 없습니다.',
      [ErrorCode.INVALID_PARAMETERS]: '입력 파라미터가 올바르지 않습니다.',
      [ErrorCode.REQUIRED_PARAMETER_MISSING]: '필수 파라미터가 누락되었습니다.',
      [ErrorCode.API_RATE_LIMITED]: 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
      [ErrorCode.API_AUTHENTICATION_FAILED]: 'API 인증에 실패했습니다. API 키를 확인해주세요.',
      [ErrorCode.API_REQUEST_FAILED]: 'API 요청이 실패했습니다.',
      [ErrorCode.HTTP_ERROR]: 'HTTP 요청 중 오류가 발생했습니다.',
      [ErrorCode.TOON_PARSE_ERROR]: 'TOON 파일 파싱 중 오류가 발생했습니다.',
      [ErrorCode.UNKNOWN_ERROR]: '알 수 없는 오류가 발생했습니다.',
    } as Record<ErrorCode, string>;

    return baseMessages[this.code] || this.message;
  }

  /**
   * 디버그 정보 출력
   */
  getDebugInfo(): string {
    const parts: string[] = [
      `[${this.code}] ${this.message}`,
      `Severity: ${this.severity}`,
      `Timestamp: ${new Date(this.timestamp).toISOString()}`,
    ];

    if (this.context) {
      parts.push(`Context: ${JSON.stringify(this.context, null, 2)}`);
    }

    if (this.stack) {
      parts.push(`Stack: ${this.stack}`);
    }

    return parts.join('\n');
  }
}

/**
 * 특화된 에러 클래스들
 */

export class ProviderError extends MCPError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.PROVIDER_INIT_FAILED,
    context?: ErrorContext
  ) {
    super(code, message, { context, severity: ErrorSeverity.HIGH });
    this.name = 'ProviderError';
  }
}

export class EndpointError extends MCPError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.ENDPOINT_NOT_FOUND,
    context?: ErrorContext
  ) {
    super(code, message, { context });
    this.name = 'EndpointError';
  }
}

export class ValidationError extends MCPError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.INVALID_PARAMETERS,
    context?: ErrorContext
  ) {
    super(code, message, { context, severity: ErrorSeverity.MEDIUM });
    this.name = 'ValidationError';
  }
}

export class ApiError extends MCPError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.API_REQUEST_FAILED,
    context?: ErrorContext
  ) {
    super(code, message, { context });
    this.name = 'ApiError';
  }
}

export class ParseError extends MCPError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.TOON_PARSE_ERROR,
    context?: ErrorContext
  ) {
    super(code, message, { context });
    this.name = 'ParseError';
  }
}

/**
 * 에러 헬퍼 함수들
 */

/**
 * HTTP 상태 코드로부터 에러 코드 생성
 */
export function httpStatusToErrorCode(status: number): ErrorCode {
  if (status === 401 || status === 403) {
    return ErrorCode.API_AUTHENTICATION_FAILED;
  }
  if (status === 429) {
    return ErrorCode.API_RATE_LIMITED;
  }
  if (status === 408 || status === 504) {
    return ErrorCode.API_TIMEOUT;
  }
  if (status >= 400 && status < 500) {
    return ErrorCode.HTTP_CLIENT_ERROR;
  }
  if (status >= 500) {
    return ErrorCode.HTTP_SERVER_ERROR;
  }
  return ErrorCode.HTTP_ERROR;
}

/**
 * 에러가 재시도 가능한지 판단
 */
export function isRetryable(error: MCPError): boolean {
  const retryableErrors = [
    ErrorCode.API_TIMEOUT,
    ErrorCode.API_RATE_LIMITED,
    ErrorCode.HTTP_SERVER_ERROR,
  ];

  return retryableErrors.includes(error.code);
}

/**
 * 에러가 일시적인지 판단
 */
export function isTransient(error: MCPError): boolean {
  const transientErrors = [
    ErrorCode.API_TIMEOUT,
    ErrorCode.API_RATE_LIMITED,
    ErrorCode.CACHE_ERROR,
  ];

  return transientErrors.includes(error.code);
}

/**
 * 일반 Error를 MCPError로 변환
 */
export function wrapError(error: unknown, defaultCode: ErrorCode = ErrorCode.UNKNOWN_ERROR): MCPError {
  if (error instanceof MCPError) {
    return error;
  }

  if (error instanceof Error) {
    return new MCPError(defaultCode, error.message, {
      cause: error,
      context: {
        originalError: error.name,
      },
    });
  }

  return new MCPError(defaultCode, String(error));
}

/**
 * 에러 타입 가드
 */
export function isMCPError(error: unknown): error is MCPError {
  return error instanceof MCPError;
}

export function isProviderError(error: unknown): error is ProviderError {
  return error instanceof ProviderError;
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
