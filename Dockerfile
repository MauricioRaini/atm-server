# Use an official Node.js runtime as a parent image.
FROM node:18-alpine

# Install build dependencies for native modules (e.g. bcrypt)
RUN apk add --no-cache make gcc g++ python3

# Set the working directory.
WORKDIR /app

# Copy package files.
COPY package*.json ./

# Install production dependencies.
# The postinstall script will rebuild bcrypt.
RUN npm install --production

# (Optional) Force a rebuild of bcrypt.
RUN npm rebuild bcrypt --build-from-source

# Copy the rest of your source code.
COPY . .

# Build the project (assuming you use TypeScript).
RUN npm run build

# Copy the entrypoint script and set permissions.
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Expose the port your app uses.
EXPOSE 3000

# Set the entrypoint to run migrations, seed the database, then start the server.
ENTRYPOINT ["/app/docker-entrypoint.sh"]

# Command to run your app.
CMD ["node", "dist/server.js"]
