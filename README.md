# OpenCarts — Live wholesale carts dashboard

Real-time dashboard showing open carts and their values from the Bamboo Intelligence API. Click a cart to drill into its line items.

## Stack
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Server-side proxy to `https://api-intelligence.getbamboo.com/api/reports/cart-counts`
- Polls every 15 seconds

## Local dev
```bash
npm install
npm run dev
```

## Deploy
Push to GitHub and import into Vercel. No env vars required by default; to point at a different feed, set `BAMBOO_CART_URL`.
