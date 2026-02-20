# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

FROM node:23-alpine
RUN mkdir -p /home/node/dist

WORKDIR /home/node
COPY --chown=root:root --chmod=755 ./api/dist ./dist

USER node

EXPOSE 3000
ENV HOST=0.0.0.0

CMD [ "node", "--enable-source-maps", "dist/server.mjs" ]