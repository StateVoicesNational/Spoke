ARG BUILDER_IMAGE=node:8.10
ARG RUNTIME_IMAGE=node:8.10-alpine

FROM ${BUILDER_IMAGE} as builder

ENV NODE_ENV=production \
    OUTPUT_DIR=./build \
    ASSETS_DIR=./build/client/assets \
    ASSETS_MAP_FILE=assets.json

COPY . /spoke
WORKDIR /spoke
RUN yarn install --ignore-scripts && \
    yarn run prod-build && \
    rm -rf node_modules && \
    yarn install --production --ignore-scripts

# Spoke Runtime
FROM ${RUNTIME_IMAGE}
WORKDIR /spoke
COPY --from=builder /spoke/build build
COPY --from=builder /spoke/node_modules node_modules
COPY --from=builder /spoke/package.json /spoke/yarn.lock ./
ENV NODE_ENV=production \
    PORT=3000 \
    ASSETS_DIR=./build/client/assets \
    ASSETS_MAP_FILE=assets.json \
    JOBS_SAME_PROCESS=1

# Switch to non-root user https://github.com/nodejs/docker-node/blob/d4d52ac41b1f922242d3053665b00336a50a50b3/docs/BestPractices.md#non-root-user
USER node
EXPOSE 3000
CMD ["npm", "start"]
