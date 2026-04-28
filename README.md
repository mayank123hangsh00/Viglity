# Vigility — Interactive Product Analytics Dashboard

> A self-referential analytics dashboard: every filter change and chart click is tracked and fed back into the visualizations.

![Dashboard Preview](./docs/preview.png)

---

## Live Demo

👉 **[https://viglity.vercel.app](https://viglity.vercel.app)**

---

## Quick Start (Local)

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9

### 1 — Backend

```bash
cd backend
npm install
npx prisma migrate dev --name init   # creates dev.db
npm run seed                          # loads 7 users + 250 interaction records
npm run dev                           # starts API on http://localhost:3001
```

### 2 — Frontend

```bash
cd frontend
npm install
npm run dev                           # starts UI on http://localhost:5173
```

Open **http://localhost:5173** and log in with any seeded account.

### Demo Credentials

| Username  | Password      | Age | Gender |
|-----------|---------------|-----|--------|
| alice     | password123   | 25  | Female |
| bob       | password123   | 17  | Male   |
| charlie   | password123   | 45  | Male   |
| diana     | password123   | 35  | Female |
| eve       | password123   | 28  | Other  |
| frank     | password123   | 52  | Male   |
| grace     | password123   | 14  | Female |

---

## Seed Instructions

```bash
cd backend
npm run seed
```

Clears all data, creates 7 users, and inserts **250 weighted interaction records** spread across the last 90 days. The distribution is weighted so `date_filter` and `bar_chart_click` are the busiest features (realistic product analytics).

---

## API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Create account (`username, password, age, gender`) |
| POST | `/api/auth/login` | — | Login → JWT token |
| POST | `/api/track` | JWT | Record a feature interaction (`feature_name`) |
| GET  | `/api/analytics` | JWT | Aggregated bar + line chart data |
| GET  | `/api/health` | — | Health check |

### GET /api/analytics — Query Parameters

| Param | Example | Description |
|-------|---------|-------------|
| `startDate` | `2024-01-01T00:00:00Z` | ISO start date |
| `endDate`   | `2024-03-31T23:59:59Z` | ISO end date |
| `age`       | `18-40` \| `<18` \| `>40` \| `All` | User age filter |
| `gender`    | `Male` \| `Female` \| `Other` \| `All` | User gender filter |
| `feature`   | `date_filter` | Feature to show in line chart |

---

## Architecture

```
backend/
├── prisma/schema.prisma     # User + FeatureClick models
├── src/
│   ├── index.js             # Express entry + CORS
│   ├── middleware/auth.js   # JWT verification
│   └── routes/
│       ├── auth.js          # POST /register, POST /login
│       ├── track.js         # POST /track
│       └── analytics.js     # GET /analytics (bar + line aggregation)
└── seed.js

frontend/
├── src/
│   ├── pages/
│   │   ├── Login.jsx        # Auth page (login + register tabs)
│   │   └── Dashboard.jsx    # Main dashboard (stats, filters, charts)
│   ├── components/
│   │   ├── FilterPanel.jsx  # Date range, age, gender filters
│   │   ├── BarChartWidget.jsx  # Horizontal bar, clickable bars
│   │   └── LineChartWidget.jsx # Time-series line with gradient fill
│   └── utils/
│       ├── api.js           # Axios client with JWT interceptors
│       └── cookies.js       # js-cookie filter persistence
└── vite.config.js           # Proxy /api → localhost:3001
```

### Key Design Decisions

- **Prisma ORM** — type-safe DB access; SQLite for local dev, Postgres for production. Only the `DATABASE_URL` env var changes.
- **JS-side date grouping** — the line chart groups clicks by day in JavaScript (not SQL), making the query DB-agnostic (works identically on SQLite and Postgres).
- **Cookie persistence** — filter state is stored with `js-cookie` (30-day expiry); restored on every page load.
- **Self-referential tracking** — every UI interaction (`date_filter`, `age_filter`, `gender_filter`, `bar_chart_click`) fires `POST /track`, so the dashboard literally visualizes its own usage.
- **Weighted bar dimming** — when a feature bar is selected, other bars dim to 25% opacity so the selection stands out visually.

---

## Deployment (Render)

### Backend (Web Service)
1. **Build Command:** `npm install && npx prisma generate && npx prisma migrate deploy`
2. **Start Command:** `node src/index.js`
3. **Environment Variables:**
   - `DATABASE_URL` = Render Postgres internal URL
   - `JWT_SECRET` = any long random string
   - `FRONTEND_URL` = your Vercel frontend URL

### Frontend (Vercel / Netlify)
1. **Root directory:** `frontend`
2. **Build command:** `npm run build`
3. **Output dir:** `dist`
4. **Environment Variables:**
   - `VITE_API_URL` = your Render backend URL + `/api`

> After deployment, run the seed by hitting `POST /api/seed` — or add a one-time seed endpoint to the backend.

---

## Scalability Essay

> **If this dashboard needed to handle 1 million write-events per minute, how would you change your backend architecture?**

At 1M writes/minute (~17K writes/second), a synchronous Express→Postgres pipeline would immediately saturate. The fix is **decoupled, async ingestion**:

1. **Event Queue (Kafka / AWS Kinesis):** `POST /track` no longer writes to the DB. Instead, it publishes a lightweight event to a Kafka topic and returns `202 Accepted` in <5ms. This instantly makes the write path non-blocking and horizontally scalable.

2. **Stream Consumers:** A fleet of stateless worker services (e.g., Kafka consumers, AWS Lambda) batch-consume events and insert into a **columnar analytics database** (ClickHouse, BigQuery, or Redshift). Columnar storage makes the GROUP BY aggregations in `GET /analytics` orders of magnitude faster than row-store Postgres.

3. **Read path caching:** `GET /analytics` results are cached in **Redis** (TTL ~60s). Since the data is append-only and near-real-time (not live-live), stale-for-60s is acceptable and removes 99% of DB load.

4. **Horizontal scaling:** The Express API tier runs as stateless pods behind a load balancer (Kubernetes HPA or ECS). Kafka provides natural backpressure and buffering if consumers fall behind.

5. **Auth service separation:** User auth remains on Postgres (low-write, high-read), isolated from the analytics write path entirely.

This architecture (API → Kafka → ClickHouse + Redis cache) is how companies like Amplitude and Mixpanel handle billions of events per day.

---

## License

MIT
