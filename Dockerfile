FROM node:22-slim

WORKDIR /app
COPY . .

RUN npm install -g corepack@latest \
  && corepack pnpm install \
  && corepack pnpm run build \
  && mkdir -p .next/standalone/.next \
  && cp -r .next/static .next/standalone/.next/static \
  && if [ -d public ]; then cp -r public .next/standalone/public; fi

ENV NODE_ENV=production
CMD ["node", ".next/standalone/server.js"]
