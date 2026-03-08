# Deploy RO PvP Arena to Railway

## Disclaimer
This is a fan-made project for educational and personal demonstration purposes only.
Ragnarok Online is a trademark of Gravity Co., Ltd. This project is not affiliated with,
endorsed by, or connected to Gravity Co., Ltd. in any way. No commercial use is intended.


## Quick Setup (5 minutes)

### 1. Push to Personal GitHub
```bash
# Create a new private repo on github.com, then:
git remote add personal https://github.com/YOUR_USERNAME/ro-pvp-arena.git
git push personal master
```

### 2. Deploy on Railway
1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click **"New Project"** → **"Deploy from GitHub Repo"**
3. Select your `ro-pvp-arena` repo
4. Railway will auto-detect the build config and deploy

### 3. Add PostgreSQL (Optional)
1. In your Railway project, click **"New"** → **"Database"** → **"PostgreSQL"**
2. Click on the PostgreSQL service → **"Variables"** tab → copy `DATABASE_URL`
3. Click on your app service → **"Variables"** tab → add:
   - `DATABASE_URL` = (paste the PostgreSQL URL)
   - `JWT_SECRET` = (any random string, e.g. `my-secret-key-12345`)
   - `NODE_ENV` = `production`

### 4. Generate a Public URL
1. Click on your app service → **"Settings"** tab
2. Under **"Networking"**, click **"Generate Domain"**
3. Share the URL with anyone — they can play in their browser!

## Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Auto-set by Railway |
| `DATABASE_URL` | No | PostgreSQL connection string (game works without DB) |
| `JWT_SECRET` | Yes | Secret for JWT tokens |
| `NODE_ENV` | No | Set to `production` for optimized builds |

## Architecture
In production, a single server handles both:
- **HTTP** → Next.js (game UI, auth API)
- **WebSocket** → Colyseus (real-time game state)

Both run on the same port, which Railway assigns via `PORT`.
