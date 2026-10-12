FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY src ./src
COPY scripts/build.mjs ./scripts/build.mjs
COPY worker ./worker
COPY data ./data
COPY reports ./reports
RUN npm run build

FROM node:22-bookworm-slim
WORKDIR /app
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node scripts/server.mjs ./scripts/server.mjs
USER node
ENV NODE_ENV=production PORT=7860 HOST=0.0.0.0
EXPOSE 7860
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD node -e "fetch('http://127.0.0.1:7860/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "scripts/server.mjs"]
