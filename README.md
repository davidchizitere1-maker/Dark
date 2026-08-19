# Dark Gaming Site - Next.js + Supabase Setup

GridTactics: 10x10 Adaptive AI Board Game
A web-based 10x10 turn-based strategy game built with Next.js, React, and Supabase. Players navigate the board, strategically deploy barricades, and race to secret targets against an adaptive AI opponent that refines its strategy over time using historical match data.
Features
 * 10x10 Strategic Grid: Dynamic tile board featuring player movement, horizontal/vertical wall placement, and secret target mechanics.
 * Data-Driven AI: Opponent decision engine leveraging state lookups and move evaluations based on past match outcomes stored in Supabase.
 * Real-Time Logging: Every board state, wall placement, and player turn is persisted to evaluate high-percentage winning strategies.
 * Modern UI & Path Validation: CSS Grid rendering with built-in pathfinding checks (BFS/A*) to ensure valid barricade placement without completely blocking pathways.
Tech Stack
 * Framework: Next.js (App Router)
 * Language: TypeScript
 * UI & Styling: React, Tailwind CSS
 * Database: Supabase (PostgreSQL)
Database Schema Setup
Run the following script in your Supabase SQL Editor to construct the tracking tables:
CREATE TABLE game_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  difficulty INT,
  winner TEXT,
  total_turns INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE game_moves (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  match_id UUID REFERENCES game_matches(id) ON DELETE CASCADE,
  turn_number INT,
  player TEXT,
  board_state TEXT,
  move_type TEXT,
  move_details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

Getting Started
Prerequisites
 * Node.js: v18.0.0 or higher
 * npm / yarn / pnpm
 * A active Supabase project instance
Installation
 * Clone the repository
   git clone https://github.com/your-username/grid-tactics.git
cd grid-tactics

 * Install dependencies
   npm install

 * Configure Environment Variables
   Create a .env.local file in the root directory:
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

 * Launch Development Server
   npm run dev

   Navigate to http://localhost:3000 in your browser.
Directory Structure
├── app/
│   ├── layout.tsx         # Global layout & provider wrappers
│   └── page.tsx           # Primary game view & orchestration
├── components/
│   ├── Board.tsx          # 10x10 CSS Grid & interactive tiles
│   ├── Controls.tsx       # Wall placement toggle & action buttons
│   └── PlayerHUD.tsx      # Target indicators, wall counts, status
├── lib/
│   ├── gameEngine.ts      # Pure JS rules, move validation, BFS paths
│   ├── aiEngine.ts        # AI turn logic & heuristic evaluation
│   └── supabase.ts        # Supabase API client setup

