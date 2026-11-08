FROM node:20-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY tsconfig.json tsconfig.build.json vitest.config.ts ./
COPY src ./src
COPY config ./config
COPY fixtures ./fixtures
RUN npm run build

FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup -S catalogue && adduser -S catalogue -G catalogue
COPY package.json ./
RUN npm install --omit=dev && npm cache clean --force
COPY --from=build --chown=catalogue:catalogue /app/dist ./dist
COPY --from=build --chown=catalogue:catalogue /app/config ./config
COPY --from=build --chown=catalogue:catalogue /app/fixtures ./fixtures
USER catalogue
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 CMD node -e "fetch('http://127.0.0.1:4000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/server.js"]
