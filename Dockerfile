# Multi-stage build for the garage (docs/adr/0002): install and build with
# pnpm, then ship only Next's standalone output on a plain Node image.
# Node version follows .nvmrc, pnpm version follows package.json#packageManager.

FROM node:22-alpine AS base
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable pnpm
WORKDIR /app

FROM base AS deps
# pnpm-workspace.yaml#patchedDependencies points into patches/, so the install
# needs the patch files next to the lockfile.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY patches ./patches
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# next/font fetches Google Fonts at build time, so the build needs network.
RUN pnpm build

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
WORKDIR /app
RUN addgroup -S garage && adduser -S -G garage garage
# The Strava token and activity cache (docs/adr/0002); compose mounts a named
# volume here, which takes the ownership of the image directory on first use.
RUN mkdir /data && chown garage:garage /data
ENV DATA_DIR=/data
COPY --from=build --chown=garage:garage /app/.next/standalone ./
COPY --from=build --chown=garage:garage /app/.next/static ./.next/static
COPY --from=build --chown=garage:garage /app/public ./public
USER garage
EXPOSE 3000
CMD ["node", "server.js"]
