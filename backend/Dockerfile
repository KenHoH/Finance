FROM node:20

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate

RUN npx nest build

RUN rm -rf dist/generated && cp -r generated dist/generated

RUN cp dist/generated/prisma/index.js dist/generated/prisma/client.js

CMD ["node", "dist/src/main.js"]
