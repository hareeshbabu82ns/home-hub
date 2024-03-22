### init project

```sh
npx create-next-app@latest home-hub --typescript --tailwind --eslint

git config --local commit.gpgsign false
git config --local user.email hareeshbabu82ns@gmail.com
```

```sh
npm i prisma -D

npm i next-auth @auth/core @prisma/client @auth/prisma-adapter
# npm i clsx next-themes tailwind-merge tailwindcss-animate lucide-react
npm i @t3-oss/env-nextjs dotenv
npm i zod react-hook-form resend
```

```sh
npx tailwindcss int -p # optional, if not done with nextjs install

npx shadcn-ui@latest init

npx shadcn-ui@latest add button dropdown-menu

```

- Add Environment Variables to your `.env` can use `.env.sample` for ref
- google auth https://console.cloud.google.com/apis/credentials
- github auth https://github.com/settings/apps

- optional, if running local db

```sh
docker compose up -d
```

```sh
npm run db:gen # generates prisma client
npm run db:migrate # not valid for mongodb
npm run db:studio # opens db explorer

npm run dev
```
