/**
 * Template string processing utilities
 */
export class TemplateUtils {
  /**
   * Replace variables in template string
   * Variables format: {{variableName}}
   */
  static replaceVariables(
    template: string,
    variables: Record<string, string | number | boolean>
  ): string {
    let result = template;

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(regex, String(value));
    });

    return result;
  }

  /**
   * Replace conditional blocks in template
   * Format: {{#if condition}}content{{/if}}
   */
  static replaceConditionals(
    template: string,
    conditions: Record<string, boolean>
  ): string {
    let result = template;

    Object.entries(conditions).forEach(([key, value]) => {
      const regex = new RegExp(
        `{{#if\\s+${key}}}([\\s\\S]*?){{/if}}`,
        'g'
      );

      if (value) {
        // Keep content if condition is true
        result = result.replace(regex, '$1');
      } else {
        // Remove content if condition is false
        result = result.replace(regex, '');
      }
    });

    return result;
  }

  /**
   * Process full template with variables and conditionals
   */
  static process(
    template: string,
    data: {
      variables?: Record<string, string | number | boolean>;
      conditions?: Record<string, boolean>;
    }
  ): string {
    let result = template;

    // First process conditionals
    if (data.conditions) {
      result = this.replaceConditionals(result, data.conditions);
    }

    // Then replace variables
    if (data.variables) {
      result = this.replaceVariables(result, data.variables);
    }

    return result;
  }

  /**
   * Convert string to PascalCase
   */
  static toPascalCase(str: string): string {
    return str
      .split(/[-_\s]+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  /**
   * Convert string to camelCase
   */
  static toCamelCase(str: string): string {
    const pascal = this.toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  }

  /**
   * Convert string to kebab-case
   */
  static toKebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  }

  /**
   * Convert string to snake_case
   */
  static toSnakeCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/[\s-]+/g, '_')
      .toLowerCase();
  }
}
