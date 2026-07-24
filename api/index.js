/* eslint-disable @typescript-eslint/no-require-imports */
let serverInstance = null;

async function bootstrap() {
  require('reflect-metadata');

  const { NestFactory } = require('@nestjs/core');
  const { ValidationPipe } = require('@nestjs/common');
  const { AppModule } = require('../apps/api/dist/app.module');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  app.enableCors({ origin: '*', credentials: true });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  await app.init();
  return app.getHttpAdapter().getInstance();
}

module.exports = async function handler(req, res) {
  try {
    if (!serverInstance) {
      serverInstance = await bootstrap();
    }
    return serverInstance(req, res);
  } catch (err) {
    console.error('Vercel NestJS Bootstrap Error:', err);
    serverInstance = null;
    res.status(500).json({
      error: 'Vercel Serverless Function Bootstrap Failed',
      details: err ? err.message || String(err) : 'Unknown error',
      stack: err ? err.stack : null,
    });
  }
};
