import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templatesDir = path.join(__dirname, '../templates/nestjs');

const templates = {
  // Config
  'src/config/config.module.ts.template': `import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import configuration from './configuration';

@Module({
  imports: [
    NestConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
  ],
})
export class ConfigModule {}
`,

  'src/config/configuration.ts.template': `export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  {{#if hasDatabase}}
  database: {
    type: process.env.DB_TYPE || '{{sqlDatabase}}',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || {{#eq sqlDatabase "postgresql"}}5432{{/eq}}{{#eq sqlDatabase "mysql"}}3306{{/eq}},
    username: process.env.DB_USERNAME || '{{name}}',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_DATABASE || '{{name}}',
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
  },
  {{/if}}
  {{#if includeAuth}}
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
  {{/if}}
  {{#if hasRedis}}
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  },
  {{/if}}
  {{#if hasMongoDB}}
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/{{name}}',
  },
  {{/if}}
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
});
`,

  'src/config/database.config.ts.template': `import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (configService: ConfigService): TypeOrmModuleOptions => ({
  type: configService.get<string>('database.type') as any,
  host: configService.get<string>('database.host'),
  port: configService.get<number>('database.port'),
  username: configService.get<string>('database.username'),
  password: configService.get<string>('database.password'),
  database: configService.get<string>('database.database'),
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: configService.get<boolean>('database.synchronize'),
  logging: configService.get<string>('nodeEnv') === 'development',
});
`,

  // Common utilities
  'src/common/filters/http-exception.filter.ts.template': `import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const error =
      typeof exceptionResponse === 'string'
        ? { message: exceptionResponse }
        : (exceptionResponse as object);

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...error,
    });
  }
}
`,

  'src/common/interceptors/logging.interceptor.ts.template': `import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const responseTime = Date.now() - now;
        this.logger.log(\`\${method} \${url} - \${responseTime}ms\`);
      }),
    );
  }
}
`,

  'src/common/interceptors/transform.interceptor.ts.template': `import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  data: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(map((data) => ({ data })));
  }
}
`,

  'src/common/guards/jwt-auth.guard.ts.template': `import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }
}
`,

  'src/common/decorators/public.decorator.ts.template': `import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
`,

  'src/common/dto/pagination.dto.ts.template': `import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
{{#if includeSwagger}}
import { ApiPropertyOptional } from '@nestjs/swagger';
{{/if}}

export class PaginationDto {
  {{#if includeSwagger}}
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  {{/if}}
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  {{#if includeSwagger}}
  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 10 })
  {{/if}}
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
`,

  // Health module
  'src/health/health.module.ts.template': `import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

@Module({
  controllers: [HealthController],
})
export class HealthModule {}
`,

  'src/health/health.controller.ts.template': `import { Controller, Get } from '@nestjs/common';
{{#if includeSwagger}}
import { ApiTags, ApiOperation } from '@nestjs/swagger';
{{/if}}

{{#if includeSwagger}}
@ApiTags('health')
{{/if}}
@Controller('health')
export class HealthController {
  {{#if includeSwagger}}
  @ApiOperation({ summary: 'Health check endpoint' })
  {{/if}}
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
`,

  // Database module
  'src/database/database.module.ts.template': `import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getDatabaseConfig } from '../config/database.config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getDatabaseConfig,
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
`,

};

// Function to write all templates
async function generateTemplates() {
  console.log('Generating remaining NestJS templates...\n');
  
  let count = 0;
  for (const [filePath, content] of Object.entries(templates)) {
    const fullPath = path.join(templatesDir, filePath);
    await fs.ensureDir(path.dirname(fullPath));
    await fs.writeFile(fullPath, content, 'utf-8');
    console.log(`✓ Created: ${filePath}`);
    count++;
  }
  
  console.log(`\n✨ Successfully generated ${count} more template files!\n`);
}

generateTemplates().catch(console.error);
