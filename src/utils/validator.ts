/**
 * Input validation utilities
 */

export const validators = {
  /**
   * Validate project name (npm package naming rules)
   */
  projectName: (input: string): boolean | string => {
    if (!input || input.trim().length === 0) {
      return 'Project name is required';
    }

    // Check length
    if (input.length > 214) {
      return 'Project name must be less than 214 characters';
    }

    // Check for valid characters (lowercase letters, numbers, hyphens, underscores)
    const validPattern = /^[a-z0-9-_]+$/;
    if (!validPattern.test(input)) {
      return 'Project name can only contain lowercase letters, numbers, hyphens, and underscores';
    }

    // Cannot start with . or _
    if (input.startsWith('.') || input.startsWith('_')) {
      return 'Project name cannot start with . or _';
    }

    // Reserved names
    const reserved = ['node_modules', 'favicon.ico'];
    if (reserved.includes(input.toLowerCase())) {
      return `"${input}" is a reserved name`;
    }

    return true;
  },

  /**
   * Validate port number
   */
  port: (input: string): boolean | string => {
    const port = parseInt(input, 10);
    if (isNaN(port)) {
      return 'Port must be a number';
    }
    if (port < 1 || port > 65535) {
      return 'Port must be between 1 and 65535';
    }
    return true;
  },

  /**
   * Validate non-empty string
   */
  required: (input: string): boolean | string => {
    return input && input.trim().length > 0 ? true : 'This field is required';
  },
};
