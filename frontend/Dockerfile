FROM node:20

WORKDIR /usr/src/frontend/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Run the application (This starts the Next.js production server)
CMD ["npm", "run", "start"]