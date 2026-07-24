import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Request, Response } from 'express';
import { AppModule } from '../apps/api/src/app.module.js';

const server = express();
let bootstrapPromise: Promise<void> | null = null;

async function bootstrap() {
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

export default async function handler(req: Request, res: Response) {
  try {
    if (!bootstrapPromise) {
      bootstrapPromise = bootstrap();
    }
    await bootstrapPromise;
    return server(req, res);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.stack || err.message : String(err);
    console.error('Vercel NestJS Bootstrap Error:', msg);
    (res as any).status(500).json({
      error: 'Vercel Serverless Function Bootstrap Failed',
      details: msg,
    });
  }
}
