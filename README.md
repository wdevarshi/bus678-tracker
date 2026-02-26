# Bus 678 Tracker

Real-time tracker for Singapore bus service 678 (City Direct: Punggol ↔ CBD).

Shows live arrival times for all stops on both AM and PM routes using LTA DataMall.

## Setup

```bash
npm install
```

Create `.env.local`:
```
LTA_API_KEY=your_lta_datamall_api_key
```

```bash
npm run dev
```

## Features

- Real-time bus arrivals from LTA DataMall
- AM/PM direction toggle
- Auto-refresh every 30 seconds
- Bus load indicator (seats/standing/full)
- Tap any stop for detailed arrival info

## Tech

- Next.js 15 + App Router
- Tailwind CSS
- Vercel serverless API proxy (hides API key)
