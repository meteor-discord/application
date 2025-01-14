FROM oven/bun:1-alpine AS base
WORKDIR /app

FROM base AS dependencies
COPY package.json bun.lockb ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile --production

FROM base AS builder
COPY --from=dependencies /app/node_modules ./node_modules
COPY prisma ./prisma
COPY package.json tsconfig.json ./
RUN --mount=type=cache,target=/root/.bun \
    bunx prisma generate

FROM base AS release
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY /app/prisma ./prisma
COPY src ./src
COPY locales ./locales
COPY package.json tsconfig.json ./

USER bun
CMD ["sh", "-c", "bunx prisma db push --skip-generate && exec bun start"]
