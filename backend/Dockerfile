FROM node:20

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

COPY prisma ./prisma/

# Install dependencies
RUN npm install

RUN npx prisma generate

# Copy the rest of the application code
COPY . .

# Build the application
RUN npx nest build

# Run the application
CMD ["node", "dist/src/main.js"]
