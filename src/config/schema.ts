import { z } from 'zod';

/**
 * Zod schemas for configuration validation
 */

export const FrameworkSchema = z.enum(['express', 'nestjs']);

export const SQLDatabaseSchema = z.enum(['postgresql', 'mysql', 'sqlite']);

export const NoSQLDatabaseSchema = z.enum(['mongodb', 'redis']);

export const DatabaseSchema = z.union([SQLDatabaseSchema, NoSQLDatabaseSchema]);

export const FrontendSchema = z.enum(['react', 'nextjs', 'vue', 'angular', 'none']);

export const PackageManagerSchema = z.enum(['npm', 'yarn', 'pnpm']);

export const MessageQueueSchema = z.enum(['rabbitmq', 'bullmq']);

export const CIProviderSchema = z.enum(['github', 'gitlab', 'none']);

export const LoggingLibrarySchema = z.enum(['winston', 'pino']);

/**
 * Main ProjectConfig schema
 */
export const ProjectConfigSchema = z.object({
  // Project basics
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(214, 'Project name must be less than 214 characters')
    .regex(
      /^[a-z0-9-_]+$/,
      'Project name can only contain lowercase letters, numbers, hyphens, and underscores'
    )
    .refine((name) => !name.startsWith('.') && !name.startsWith('_'), {
      message: 'Project name cannot start with . or _',
    })
    .refine((name) => !['node_modules', 'favicon.ico'].includes(name.toLowerCase()), {
      message: 'This is a reserved name',
    }),

  description: z.string().optional(),
  author: z.string().optional(),
  packageManager: PackageManagerSchema,

  // Backend
  framework: FrameworkSchema,
  includeAuth: z.boolean(),
  includeSwagger: z.boolean(),

  // Databases
  sqlDatabase: SQLDatabaseSchema.optional(),
  nosqlDatabases: z.array(NoSQLDatabaseSchema).default([]),

  // Frontend
  frontend: FrontendSchema,
  monorepo: z.boolean(),

  // Infrastructure
  includeDocker: z.boolean(),
  includeKubernetes: z.boolean(),
  includeMessageQueue: z.boolean(),
  messageQueue: MessageQueueSchema.optional(),

  // Development tools
  includeTesting: z.boolean(),
  includeCI: z.boolean(),
  ciProvider: CIProviderSchema.optional(),
  includeHusky: z.boolean(),

  // Observability
  includeLogging: z.boolean(),
  loggingLibrary: LoggingLibrarySchema.optional(),
  includeMetrics: z.boolean(),
});

export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;

/**
 * Validate project configuration
 */
export function validateConfig(config: unknown): {
  success: boolean;
  data?: ProjectConfig;
  errors?: z.ZodError;
} {
  try {
    const validated = ProjectConfigSchema.parse(config);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

/**
 * Get validation error messages in readable format
 */
export function getValidationErrors(errors: z.ZodError): string[] {
  return errors.errors.map((err) => {
    const path = err.path.join('.');
    return `${path}: ${err.message}`;
  });
}
