FROM node:24-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

RUN DATABASE_URL="postgresql://dummy:5432/db" npx prisma generate

RUN npx nest build

CMD ["node", "dist/src/main.js"]
# CMD ["sleep", "infinity"]
