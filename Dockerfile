FROM node:20.19.0-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Set working directory to root
WORKDIR /

# Copy and build React client
COPY support-tool-react-client ./support-tool-react-client
WORKDIR /support-tool-react-client
RUN npm ci && npm run build

# Verify React build
RUN echo "=== React build verification ===" && \
    ls -la build/ && \
    echo "index.html size: $(stat -c%s build/index.html) bytes"

# Copy and setup server
COPY support-tool-server /support-tool-server
WORKDIR /support-tool-server
RUN npm ci

# Create logs directory in the SERVER directory where the app expects it
RUN mkdir -p /support-tool-server/logs && \
    chmod 777 /support-tool-server/logs && \
    mkdir -p /support-tool-server/logs/$(date +%Y-%m-%d) && \
    chmod 777 /support-tool-server/logs/$(date +%Y-%m-%d) && \
    echo "Created log directories in server folder with full permissions"

# Set proper ownership and permissions
RUN chown -R root:root /support-tool-server && \
    chmod -R 755 /support-tool-server && \
    chmod -R 777 /support-tool-server/logs

# Final verification
RUN echo "=== Final structure verification ===" && \
    echo "React build:" && ls -la /support-tool-react-client/build/index.html && \
    echo "Server:" && ls -la /support-tool-server/package.json && \
    echo "Server logs dir:" && ls -ld /support-tool-server/logs && \
    echo "Logs contents:" && ls -la /support-tool-server/logs/

# Set working directory to server
WORKDIR /support-tool-server

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "http.get('http://localhost:5000/health', (res) => { \
    if (res.statusCode === 200) process.exit(0); \
    else process.exit(1); \
  }).on('error', () => process.exit(1));"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the server
CMD ["npm", "run", "dev"]
