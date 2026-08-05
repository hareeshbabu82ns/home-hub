# Home Hub Devcontainer Documentation

This devcontainer provides a fully configured isolated development environment for the Home Hub Next.js application.

## ✨ Features

- **Node.js 22 LTS**: Latest stable TypeScript runtime with full native module support
- **Build Tools**: Complete build-essential suite for compiling native modules (Prisma, bcryptjs, sharp)
- **Package Management**: corepack + pnpm for deterministic dependency management
- **VS Code Integration**: Pre-configured extensions for development, debugging, and code quality
- **Port Forwarding**: 
  - 3000: Next.js development server
  - 3001: Alternative Next.js port
  - 5555: Prisma Studio
- **File Sharing**: Mount to `/downloads` for host↔container file exchange
- **Git Configuration**: Pre-configured for commits and version control inside container
- **Development Tools**: Python 3.11, GitHub CLI, and comprehensive linting/formatting

## 🚀 Quick Start

### 1. Prerequisites
- Docker and Docker Compose installed
- VS Code with "Dev Containers" extension

### 2. Open in Container
- Open the project in VS Code
- Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
- Select **"Dev Containers: Reopen in Container"**
- Wait for the container to build and setup to complete

### 3. Start Developing
```bash
pnpm dev
```
The app will be available at `http://localhost:3000`

## 📋 Available Commands

### Development
```bash
pnpm dev              # Start Next.js development server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm preview          # Build and preview production
```

### Code Quality
```bash
pnpm lint             # Run ESLint checks
pnpm lint:fix         # Fix ESLint issues automatically
pnpm format           # Format code with Prettier
pnpm format:check     # Check formatting without changes
pnpm typecheck        # TypeScript type checking
pnpm code-quality     # Run all quality checks
pnpm code-quality:fix # Fix all code quality issues
```

### Database & ORM
```bash
pnpm db:gen           # Generate Prisma client
pnpm db:push          # Push schema changes to database
pnpm db:studio        # Open Prisma Studio (http://localhost:5555)
```

## 🔧 Configuration

### Environment Variables
The container sets `NODE_ENV=development` automatically. For additional environment variables:

1. Create/update `.env.local` in the project root:
```bash
# DATABASE_URL=your_database_url
# Other environment variables...
```

2. The environment file is loaded automatically by Next.js

### VS Code Extensions Installed
- **ESLint** - Linting
- **Prettier** - Code formatter
- **Tailwind CSS IntelliSense** - Utility class completion
- **Prisma** - ORM support with syntax highlighting
- **MongoDB** - Database management
- **Python** & **Pylance** - Python development
- **GitLens** - Advanced Git features
- **GitHub Copilot** - AI code assistance
- **REST Client** - API testing

### Git Configuration
Git is pre-configured for commits inside the container:
```bash
git config --global user.name
git config --global user.email
```

To customize, run inside the container:
```bash
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
```

## 📁 File Sharing

Files in your host's `~/Downloads` directory are accessible at `/downloads` inside the container:

```bash
# Copy from host downloads to project
cp /downloads/file.csv ./data/

# Process and save back
# File automatically appears in ~/Downloads on host
```

## 🗄️ Database Setup

### Connecting to MongoDB/Prisma

If using MongoDB locally:
1. Update `.env.local` with your connection string
2. Run `pnpm db:push` to sync schema
3. Use `pnpm db:studio` to explore data

## 🐛 Troubleshooting

### Container Won't Start
```bash
# Rebuild the container
# In VS Code: Dev Containers: Rebuild Container
```

### Dependencies Not Installing
```bash
# Clear pnpm cache and reinstall
pnpm store prune
pnpm install
```

### Native Module Compilation Errors
This should not happen as `build-essential` is installed. If it does:
```bash
# Rebuild native modules
pnpm install --no-frozen-lockfile
```

### Port Already in Use
If port 3000 is already in use, Next.js will automatically use 3001, or you can manually specify:
```bash
pnpm dev -- -p 3001
```

### Git Issues
If you get Git permission errors:
```bash
# Already configured, but run if needed:
git config --global --add safe.directory /workspaces/home-hub
```

## 📚 Lifecycle Events

The devcontainer runs scripts in this order:

1. **onCreateCommand** (`on-create.sh`)
   - Installs system packages and dependencies
   - Configures corepack and pnpm
   - Sets up Git configuration

2. **postCreateCommand** (`post-create.sh`)
   - Installs npm packages via pnpm
   - Generates Prisma client

3. **postStartCommand** (`post-start.sh`)
   - Displays helpful commands and information

## 🚀 Performance Tips

- Use `pnpm --frozen-lockfile` to avoid dependency resolution delays
- Leverage VS Code's "Format on Save" for automatic code cleanup
- Use Tailwind CSS IntelliSense for faster styling
- Keep `.next` and `node_modules` excluded from file watcher

## 📖 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Dev Containers Reference](https://containers.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
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
