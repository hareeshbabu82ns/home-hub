# HomeHub

A modern Progressive Web App (PWA) for smart home management, built with Next.js, React, and TypeScript.

![HomeHub Logo](public/logo.svg)

## Features

### 🏠 Smart Home Management
- Control all your smart devices from one dashboard
- Set up automation rules and workflows
- Monitor energy usage and security systems

### 📱 Progressive Web App
- **Installable**: Add to home screen on any device
- **Offline Support**: Works without internet connection
- **Native Experience**: App-like feel on mobile and desktop
- **Fast Loading**: Optimized performance with service workers

### 🎯 Core Functionality
- Time tracking and productivity tools
- Expense management and budgeting
- Family profile management
- Security and privacy focused

## Installation

### As a Web App
1. Visit the app in your browser
2. Look for the "Install App" button or browser's install prompt
3. Click install to add HomeHub to your home screen

### Development Setup

#### Prerequisites

#### Prerequisites

```sh
# Clone the repository
git clone <your-repo-url>
cd home-hub

# Install dependencies
pnpm install
```

#### Initial Project Setup (Reference)

```sh
npx create-next-app@latest home-hub --typescript --tailwind --eslint

git config --local commit.gpgsign false
git config --local user.email hareeshbabu82ns@gmail.com
```

#### Dependencies

```sh
# Core dependencies
pnpm add next-auth @auth/core @prisma/client @auth/prisma-adapter
pnpm add @t3-oss/env-nextjs dotenv zod react-hook-form resend

# PWA dependencies
pnpm add next-pwa workbox-webpack-plugin

# UI components
npx shadcn@latest init
npx shadcn@latest add button dropdown-menu
```

#### Environment Setup

#### Environment Setup

- Add Environment Variables to your `.env` (use `.env.sample` for reference)
- Google Auth: https://console.cloud.google.com/apis/credentials
- GitHub Auth: https://github.com/settings/apps

#### Database Setup

Optional, if running local database:

```sh
docker compose up -d
```

#### Development Commands

```sh
# Generate Prisma client
pnpm run db:gen

# Run database migrations
pnpm run db:migrate

# Open database explorer
pnpm run db:studio

# Start development server
pnpm run dev
```

#### Production Build

```sh
# Build for production (includes PWA features)
pnpm run build

# Start production server
pnpm run start
```

## PWA Features

### Service Worker
The app automatically generates a service worker that:
- Caches static assets for offline use
- Implements network-first strategy for dynamic content
- Provides background sync capabilities

### Manifest
The web app manifest (`/public/manifest.json`) enables:
- Custom app icon and branding
- Standalone display mode
- Theme color customization
- Installation shortcuts

### Installation
Users can install HomeHub as a native app by:
1. Using the browser's install prompt
2. Clicking the "Install App" button in the UI
3. Adding to home screen on mobile devices

## Browser Support

HomeHub PWA works on:
- ✅ Chrome (Desktop & Mobile)
- ✅ Firefox (Desktop & Mobile)
- ✅ Safari (Desktop & Mobile)
- ✅ Edge (Desktop & Mobile)

## File Structure

```
public/
├── logo.svg              # Main app logo
├── icon-192.svg          # PWA icon (192x192)
├── icon-512.svg          # PWA icon (512x512)
├── manifest.json         # Web app manifest
└── browserconfig.xml     # Windows tile configuration

src/
├── app/
│   ├── layout.tsx        # Root layout with PWA meta tags
│   └── page.tsx          # Home page with install button
├── components/
│   └── install-pwa-button.tsx  # PWA install component
└── hooks/
    └── use-install-pwa.ts       # PWA installation hook
```

## Development Notes

## Development Notes

- PWA features are disabled in development mode for faster iteration
- Service worker and offline capabilities are only active in production builds
- Use `pnpm run build && pnpm run start` to test PWA features locally

## Deployment

## Deployment

The app can be deployed to any hosting platform that supports Next.js:
- Vercel (recommended)
- Netlify
- Docker containers
- Static hosting with `output: 'export'`

### Docker Deployment

```sh
# Build the image
docker build -t homehub .

# Run the container
docker run -p 3000:3000 homehub
```

### Environment Variables

Make sure to set the following environment variables in production:
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- Database connection string
- OAuth provider credentials

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test PWA functionality in production build
5. Submit a pull request

## License

This project is licensed under the MIT License.

---

## Legacy Setup Notes (Coder Environment)

```sh
docker ps
# instance id for 'coder-hareesh-ws-test' is coder-8a3d37ef-75df-49f0-9ce6-9a451ac1ab42
docker inspect coder-hareesh-ws-test

# go to mount folder
cd /var/lib/docker/volumes/coder-8a3d37ef-75df-49f0-9ce6-9a451ac1ab42-home/_data/dev/home-hub/data
mkdir mnt_books

mount -t cifs //192.168.86.10/books /var/lib/docker/volumes/coder-8a3d37ef-75df-49f0-9ce6-9a451ac1ab42-home/_data/dev/home-hub/data/mnt_books -o username=hareesh,password=<XXX>,rw,vers=2.1

mount -t cifs //192.168.86.10/books/Edu/Telugu/project-chalam-telugu-books-collection /var/lib/docker/volumes/coder-8a3d37ef-75df-49f0-9ce6-9a451ac1ab42-home/_data/dev/home-hub/data/mnt_books -o username=hareesh,password=<XXX>,rw,vers=2.1

umount /var/lib/docker/volumes/coder-8a3d37ef-75df-49f0-9ce6-9a451ac1ab42-home/_data/dev/home-hub/data/mnt_books
```
