# Home Hub Devcontainer Documentation

This devcontainer provides an isolated development environment for the Home Hub Next.js application.

## Features

- **Isolated Environment**: Node.js 20 with TypeScript support
- **Downloads Folder**: Mount to share files between host and container at `/downloads`
- **MongoDB Connection**: Configured to connect to MongoDB running on the host machine (port 27018)
- **Port Forwarding**: Ports 3000 and 3001 forwarded for Next.js app
- **VS Code Extensions**: Pre-configured with ESLint, Prettier, Tailwind CSS, and Prisma extensions

## Setup Instructions

### Prerequisites
- Docker and Docker Compose installed
- VS Code with "Remote - Containers" extension
- MongoDB running on host at port 27018

### Quick Start

1. **Open in devcontainer**:
   - Open the project in VS Code
   - Press `Cmd + Shift + P` and select "Remote-Containers: Reopen in Container"
   - Wait for the container to build and dependencies to install

2. **Start development server**:
   ```bash
   pnpm dev
   ```
   The app will be available at `http://localhost:3000`

3. **Access downloads folder**:
   Files in your host's `~/Downloads` folder are accessible at `/downloads` inside the container

4. **Connect to MongoDB**:
   The `DATABASE_URL` is automatically set to `mongodb://host.docker.internal:27018/home-hub`

## Available Commands

Inside the container, you can run:

```bash
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm db:migrate       # Run Prisma migrations
pnpm db:gen           # Generate Prisma client
pnpm db:studio        # Open Prisma Studio
pnpm lint             # Run ESLint
pnpm format           # Format code with Prettier
pnpm typecheck        # Check TypeScript errors
```

## Configuration

### Mount Points
- **Downloads**: `~/Downloads` (host) → `/downloads` (container)

### Environment Variables
- `DATABASE_URL`: `mongodb://host.docker.internal:27018/home-hub`

### Resource Requirements
- CPU: 2+ cores
- Memory: 4GB+

## Troubleshooting

### MongoDB Connection Issues
- Verify MongoDB is running on the host at port 27018
- Check that `host.docker.internal` is accessible (Docker Desktop on Mac/Windows)
- On Linux, use your machine's IP address instead

### Port Already in Use
If port 3000 is in use, the dev server will automatically use port 3001

### Rebuild Container
To rebuild the devcontainer:
```bash
Cmd + Shift + P → "Remote-Containers: Rebuild Container"
```

## File Structure

```
.devcontainer/
├── devcontainer.json  # Main devcontainer configuration
├── Dockerfile         # Docker image definition
└── post-create.sh     # Post-creation setup script
```
