FROM node:20-slim

ENV NODE_ENV=production
WORKDIR /app

# Install dependencies first so Docker can cache this layer.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy the rest of the source.
COPY . .

# Discord bots are long-running workers with no HTTP port.
CMD ["node", "src/index.js"]
