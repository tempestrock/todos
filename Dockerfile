# Use the latest Node.js LTS version
FROM node:20.9.0-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy over the `pnpm` lock file and install `pnpm`
COPY pnpm-lock.yaml ./
RUN npm install -g pnpm

# Copy the application code
COPY . .

# Install dependencies using pnpm
RUN pnpm install

# Build the Remix app
RUN pnpm build

# Expose port 8081
EXPOSE 8081

# Set the environment variable to specify the port Remix should run on
ENV PORT=8081

# Start the Remix application
CMD ["pnpm", "start"]
