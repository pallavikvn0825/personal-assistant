# Deploy Focus to Railway (Mobile Access)

## Part 1 — Push to GitHub

Run these commands in your project folder:

```bash
cd /Users/pkanigel/Desktop/personalapp

git init
git add .
git commit -m "Add Focus productivity assistant app"

git remote add origin https://github.com/pallavikvn0825/personal-assistant.git
git branch -M main
git pull origin main --allow-unrelated-histories --no-edit
git push -u origin main
```

If `git pull` asks for login, use a GitHub Personal Access Token as your password.

---

## Part 2 — Deploy on Railway

1. Go to **[railway.app](https://railway.app)** → Sign in with GitHub
2. Click **New Project** → **Deploy from GitHub repo**
3. Select **`pallavikvn0825/personal-assistant`**
4. Click **+ New** → **Database** → **PostgreSQL**
5. Click your **app service** (not the database) → **Variables** tab:
   - Add: `DATABASE_URL` = click **Reference** → select PostgreSQL → `DATABASE_URL`
   - Add: `DEFAULT_USER_EMAIL` = `me@example.com`
   - Add: `DEFAULT_USER_NAME` = `Your Name`
6. Click **Settings** → **Networking** → **Generate Domain**
7. Wait for deploy to finish (~2–3 min)

Your app URL will look like: `https://personal-assistant-production-xxxx.up.railway.app`

---

## Part 3 — Seed the database (first time only)

After first deploy, run seed once via Railway CLI or locally:

**Option A — Railway dashboard:**
Settings → Deploy → add one-time command, or use Railway shell:

```bash
npx tsx prisma/seed.ts
```

**Option B — From your Mac** (with Railway DATABASE_URL copied to `.env`):

```bash
npm run db:seed
```

---

## Part 4 — Use on your phone

1. Open the Railway URL in **Safari** (iPhone) or **Chrome** (Android)
2. **Add to Home Screen** for an app-like icon:
   - iPhone: Share → Add to Home Screen
   - Android: Menu → Install app

---

## Local development with PostgreSQL

```bash
docker compose up -d          # start local Postgres
cp .env.example .env          # update DATABASE_URL if needed
npm run db:push
npm run db:seed
npm run dev
```

---

## Important: Security

This app has **no login** yet. Anyone with the URL can see your tasks.

Before sharing the link:
- Keep the Railway URL private, or
- Add authentication (recommended for production)
