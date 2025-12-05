# CabinPi React

A modern web application for monitoring cabin sensors, solar power, weather, and photos built with React and deployed on Cloudflare Pages.

## Features

- **Dashboard**: Real-time monitoring of solar power, inverter status, weather conditions, and indoor climate
- **Charts**: Historical data visualization with multiple time ranges (1h, 6h, 24h, 7d, or specific day)
- **Photos**: Gallery view of cabin photos with date navigation

## Architecture

- **Frontend**: React 19 + TypeScript + Mantine UI + React Router
- **Backend**: Cloudflare Pages Functions (proxy to api.cabinpi.com)
- **Build**: Vite
- **Deployment**: Cloudflare Pages

## Development

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Preview production build with Pages Functions (recommended for testing)
npm run preview

# Deploy to Cloudflare Pages
npm run deploy
```

### Development Workflow

**Option 1: Full stack development (with API)**
```bash
# Terminal 1: Build once for Functions to serve
npm run build

# Terminal 2: Start Pages Functions server
npm run dev:functions

# Terminal 3: Start Vite dev server (proxies /api to :8788)
npm run dev
```
- Vite dev at `http://localhost:5173` (hot reload)
- API calls proxy to wrangler at `http://localhost:8788`
- Best for developing with live API data

**Option 2: Frontend-only development (simpler)**
```bash
npm run dev
# Vite dev server at http://localhost:5173
# Note: /api calls will fail (no backend running)
```
- Fastest for UI-only development
- Good for working on components without data

**Option 3: Production-like testing**
```bash
npm run preview
# Full stack at http://localhost:8788
# Exactly matches production environment
```

## Project Structure

```
├── functions/           # Cloudflare Pages Functions (API proxy)
│   └── api/
│       ├── sensors/     # Sensor data endpoints
│       └── photos/      # Photo endpoints
├── src/
│   ├── components/      # React components (cards)
│   ├── lib/            # API utilities
│   ├── pages/          # Page components (Home, Charts, Photos)
│   ├── types/          # TypeScript type definitions
│   ├── App.tsx         # App shell with navigation
│   └── main.tsx        # Entry point
└── dist/               # Build output
```

## Environment Variables

The Cloudflare Pages Functions require the following environment variables to be set in the Cloudflare dashboard:

- `CF_ACCESS_CLIENT_ID`: Cloudflare Access client ID for API authentication
- `CF_ACCESS_CLIENT_SECRET`: Cloudflare Access client secret for API authentication

## Pages Functions

The application uses Cloudflare Pages Functions to proxy requests to the protected API at api.cabinpi.com:

- `/api/sensors/latest` - Get latest sensor readings
- `/api/sensors?start=&stop=&limit=` - Get historical sensor data
- `/api/photos?date=` - Get photos for a date
- `/api/photos/:filename?size=` - Get a specific photo

## Tech Stack

- React 19
- TypeScript
- Mantine UI (components, charts, dates)
- React Router (client-side routing)
- Recharts (chart rendering)
- date-fns (date manipulation)
- Cloudflare Pages (hosting and functions)
- Vite (build tool)
