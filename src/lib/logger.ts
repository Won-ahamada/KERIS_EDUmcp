/**
 * Structured Logging System using Winston
 *
 * 구조화된 로깅을 위한 Winston 기반 로거
 */

import winston from 'winston';
import type { Logger as WinstonLogger } from 'winston';
import type { MCPError } from './errors.js';

/**
 * 로그 레벨
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  DEBUG = 'debug',
}

/**
 * 로그 컨텍스트
 */
export interface LogContext {
  providerId?: string;
  endpointId?: string;
  userId?: string;
  requestId?: string;
  duration?: number;
  statusCode?: number;
  [key: string]: unknown;
}

/**
 * 로거 옵션
 */
export interface LoggerOptions {
  /**
   * 로그 레벨 (기본값: info)
   */
  level?: LogLevel;

  /**
   * 파일 로깅 활성화
   */
  enableFileLogging?: boolean;

  /**
   * 로그 파일 디렉토리
   */
  logDir?: string;

  /**
   * JSON 포맷 사용
   */
  json?: boolean;

  /**
   * 컬러 출력 (콘솔)
   */
  colorize?: boolean;

  /**
   * 타임스탬프 포함
   */
  timestamp?: boolean;
}

/**
 * MCP Server 로거
 */
export class Logger {
  private winston: WinstonLogger;
  private context: LogContext;

  constructor(options: LoggerOptions = {}, initialContext: LogContext = {}) {
    this.context = initialContext;

    const {
      level = LogLevel.INFO,
      enableFileLogging = true,
      logDir = 'logs',
      json = true,
      colorize = true,
      timestamp = true,
    } = options;

    // Winston 포맷 설정
    const formats: winston.Logform.Format[] = [];

    if (timestamp) {
      formats.push(winston.format.timestamp());
    }

    if (json) {
      formats.push(winston.format.json());
    } else {
      formats.push(
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
          return `${timestamp} [${level}]: ${message} ${metaStr}`;
        })
      );
    }

    // Transports 설정
    const transports: winston.transport[] = [
      new winston.transports.Console({
        format: colorize
          ? winston.format.combine(
              winston.format.colorize(),
              winston.format.simple()
            )
          : winston.format.simple(),
      }),
    ];

    if (enableFileLogging) {
      transports.push(
        new winston.transports.File({
          filename: `${logDir}/error.log`,
          level: 'error',
        })
      );
      transports.push(
        new winston.transports.File({
          filename: `${logDir}/combined.log`,
        })
      );
    }

    // Winston 인스턴스 생성
    this.winston = winston.createLogger({
      level,
      format: winston.format.combine(...formats),
      transports,
    });
  }

  /**
   * 컨텍스트와 함께 새로운 로거 인스턴스 생성
   */
  child(context: LogContext): Logger {
    const childLogger = new Logger(
      { level: this.winston.level as LogLevel },
      { ...this.context, ...context }
    );
    childLogger.winston = this.winston.child(context);
    return childLogger;
  }

  /**
   * 컨텍스트 업데이트
   */
  setContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * 컨텍스트 조회
   */
  getContext(): LogContext {
    return { ...this.context };
  }

  /**
   * Info 레벨 로그
   */
  info(message: string, context?: LogContext): void {
    this.winston.info(message, { ...this.context, ...context });
  }

  /**
   * Error 레벨 로그
   */
  error(message: string, error?: Error | MCPError, context?: LogContext): void {
    const errorContext = error
      ? {
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
            ...(this.isMCPError(error) ? { code: error.code } : {}),
          },
        }
      : {};

    this.winston.error(message, {
      ...this.context,
      ...errorContext,
      ...context,
    });
  }

  /**
   * Warn 레벨 로그
   */
  warn(message: string, context?: LogContext): void {
    this.winston.warn(message, { ...this.context, ...context });
  }

  /**
   * Debug 레벨 로그
   */
  debug(message: string, context?: LogContext): void {
    this.winston.debug(message, { ...this.context, ...context });
  }

  /**
   * HTTP 요청 로그
   */
  http(message: string, context?: LogContext): void {
    this.winston.http(message, { ...this.context, ...context });
  }

  /**
   * API 요청 로그 (시작)
   */
  logApiRequest(
    providerId: string,
    endpointId: string,
    params: Record<string, unknown>
  ): void {
    this.http('API request started', {
      providerId,
      endpointId,
      params,
      timestamp: Date.now(),
    });
  }

  /**
   * API 응답 로그 (완료)
   */
  logApiResponse(
    providerId: string,
    endpointId: string,
    success: boolean,
    duration: number,
    statusCode?: number
  ): void {
    const level = success ? 'info' : 'error';
    this.winston.log(level, 'API request completed', {
      providerId,
      endpointId,
      success,
      duration,
      statusCode,
    });
  }

  /**
   * 캐시 히트/미스 로그
   */
  logCache(hit: boolean, key: string): void {
    this.debug(hit ? 'Cache hit' : 'Cache miss', { key, hit });
  }

  /**
   * Provider 로딩 로그
   */
  logProviderLoad(providerId: string, success: boolean, error?: Error): void {
    if (success) {
      this.info('Provider loaded successfully', { providerId });
    } else {
      this.error('Provider load failed', error, { providerId });
    }
  }

  /**
   * 성능 측정 로그
   */
  logPerformance(operation: string, duration: number, context?: LogContext): void {
    this.info(`Performance: ${operation}`, {
      operation,
      duration,
      ...context,
    });
  }

  /**
   * MCPError 타입 가드
   */
  private isMCPError(error: Error | MCPError): error is MCPError {
    return 'code' in error;
  }

  /**
   * 로그 레벨 변경
   */
  setLevel(level: LogLevel): void {
    this.winston.level = level;
  }

  /**
   * 현재 로그 레벨 조회
   */
  getLevel(): string {
    return this.winston.level;
  }
}

/**
 * 글로벌 로거 인스턴스
 */
let globalLogger: Logger | null = null;

/**
 * 글로벌 로거 초기화
 */
export function initializeLogger(options?: LoggerOptions): Logger {
  globalLogger = new Logger(options);
  return globalLogger;
}

/**
 * 글로벌 로거 조회
 */
export function getLogger(context?: LogContext): Logger {
  if (!globalLogger) {
    globalLogger = new Logger();
  }

  if (context) {
    return globalLogger.child(context);
  }

  return globalLogger;
}

/**
 * 로거 팩토리
 */
export class LoggerFactory {
  private static instances = new Map<string, Logger>();

  /**
   * 이름으로 로거 인스턴스 가져오기
   */
  static getLogger(name: string, options?: LoggerOptions): Logger {
    if (!this.instances.has(name)) {
      this.instances.set(name, new Logger(options, { module: name }));
    }
    return this.instances.get(name)!;
  }

  /**
   * 새 로거 인스턴스 생성
   */
  static createLogger(options?: LoggerOptions, context?: LogContext): Logger {
    return new Logger(options, context);
  }

  /**
   * 모든 로거 인스턴스 제거
   */
  static clearAll(): void {
    this.instances.clear();
  }
}

/**
 * 성능 측정 데코레이터
 */
export function measured(logger: Logger) {
  return function (
    _target: unknown,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const start = Date.now();
      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - start;
        logger.logPerformance(_propertyKey, duration);
        return result;
      } catch (error) {
        const duration = Date.now() - start;
        logger.error(`${_propertyKey} failed`, error as Error, { duration });
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * API 요청 로깅 데코레이터
 */
export function logApiCall(logger: Logger) {
  return function (
    _target: unknown,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (
      providerId: string,
      endpointId: string,
      params: Record<string, unknown>
    ) {
      logger.logApiRequest(providerId, endpointId, params);
      const start = Date.now();

      try {
        const result = await originalMethod.apply(this, arguments);
        const duration = Date.now() - start;
        logger.logApiResponse(providerId, endpointId, true, duration);
        return result;
      } catch (error) {
        const duration = Date.now() - start;
        logger.logApiResponse(providerId, endpointId, false, duration);
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * 사용 예시
 */
export const examples = {
  basic: () => {
    const logger = new Logger();
    logger.info('Server started');
    logger.error('Something went wrong', new Error('Test error'));
  },

  withContext: () => {
    const logger = new Logger({}, { service: 'mcp-server' });
    logger.info('Request received', { userId: '123', requestId: 'abc' });
  },

  childLogger: () => {
    const logger = new Logger();
    const apiLogger = logger.child({ module: 'api' });
    apiLogger.info('API request', { endpoint: '/schools' });
  },

  factory: () => {
    const providerLogger = LoggerFactory.getLogger('provider');
    const cacheLogger = LoggerFactory.getLogger('cache');

    providerLogger.info('Provider loaded');
    cacheLogger.info('Cache hit');
  },

  apiLogging: () => {
    const logger = new Logger();
    logger.logApiRequest('school-alrimi', 'school-basic-info', {
      sidoCode: '11',
    });
    // ... API 호출
    logger.logApiResponse('school-alrimi', 'school-basic-info', true, 250);
  },
};
