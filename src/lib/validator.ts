/**
 * Parameter Validation System
 *
 * 파라미터 검증을 위한 체계화된 시스템
 */

import type { Parameter } from '../types/index.js';
import { ErrorCode, ValidationError } from './errors.js';

/**
 * 필드 검증기 인터페이스
 */
export interface FieldValidator {
  required: (message?: string) => ValidationBuilder;
  string: (min?: number, max?: number, message?: string) => ValidationBuilder;
  number: (min?: number, max?: number, message?: string) => ValidationBuilder;
  pattern: (regex: RegExp, message?: string) => ValidationBuilder;
  email: (message?: string) => ValidationBuilder;
  custom: (validateFn: (value: unknown) => boolean, message: string) => ValidationBuilder;
}

/**
 * 검증 규칙
 */
export interface ValidationRule {
  /**
   * 필드명
   */
  field: string;

  /**
   * 검증 함수
   */
  validate: (value: unknown) => boolean;

  /**
   * 에러 메시지
   */
  message: string;
}

/**
 * 검증 결과
 */
export interface ValidationResult {
  /**
   * 검증 성공 여부
   */
  valid: boolean;

  /**
   * 에러 목록
   */
  errors: ValidationErrorDetail[];
}

/**
 * 검증 에러 상세 정보
 */
export interface ValidationErrorDetail {
  /**
   * 필드명
   */
  field: string;

  /**
   * 에러 메시지
   */
  message: string;

  /**
   * 에러 코드
   */
  code: string;

  /**
   * 입력된 값
   */
  value?: unknown;

  /**
   * 예상 값 또는 제약사항
   */
  constraint?: unknown;
}

/**
 * 파라미터 검증기
 */
export class ParameterValidator {
  /**
   * 파라미터 스키마에 따라 값 검증
   */
  static validate(
    schema: Parameter[],
    params: Record<string, unknown>
  ): ValidationResult {
    const errors: ValidationErrorDetail[] = [];

    for (const param of schema) {
      const value = params[param.name];

      // Required 체크
      if (param.required && this.isNullOrUndefined(value)) {
        errors.push({
          field: param.name,
          message: `필수 파라미터 '${param.name}'가 누락되었습니다`,
          code: ErrorCode.REQUIRED_PARAMETER_MISSING,
          constraint: { required: true },
        });
        continue;
      }

      // Optional이면서 값이 없는 경우 스킵
      if (!param.required && this.isNullOrUndefined(value)) {
        continue;
      }

      // 타입 체크
      if (!this.validateType(value, param.type)) {
        errors.push({
          field: param.name,
          message: `'${param.name}'은(는) ${param.type} 타입이어야 합니다`,
          code: ErrorCode.INVALID_PARAMETER_TYPE,
          value,
          constraint: { expectedType: param.type },
        });
        continue;
      }

      // Enum 체크
      if (param.enum && !this.validateEnum(value, param.enum)) {
        errors.push({
          field: param.name,
          message: `'${param.name}'은(는) [${param.enum.join(', ')}] 중 하나여야 합니다`,
          code: ErrorCode.INVALID_PARAMETER_VALUE,
          value,
          constraint: { allowedValues: param.enum },
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 단일 필드 검증
   */
  static validateField(
    fieldName: string,
    value: unknown,
    rules: ValidationRule[]
  ): ValidationErrorDetail[] {
    const errors: ValidationErrorDetail[] = [];

    for (const rule of rules) {
      if (!rule.validate(value)) {
        errors.push({
          field: fieldName,
          message: rule.message,
          code: ErrorCode.INVALID_PARAMETER_VALUE,
          value,
        });
      }
    }

    return errors;
  }

  /**
   * 커스텀 검증 규칙 실행
   */
  static validateWithRules(
    params: Record<string, unknown>,
    rules: ValidationRule[]
  ): ValidationResult {
    const errors: ValidationErrorDetail[] = [];

    for (const rule of rules) {
      const value = params[rule.field];
      if (!rule.validate(value)) {
        errors.push({
          field: rule.field,
          message: rule.message,
          code: ErrorCode.INVALID_PARAMETER_VALUE,
          value,
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * null 또는 undefined 체크
   */
  private static isNullOrUndefined(value: unknown): boolean {
    return value === null || value === undefined;
  }

  /**
   * 타입 검증
   */
  private static validateType(
    value: unknown,
    expectedType: 'string' | 'number' | 'boolean'
  ): boolean {
    const actualType = typeof value;

    // 숫자 타입인데 문자열 숫자인 경우 허용
    if (expectedType === 'number' && typeof value === 'string') {
      return !isNaN(Number(value));
    }

    return actualType === expectedType;
  }

  /**
   * Enum 검증
   */
  private static validateEnum(value: unknown, allowedValues: string[]): boolean {
    return allowedValues.includes(String(value));
  }

  /**
   * 검증 에러를 ValidationError 예외로 변환
   */
  static toError(result: ValidationResult, context?: Record<string, unknown>): ValidationError {
    if (result.valid) {
      throw new Error('Cannot convert valid result to error');
    }

    const errorMessages = result.errors.map(e => `${e.field}: ${e.message}`);
    const message = errorMessages.join(', ');

    return new ValidationError(
      message,
      ErrorCode.INVALID_PARAMETERS,
      {
        errors: result.errors,
        ...context,
      }
    );
  }

  /**
   * 검증 실패 시 예외 발생
   */
  static validateOrThrow(
    schema: Parameter[],
    params: Record<string, unknown>,
    context?: Record<string, unknown>
  ): void {
    const result = this.validate(schema, params);
    if (!result.valid) {
      throw this.toError(result, context);
    }
  }
}

/**
 * 일반적인 검증 규칙들
 */
export const ValidationRules = {
  /**
   * 문자열 길이 검증
   */
  stringLength(min?: number, max?: number): (value: unknown) => boolean {
    return (value: unknown) => {
      if (typeof value !== 'string') return false;
      if (min !== undefined && value.length < min) return false;
      if (max !== undefined && value.length > max) return false;
      return true;
    };
  },

  /**
   * 숫자 범위 검증
   */
  numberRange(min?: number, max?: number): (value: unknown) => boolean {
    return (value: unknown) => {
      const num = typeof value === 'string' ? Number(value) : value;
      if (typeof num !== 'number' || isNaN(num)) return false;
      if (min !== undefined && num < min) return false;
      if (max !== undefined && num > max) return false;
      return true;
    };
  },

  /**
   * 정규식 패턴 검증
   */
  pattern(regex: RegExp): (value: unknown) => boolean {
    return (value: unknown) => {
      if (typeof value !== 'string') return false;
      return regex.test(value);
    };
  },

  /**
   * 이메일 검증
   */
  email(): (value: unknown) => boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return (value: unknown) => {
      if (typeof value !== 'string') return false;
      return emailRegex.test(value);
    };
  },

  /**
   * URL 검증
   */
  url(): (value: unknown) => boolean {
    return (value: unknown) => {
      if (typeof value !== 'string') return false;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    };
  },

  /**
   * 날짜 검증
   */
  date(): (value: unknown) => boolean {
    return (value: unknown) => {
      if (typeof value === 'string') {
        const date = new Date(value);
        return !isNaN(date.getTime());
      }
      return value instanceof Date && !isNaN(value.getTime());
    };
  },

  /**
   * 배열 검증
   */
  array(): (value: unknown) => boolean {
    return (value: unknown) => Array.isArray(value);
  },

  /**
   * 객체 검증
   */
  object(): (value: unknown) => boolean {
    return (value: unknown) =>
      typeof value === 'object' && value !== null && !Array.isArray(value);
  },

  /**
   * Enum 검증
   */
  enum<T>(allowedValues: T[]): (value: unknown) => boolean {
    return (value: unknown) => allowedValues.includes(value as T);
  },

  /**
   * 커스텀 검증 함수
   */
  custom(validateFn: (value: unknown) => boolean): (value: unknown) => boolean {
    return validateFn;
  },
};

/**
 * 검증 빌더 (Fluent API)
 */
export class ValidationBuilder {
  private rules: ValidationRule[] = [];

  /**
   * 필드 검증 규칙 추가
   */
  field(fieldName: string): FieldValidator {
    const self = this;
    return {
      required: (message?: string) => {
        self.rules.push({
          field: fieldName,
          validate: (value) => value !== null && value !== undefined,
          message: message || `'${fieldName}'은(는) 필수 항목입니다`,
        });
        return self;
      },

      string: (min?: number, max?: number, message?: string) => {
        self.rules.push({
          field: fieldName,
          validate: ValidationRules.stringLength(min, max),
          message:
            message ||
            `'${fieldName}'은(는) ${min ? `최소 ${min}자` : ''}${max ? ` 최대 ${max}자` : ''}여야 합니다`,
        });
        return self;
      },

      number: (min?: number, max?: number, message?: string) => {
        self.rules.push({
          field: fieldName,
          validate: ValidationRules.numberRange(min, max),
          message:
            message ||
            `'${fieldName}'은(는) ${min !== undefined ? `${min} 이상` : ''}${max !== undefined ? ` ${max} 이하` : ''}의 숫자여야 합니다`,
        });
        return self;
      },

      pattern: (regex: RegExp, message?: string) => {
        self.rules.push({
          field: fieldName,
          validate: ValidationRules.pattern(regex),
          message: message || `'${fieldName}'의 형식이 올바르지 않습니다`,
        });
        return self;
      },

      email: (message?: string) => {
        self.rules.push({
          field: fieldName,
          validate: ValidationRules.email(),
          message: message || `'${fieldName}'은(는) 올바른 이메일 형식이어야 합니다`,
        });
        return self;
      },

      custom: (validateFn: (value: unknown) => boolean, message: string) => {
        self.rules.push({
          field: fieldName,
          validate: validateFn,
          message,
        });
        return self;
      },
    };
  }

  /**
   * 검증 실행
   */
  validate(params: Record<string, unknown>): ValidationResult {
    return ParameterValidator.validateWithRules(params, this.rules);
  }

  /**
   * 검증 실패 시 예외 발생
   */
  validateOrThrow(params: Record<string, unknown>): void {
    const result = this.validate(params);
    if (!result.valid) {
      throw ParameterValidator.toError(result);
    }
  }
}

/**
 * 사용 예시
 */
export const examples = {
  basic: () => {
    // 기본 파라미터 검증
    const schema: Parameter[] = [
      { name: 'sidoCode', type: 'string', required: true },
      { name: 'schulKndCode', type: 'string', required: true, enum: ['02', '03', '04'] },
      { name: 'pbanYr', type: 'number', required: false },
    ];

    const params = {
      sidoCode: '11',
      schulKndCode: '04',
    };

    const result = ParameterValidator.validate(schema, params);
    console.log('Validation result:', result);
  },

  withRules: () => {
    // 커스텀 검증 규칙
    const rules: ValidationRule[] = [
      {
        field: 'sidoCode',
        validate: ValidationRules.pattern(/^\d{2}$/),
        message: 'sidoCode는 2자리 숫자여야 합니다',
      },
      {
        field: 'pbanYr',
        validate: ValidationRules.numberRange(2020, new Date().getFullYear()),
        message: '2020년 이후 연도만 입력 가능합니다',
      },
    ];

    const params = { sidoCode: '11', pbanYr: 2023 };
    const result = ParameterValidator.validateWithRules(params, rules);
    console.log('Custom validation:', result);
  },

  builder: () => {
    // Fluent API 사용
    const validator = new ValidationBuilder();

    const emailValidator = validator.field('email');
    emailValidator.required();
    emailValidator.email();

    const ageValidator = validator.field('age');
    ageValidator.number(0, 150);

    const usernameValidator = validator.field('username');
    usernameValidator.string(3, 20);

    const params = { email: 'test@example.com', age: 25, username: 'john' };
    validator.validateOrThrow(params);
  },

  throwOnError: () => {
    // 검증 실패 시 예외 발생
    const schema: Parameter[] = [
      { name: 'required_field', type: 'string', required: true },
    ];

    try {
      ParameterValidator.validateOrThrow(schema, {}, { endpoint: 'test' });
    } catch (error) {
      if (error instanceof ValidationError) {
        console.log('Validation failed:', error.message);
        console.log('Errors:', error.context?.errors);
      }
    }
  },
};
