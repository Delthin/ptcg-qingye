# Build context: public repository root, after preparing permitted source assets.
FROM node:22-bookworm-slim AS build
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY ptcg-server/package*.json ptcg-server/
RUN cd ptcg-server && npm ci
COPY ptcg-server/ ptcg-server/
COPY ptcg-play-react/ ptcg-play-react/
COPY ptcg-play/src/assets/i18n/ ptcg-play/src/assets/i18n/
COPY deploy/ deploy/
COPY public-data/ public-data/
# Same-origin production frontend; no private URLs or secrets baked into Vite.
RUN node deploy/check-assets.cjs \
    && cd ptcg-server && mkdir -p avatars/duo sleeves scans/duo \
    && cp ../public-data/catalog.json scans/duo/catalog.json && npm run compile \
    && cd ../ptcg-play-react && npm ci && env -u VITE_API_URL npm run build
RUN cd ptcg-server && npm prune --omit=dev

# Use the same LTS major for native dependencies in both stages.
# Validate the complete image in the target hosting environment.
FROM node:22-bookworm-slim AS runtime
WORKDIR /app
COPY --from=build --chown=node:node /app/ptcg-server/output ptcg-server/output
COPY --from=build --chown=node:node /app/ptcg-server/node_modules ptcg-server/node_modules
COPY --from=build --chown=node:node /app/ptcg-server/package*.json ptcg-server/
COPY --from=build --chown=node:node /app/ptcg-server/config.js /app/ptcg-server/start.js ptcg-server/
COPY --from=build --chown=node:node /app/ptcg-play-react/dist ptcg-play-react/dist
COPY --from=build --chown=node:node /app/public-data/catalog.json ptcg-server/scans/duo/catalog.json
COPY --from=build --chown=node:node /app/deploy/start.sh deploy/start.sh
RUN mkdir -p /data /app/ptcg-server/avatars/duo /app/ptcg-server/sleeves /app/ptcg-server/scans \
    && chown -R node:node /data /app
USER node
ENV NODE_ENV=production PTCG_BIND=0.0.0.0 PTCG_PORT=8080 STORAGE_TYPE=sqlite STORAGE_DATABASE=/data/database.sq3
EXPOSE 8080
CMD ["bash", "deploy/start.sh"]
