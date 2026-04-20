FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production || npm install

COPY src/ src/
COPY tests/ tests/

CMD ["npm", "test"]
