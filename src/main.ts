import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ResponseInterceptor } from './modules/common/interceptors/response.interceptor.interceptor';
import { AllExceptionsFilter } from './modules/common/filters/all-exceptions.filter';
import * as dotenv from 'dotenv';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
dotenv.config();

const tenantHeaderParameters = [
  {
    name: 'x-tenant',
    in: 'header',
    required: false,
    schema: { type: 'string' },
    description: 'Tenant por frontendDomain. Ejemplo: barber',
  },
  {
    name: 'x-tenant-id',
    in: 'header',
    required: false,
    schema: { type: 'string', format: 'uuid' },
    description: 'Tenant por id de empresa',
  },
  {
    name: 'x-tenant-domain',
    in: 'header',
    required: false,
    schema: { type: 'string' },
    description: 'Tenant por dominio frontal',
  },
];

const reservedApiSegments = new Set([
  'auth',
  'session',
  'company',
  'user',
  'client',
  'services',
  'appointments',
  'liquidations',
  'dashboard',
  'media',
  'docs',
]);

function enhanceSwaggerWithTenantSupport(document: any) {
  document.servers = [
    { url: '/api', description: 'Base sin tenant en path' },
    {
      url: '/api/{tenant}',
      description: 'Tenant en path: /api/barber/...',
      variables: {
        tenant: {
          default: 'barber',
        },
      },
    },
    {
      url: '/{tenant}/api',
      description: 'Tenant en path: /barber/api/...',
      variables: {
        tenant: {
          default: 'barber',
        },
      },
    },
  ];

  for (const pathItem of Object.values(document.paths ?? {})) {
    for (const operation of Object.values(pathItem as Record<string, any>)) {
      if (!operation || typeof operation !== 'object') continue;

      const existing = new Set(
        (operation.parameters ?? [])
          .filter((parameter: any) => parameter?.in === 'header')
          .map((parameter: any) => parameter.name),
      );

      operation.parameters = [
        ...(operation.parameters ?? []),
        ...tenantHeaderParameters.filter((parameter) => !existing.has(parameter.name)),
      ];
    }
  }
}

async function bootstrap() {

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const uploadsPath = join(process.cwd(), 'uploads');

  if (!existsSync(uploadsPath)) {
    mkdirSync(uploadsPath, { recursive: true });
  }

  console.log('DB_PASSWORD:', process.env.DB_PASSWORD, typeof process.env.DB_PASSWORD);
  console.log('__dirname:', __dirname);

  app.use((req: any, _res: any, next: () => void) => {
    const rawUrl = req.url || '';
    const [pathOnly, query] = rawUrl.split('?');
    const segments = pathOnly.split('/').filter(Boolean);

    let tenantFromPath: string | null = null;
    let rewrittenSegments: string[] | null = null;

    if (segments.length > 2 && segments[0] === 'api' && !reservedApiSegments.has(segments[1])) {
      tenantFromPath = segments[1];
      rewrittenSegments = ['api', ...segments.slice(2)];
    } else if (segments.length > 2 && segments[1] === 'api' && !reservedApiSegments.has(segments[0])) {
      tenantFromPath = segments[0];
      rewrittenSegments = ['api', ...segments.slice(2)];
    }

    if (tenantFromPath && rewrittenSegments) {
      if (!req.headers['x-tenant'] && !req.headers['x-tenant-id'] && !req.headers['x-tenant-domain']) {
        req.headers['x-tenant'] = tenantFromPath;
      }

      const normalizedPath = '/' + rewrittenSegments.join('/');
      req.url = query ? `${normalizedPath}?${query}` : normalizedPath;
    }

    next();
  });

  app.setGlobalPrefix('api');
  app.useStaticAssets(uploadsPath, { prefix: '/uploads/' });

  console.log(process.env.FRONTEND_URL);
  app.enableCors({
    origin: process.env.FRONTEND_URL,
    allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-tenant',
    'x-tenant-id',
    'x-tenant-domain',
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });


  app.useGlobalFilters(new AllExceptionsFilter());

  app.useGlobalInterceptors(new ResponseInterceptor());

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  const config = new DocumentBuilder()
    .setTitle('APlicacion uñas')
    .setDescription('Documentación')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Ingrese el token JWT',
      },
      'jwt'
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  enhanceSwaggerWithTenantSupport(document);
  SwaggerModule.setup('docs', app, document);


  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
