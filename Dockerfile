FROM node:22-alpine AS build
WORKDIR /app
ENV NUXT_TELEMETRY_DISABLED=1
RUN npm install -g pnpm@10.32.0
COPY package.json pnpm-lock.yaml* .npmrc ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/.output ./.output
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
