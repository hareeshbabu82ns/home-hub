# Node.js with TypeScript devcontainer
FROM mcr.microsoft.com/devcontainers/typescript-node:20-bullseye

# Install global tools
RUN npm install -g pnpm@latest

# Install Python and uv
RUN apt-get update && apt-get install -y python3 python3-pip && rm -rf /var/lib/apt/lists/*
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
RUN echo 'export PATH="$HOME/.cargo/bin:$PATH"' >> /etc/profile

# Create directories
RUN mkdir -p /downloads && chmod 777 /downloads
RUN mkdir -p /workspaces/home-hub

# Set working directory
WORKDIR /workspaces/home-hub

# Expose ports
EXPOSE 3000 3001

# Keep container running
CMD ["sleep", "infinity"]
