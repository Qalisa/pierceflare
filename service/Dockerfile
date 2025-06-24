ARG K8S_APP__VERSION="[unknown-from-docker]"
ARG CANONICAL_URL="[define-me-pls]"

#
FROM node:slim AS prerelease
ARG K8S_APP__VERSION
ARG CANONICAL_URL

ENV K8S_APP__VERSION=$K8S_APP__VERSION \
    CANONICAL_URL=$CANONICAL_URL

#
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

#
WORKDIR /usr/src/app
COPY ./package.json ./

# required to prevent symlinking of @libsql for Docker image dependency copying
RUN echo "node-linker=hoisted" >  .npmrc

RUN pnpm install

#
COPY . .
ENV NODE_ENV=production
RUN pnpm run build

##
##
##

# Copy production dependencies and source code into final image
# @note alpine variants requires musl compatible binaries (https://hub.docker.com/_/node/)
FROM node:23-alpine AS lean

WORKDIR /usr/src/app
COPY --from=prerelease /usr/src/app/package.json .
COPY --from=prerelease /usr/src/app/dist ./dist
COPY --from=prerelease /usr/src/app/drizzle ./drizzle

# required binaries
COPY --from=prerelease /usr/src/app/node_modules/@libsql* ./node_modules/@libsql/


# ENV SERVICE_AUTH_USERNAME=""
# ENV SERVICE_AUTH_PASSWORD=""
ENV SERVICE_DATABASE_FILES_PATH=/usr/src/app/db

ENV NODE_ENV=production \
    PORT=80

ENTRYPOINT ["node"]
CMD ["dist/server/index.standalone.mjs"]