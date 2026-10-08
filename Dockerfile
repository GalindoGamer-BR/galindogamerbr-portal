FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ENV WRANGLER_SEND_METRICS=false
EXPOSE 5173
CMD ["sh", "-c", "npm run db:migrate:local && npm run build && npx concurrently -k 'vite --host 0.0.0.0' 'wrangler pages dev dist --ip 0.0.0.0 --port 8788'"]
