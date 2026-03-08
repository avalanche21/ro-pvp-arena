# RO PvP Arena

A browser-playable Ragnarok Online-inspired PvP arena with real-time multiplayer combat.

## Disclaimer
This is a fan-made project for educational and personal demonstration purposes only.
Ragnarok Online is a trademark of Gravity Co., Ltd. This project is not affiliated with,
endorsed by, or connected to Gravity Co., Ltd. in any way. No commercial use is intended.

## Features
- 12 playable classes (Knight, Crusader, Assassin, Rogue, Wizard, Sage, Priest, Monk, Hunter, Bard, Dancer, Alchemist)
- 4 unique skills per class with dramatic visual effects
- Gender selection with animated RO-style sprites
- Real-time PvP combat with melee swing arcs and impact effects
- Monsters: Poring (red), Drops (orange, freezes on kill), Marin (blue, restores MP on kill)
- Iceberg frozen effect, camera shake, screen flash
- Live leaderboard (top 10 kills)
- No downloads — plays entirely in the browser

## Tech Stack
- **Frontend**: Next.js 14, Phaser 3, React, Tailwind CSS
- **Backend**: Colyseus (real-time multiplayer), Express
- **Database**: PostgreSQL (optional — game works without it)
- **Auth**: JWT
- **Language**: TypeScript throughout

## Project Structure
```
ro_pvp_server/
├── apps/
│   ├── server/          # Colyseus game server (port 2567)
│   │   └── src/
│   │       ├── rooms/       # ArenaRoom (game logic)
│   │       ├── systems/     # Combat, Monster, Skill systems
│   │       ├── schema/      # Colyseus state (Player, Monster, etc.)
│   │       ├── auth.ts      # JWT auth
│   │       └── db.ts        # PostgreSQL connection
│   └── web/             # Next.js frontend (port 3000)
│       ├── src/
│       │   ├── app/         # Pages (login, register, lobby, play)
│       │   ├── game/        # Phaser game
│       │   │   ├── scenes/      # BootScene, ArenaScene, UIScene
│       │   │   ├── entities/    # PlayerSprite, MonsterSprite, SkillEffect
│       │   │   └── network/     # ColyseusClient
│       │   ├── components/  # React components
│       │   └── lib/         # Auth utilities
│       └── public/assets/   # Sprites, maps, tiles (~49MB)
├── packages/
│   └── shared/          # Shared types, class definitions, skill data
├── deploy/              # Production unified server for Railway
└── docker-compose.yml   # PostgreSQL for local dev
```

## Local Development

### Prerequisites
- Node.js 20+ (tested with 24)
- PostgreSQL (optional, via Docker)

### 1. Install dependencies
```bash
npm install
```

### 2. Set up database (optional)
```bash
docker compose up -d
```

### 3. Create environment files
```bash
# Root .env
DATABASE_URL=postgres://ro_pvp:devpassword@localhost:5432/ro_pvp
JWT_SECRET=change-me-to-a-random-secret
DB_PASSWORD=devpassword
NEXT_PUBLIC_GAME_SERVER_URL=ws://localhost:2567

# apps/server/.env (same content)
DATABASE_URL=postgres://ro_pvp:devpassword@localhost:5432/ro_pvp
JWT_SECRET=change-me-to-a-random-secret

# apps/web/.env.local
DATABASE_URL=postgres://ro_pvp:devpassword@localhost:5432/ro_pvp
JWT_SECRET=change-me-to-a-random-secret
NEXT_PUBLIC_GAME_SERVER_URL=ws://localhost:2567
```

**IMPORTANT**: The `JWT_SECRET` must be the same in all three files, otherwise login tokens won't work (you'll get "Invalid token" errors).

### 4. Start development servers
```bash
npm run dev
```
This starts both:
- **Game server** at http://localhost:2567
- **Web app** at http://localhost:3000

### 5. Play
Open http://localhost:3000 → Register → Pick a class → Enter Arena

## Controls
| Key | Action |
|-----|--------|
| WASD | Move |
| Space | Basic attack |
| 1-4 | Cast skills |
| Click | Target player/monster |
| Right-click | Move to location |

## Monsters
| Monster | Color | HP | Reward |
|---------|-------|-----|--------|
| Poring | Pink | 300 | None |
| Drops | Orange | 350 | Freezes killer (iceberg effect) |
| Marin | Blue | 400 | Restores MP to 100% (Blue Potion) |

All monsters respawn after death with wandering AI.

## Deploy to Railway (Production)
See [DEPLOY.md](./DEPLOY.md) for full instructions.

Quick version:
1. Push to a **private** GitHub repo
2. Sign in to [railway.app](https://railway.app) with GitHub
3. New Project → Deploy from GitHub Repo
4. Add env var: `JWT_SECRET=your-secret-here`
5. Generate domain → share URL

## Known Notes
- The game works without PostgreSQL (accounts are session-based)
- With PostgreSQL, accounts persist and leaderboard stats are saved
- The unified deploy server (`deploy/server.ts`) runs both Next.js and Colyseus on one port for Railway
- In local dev, they run on separate ports (3000 and 2567)
