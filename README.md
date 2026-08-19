# Dark Gaming Site - Next.js + Supabase Setup

## Installation

1. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

2. Make sure `.env.local` is configured with your Supabase credentials

3. Run development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `/app` - Next.js app directory with pages and layouts
- `/lib/supabase` - Supabase client helpers (server, client, middleware)
- `/components` - Reusable React components
- `middleware.ts` - Next.js middleware for session management
- `tailwind.config.ts` - Tailwind CSS configuration

## Features

- ✅ Next.js 15 with App Router
- ✅ Supabase authentication & database integration
- ✅ TypeScript support
- ✅ Tailwind CSS for styling
- ✅ Server & client Supabase clients
- ✅ Session management middleware

## Next Steps

1. Set up Supabase tables:
   - Create a `games` table for storing game information
   - Create a `users` table for player profiles
   - Create a `leaderboards` table for game scores

2. Add authentication pages:
   - Login page
   - Sign-up page
   - Profile page

3. Create game pages and components

4. Add player statistics and leaderboard features
