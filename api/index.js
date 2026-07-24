/* eslint-disable @typescript-eslint/no-require-imports */
const express = require('express');

const server = express();
let bootstrapPromise = null;

async function bootstrap() {
  // Import reflect-metadata before anything NestJS
  require('reflect-metadata');

  const { NestFactory } = require('@nestjs/core');
  const { ValidationPipe } = require('@nestjs/common');
  const { ExpressAdapter } = require('@nestjs/platform-express');

  // Import the pre-compiled NestJS AppModule from nest build output
  const { AppModule } = require('../apps/api/dist/app.module');

  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
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
}

module.exports = async function handler(req, res) {
  try {
    if (!bootstrapPromise) {
      bootstrapPromise = bootstrap();
    }
    await bootstrapPromise;
    return server(req, res);
  } catch (err) {
    console.error('Vercel NestJS Bootstrap Error:', err);
    bootstrapPromise = null; // Reset so next invocation retries
    res.status(500).json({
      error: 'Vercel Serverless Function Bootstrap Failed',
      details: err.message || String(err),
      stack: err.stack,
    });
  }
};
