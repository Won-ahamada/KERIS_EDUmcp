/**
 * MCP Tool Registry
 *
 * Provider의 Endpoint를 MCP Tool로 자동 등록
 */

import type { ProviderSpec, ToolDefinition, Parameter } from '../types/index.js';

interface ExecutableProvider {
  id: string;
  name: string;
  version: string;
  endpoints: Map<string, any>;
  executeEndpoint: (endpointId: string, params: Record<string, any>) => Promise<any>;
}

interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
  handler: (args: Record<string, any>) => Promise<any>;
}

export class ToolRegistry {
  private tools: Map<string, MCPTool> = new Map();
  private providers: Map<string, ExecutableProvider> = new Map();

  /**
   * Provider 등록 및 Tools 자동 생성
   */
  registerProvider(provider: ExecutableProvider, spec: ProviderSpec): void {
    console.log(`📝 Registering tools for provider: ${provider.name}`);

    this.providers.set(provider.id, provider);

    // 1. Endpoint 기반 Tool 생성
    this.registerEndpointTools(provider, spec);

    // 2. Custom Tool 정의가 있으면 등록
    if (spec.tools) {
      this.registerCustomTools(provider, spec);
    }

    console.log(`✅ Registered ${this.tools.size} total tool(s)`);
  }

  /**
   * Endpoint를 MCP Tool로 등록
   */
  private registerEndpointTools(provider: ExecutableProvider, _spec: ProviderSpec): void {
    for (const [endpointId, endpoint] of provider.endpoints) {
      const toolName = `${provider.id}_${endpointId}`;

      const tool: MCPTool = {
        name: toolName,
        description: this.createToolDescription(endpoint, provider),
        inputSchema: this.createInputSchema(endpoint.parameters),
        handler: async (args: Record<string, any>) => {
          return await provider.executeEndpoint(endpointId, args);
        },
      };

      this.tools.set(toolName, tool);
      console.log(`  ✓ ${toolName}`);
    }
  }

  /**
   * Custom Tool 정의 등록 (여러 Endpoint 조합)
   */
  private registerCustomTools(provider: ExecutableProvider, spec: ProviderSpec): void {
    if (!spec.tools) return;

    for (const toolDef of spec.tools) {
      const toolName = `${provider.id}_${toolDef.name}`;

      const tool: MCPTool = {
        name: toolName,
        description: toolDef.description,
        inputSchema: toolDef.inputSchema as any,
        handler: async (args: Record<string, any>) => {
          // Custom tool은 여러 endpoint를 조합하여 실행
          return await this.executeCustomTool(provider, toolDef, args);
        },
      };

      this.tools.set(toolName, tool);
      console.log(`  ✓ ${toolName} (custom)`);
    }
  }

  /**
   * Custom Tool 실행 (여러 Endpoint 조합)
   */
  private async executeCustomTool(
    provider: ExecutableProvider,
    toolDef: ToolDefinition,
    args: Record<string, any>
  ): Promise<any> {
    const results: Record<string, any> = {};

    // 정의된 endpoint들을 순차 실행
    for (const endpointId of toolDef.usesEndpoints) {
      const result = await provider.executeEndpoint(endpointId, args);

      if (!result.success) {
        return result; // 에러 발생시 즉시 반환
      }

      results[endpointId] = result.data;
    }

    return {
      success: true,
      data: results,
    };
  }

  /**
   * Tool 설명 생성
   */
  private createToolDescription(endpoint: any, provider: ExecutableProvider): string {
    let desc = `[${provider.name}] ${endpoint.name || endpoint.id}`;

    if (endpoint.description) {
      desc += `\n${endpoint.description}`;
    }

    if (endpoint.category) {
      desc += `\nCategory: ${endpoint.category}`;
    }

    if (endpoint.schoolTypes && endpoint.schoolTypes.length > 0) {
      desc += `\nSchool Types: ${endpoint.schoolTypes.join(', ')}`;
    }

    return desc;
  }

  /**
   * Input Schema 생성 (JSON Schema 형식)
   */
  private createInputSchema(parameters: Parameter[]): {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  } {
    const properties: Record<string, any> = {};
    const required: string[] = [];

    for (const param of parameters) {
      // JSON Schema 타입 변환
      let jsonType: string;
      switch (param.type) {
        case 'number':
          jsonType = 'number';
          break;
        case 'boolean':
          jsonType = 'boolean';
          break;
        default:
          jsonType = 'string';
      }

      properties[param.name] = {
        type: jsonType,
        description: param.description || '',
      };

      // Enum 추가
      if (param.enum && param.enum.length > 0) {
        properties[param.name].enum = param.enum;
      }

      // Default 값 추가
      if (param.default !== undefined) {
        properties[param.name].default = param.default;
      }

      // Example 추가
      if (param.example !== undefined) {
        properties[param.name].example = param.example;
      }

      // Required 체크
      if (param.required) {
        required.push(param.name);
      }
    }

    return {
      type: 'object',
      properties,
      required,
    };
  }

  /**
   * 모든 등록된 Tool 가져오기
   */
  getAllTools(): MCPTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * 특정 Tool 가져오기
   */
  getTool(name: string): MCPTool | undefined {
    return this.tools.get(name);
  }

  /**
   * Tool 실행
   */
  async executeTool(name: string, args: Record<string, any>): Promise<any> {
    const tool = this.tools.get(name);

    if (!tool) {
      return {
        success: false,
        error: {
          code: 'TOOL_NOT_FOUND',
          message: `Tool '${name}' not found`,
        },
      };
    }

    try {
      return await tool.handler(args);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'TOOL_EXECUTION_ERROR',
          message: error.message,
        },
      };
    }
  }

  /**
   * Tool 목록 조회 (MCP ListTools 응답 형식)
   */
  listTools(): Array<{
    name: string;
    description: string;
    inputSchema: any;
  }> {
    return Array.from(this.tools.values()).map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    }));
  }

  /**
   * Provider별 Tool 목록
   */
  getToolsByProvider(providerId: string): MCPTool[] {
    const prefix = `${providerId}_`;
    return Array.from(this.tools.values()).filter(tool =>
      tool.name.startsWith(prefix)
    );
  }

  /**
   * 통계 정보
   */
  getStats(): {
    totalTools: number;
    totalProviders: number;
    toolsByProvider: Record<string, number>;
  } {
    const toolsByProvider: Record<string, number> = {};

    for (const providerId of this.providers.keys()) {
      toolsByProvider[providerId] = this.getToolsByProvider(providerId).length;
    }

    return {
      totalTools: this.tools.size,
      totalProviders: this.providers.size,
      toolsByProvider,
    };
  }
}
