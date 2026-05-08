FROM node:20-bullseye-slim AS build

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json yarn.lock ./

RUN corepack enable && yarn install --frozen-lockfile

COPY nest-cli.json tsconfig.json tsconfig.build.json ./
COPY src ./src

RUN yarn build
RUN yarn install --production --frozen-lockfile --ignore-scripts


FROM node:20-bullseye-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3100

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./package.json
COPY entrypoint.sh ./entrypoint.sh

RUN chmod +x entrypoint.sh

EXPOSE 3100

ENTRYPOINT ["./entrypoint.sh"]