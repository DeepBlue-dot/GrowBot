FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm globally
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Copy monorepo configuration files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/database ./packages/database
COPY apps/api ./apps/api

# Install dependencies and build API target
RUN pnpm install --frozen-lockfile
RUN pnpm db:generate
RUN pnpm --filter api build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/packages/database ./packages/database

EXPOSE 3000

CMD ["node", "apps/api/dist/main"]
