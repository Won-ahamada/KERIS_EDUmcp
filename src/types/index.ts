/**
 * MCP 서버 타입 정의
 */

// ============================================
// Provider 관련 타입
// ============================================

export interface ProviderMetadata {
  id: string;
  name: string;
  version: string;
  baseUrl: string;
  method: string;
  dataFormat: 'JSON' | 'XML';
  authentication?: {
    type: 'apiKey' | 'oauth2' | 'basic';
    parameterName: string;
    location: 'query' | 'header';
  };
}

export interface Parameter {
  name: string;
  type: 'string' | 'number' | 'boolean';
  required: boolean;
  description?: string;
  enum?: string[];
  default?: any;
  example?: any;
}

export interface Endpoint {
  id: string;
  apiType?: string;
  name: string;
  category?: string;
  description?: string;
  parameters: Parameter[];
  requiresYear?: boolean;
  cacheTtl?: number;
  schoolTypes?: string[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  category: string;
  inputSchema: Record<string, any>;
  outputSchema?: Record<string, any>;
  usesEndpoints: string[];
}

export interface ProviderSpec {
  provider: ProviderMetadata;
  commonParameters?: {
    required?: Parameter[];
    optional?: Parameter[];
    timeSeries?: Parameter[];
  };
  endpointGroups?: Record<string, {
    description: string;
    requiresYear: boolean;
    cacheTtl: number;
    endpoints: Endpoint[];
  }>;
  endpoints?: Endpoint[];
  tools?: ToolDefinition[];
}

// ============================================
// TOON 파싱 관련 타입
// ============================================

export interface ToonSchema {
  name: string;
  count?: number;
  fields: string[];
}

export interface ToonRow {
  [key: string]: any;
}

export interface ToonParseResult {
  [tableName: string]: ToonRow[];
}

// ============================================
// Provider 실행 관련 타입
// ============================================

export interface ApiRequest {
  endpoint: string;
  params: Record<string, any>;
}

export interface ApiResponse {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
  };
}

export interface CacheConfig {
  enabled: boolean;
  ttl: number;
}

// ============================================
// MCP Tool 실행 관련 타입
// ============================================

export interface ToolContext {
  providerId: string;
  endpoint: string;
  params: Record<string, any>;
}

export interface ToolResult {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: any;
  }>;
  isError?: boolean;
}
