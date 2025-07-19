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

npx shadcn@latest init

npx shadcn@latest add button dropdown-menu

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

### coder home path

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
