### init project

```sh
npx create-next-app@latest home-hub

git config --local commit.gpgsign false
git config --local user.email hareeshbabu82ns@gmail.com
```

```sh
npm i prisma -D

npm i next-auth @auth/core @prisma/client @auth/prisma-adapter
npm i @mui/base clsx next-themes tailwind-merge tailwindcss-animate
npm i zod react-hook-form resend
```

```sh
npx tailwindcss int -p
npx shadcn-ui@latest init

npx shadcn-ui@latest add button dropdown-menu

```

- Add Environment Variables to your `.env.local`
- google auth https://console.cloud.google.com/apis/credentials
- github auth https://github.com/settings/apps

- optional, if running local db

```sh
docker compose up -d
```

```sh
npm run db:gen

npm run dev
```
