FROM node:20-alpine

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN apk add --no-cache libc6-compat openssl

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
RUN npm run prisma:generate

COPY . .
RUN npm run build

ENV NODE_ENV=production

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/api/version" || exit 1

CMD ["npm", "run", "start:coolify"]
