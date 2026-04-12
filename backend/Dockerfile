# backend/Dockerfile
FROM node:18-alpine

# Upgrade OS packages to pull in security patches (fixes CVE-2025-15467 in libcrypto3/libssl3)
RUN apk upgrade --no-cache

WORKDIR /app

COPY package.json package-lock*.json* ./
RUN npm install --production

COPY . .

ENV PORT=5000
EXPOSE 5000

CMD ["node", "server.js"]