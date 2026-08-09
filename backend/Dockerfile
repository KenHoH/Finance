FROM node:20

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Generate Prisma client after schema is available
RUN DATABASE_URL="postgresql://localhost:5432/postgres" npx prisma generate

# Build the application
RUN npx nest build

# Run the application
CMD ["node", "dist/src/main.js"]