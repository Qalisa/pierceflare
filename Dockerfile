ARG K8S_APP__VERSION="[unknown-from-docker]"
ARG BUDIVY_API_BULK_BUD_CSV__URL="https://raw.githubusercontent.com/Qalisa/buds/main/list.csv"
ARG BUDIVY_API_WELL_KNOWN_ACCOUNTS__URL="https://raw.githubusercontent.com/Qalisa/ivy-well-known-accounts/refs/heads/main/well-known.json"
ARG BUDIVY_API_WELL_KNOWN_ACCOUNTS__PATH="/foundation/api/well-known.json"
ARG BUDIVY_API_LOCAL_BLOBS__DIR_PATH="/foundation/ivy_blobs"
ARG GOOGLE_APPLICATION_CREDENTIALS="/foundation/auth/google-service-account.json"

# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
FROM oven/bun:1 AS base
WORKDIR /usr/src/app

# install dependencies into temp directory
# this will cache them and speed up future builds
FROM base AS install
RUN mkdir -p /temp/dev
COPY api/package.json api/bun.lock /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# install with --production (exclude devDependencies)
RUN mkdir -p /temp/prod
COPY api/package.json api/bun.lock /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# copy node_modules from temp directory
# then copy all (non-ignored) project files into the image
FROM base AS prerelease
ARG K8S_APP__VERSION
ARG BUDIVY_API_BULK_BUD_CSV__URL
ARG BUDIVY_API_WELL_KNOWN_ACCOUNTS__PATH
ARG BUDIVY_API_LOCAL_BLOBS__DIR_PATH
ARG GOOGLE_APPLICATION_CREDENTIALS

ENV K8S_APP__VERSION=$K8S_APP__VERSION \
    BUDIVY_API_WELL_KNOWN_ACCOUNTS__PATH=$BUDIVY_API_WELL_KNOWN_ACCOUNTS__PATH \
    BUDIVY_API_BULK_BUD_CSV__URL=$BUDIVY_API_BULK_BUD_CSV__URL \
    BUDIVY_API_LOCAL_BLOBS__DIR_PATH=$BUDIVY_API_LOCAL_BLOBS__DIR_PATH \
    GOOGLE_APPLICATION_CREDENTIALS=$GOOGLE_APPLICATION_CREDENTIALS

COPY --from=install /temp/dev/node_modules node_modules
COPY api/. .

# [optional] tests & build
ENV NODE_ENV=production
RUN bun run build

# copy production dependencies and source code into final image
FROM oven/bun:1-alpine AS lean
ARG BUDIVY_API_WELL_KNOWN_ACCOUNTS__URL
ARG BUDIVY_API_WELL_KNOWN_ACCOUNTS__PATH

WORKDIR /usr/src/app

COPY --from=prerelease /usr/src/app/dist .
COPY --from=prerelease /usr/src/app/package.json .

# run the app
ADD $BUDIVY_API_WELL_KNOWN_ACCOUNTS__URL $BUDIVY_API_WELL_KNOWN_ACCOUNTS__PATH

EXPOSE 3000/tcp
# TODO: hard-specifying env file should not be necessary !
ENTRYPOINT ["bun", "run", "--env-file=.env.production"]
CMD ["."]