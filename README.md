# FlexTime

Time tracking analytics system for Flexscale's offshore agents.

## Overview

FlexTime ingests data from the Jibble API, stores it durably in Supabase, and provides reporting capabilities including weekly email digests to clients.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel
- **Styling**: Tailwind CSS
- **Email**: Resend
- **External APIs**: Jibble, Airtable

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Airtable account
- Jibble API access

### Installation

1. Clone the repository:
```bash
git clone git@github.com:pshah-flex/flextime.git
cd flextime
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

4. Fill in your environment variables in `.env.local`:
   - Airtable Personal Access Token
   - Supabase URL and keys
   - Jibble API credentials
   - Resend API key

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
/app
  /api          # API routes
  /components   # React components
  /lib          # Utilities and helpers
  /types         # TypeScript definitions
  /hooks         # React hooks
/supabase       # Database schema and migrations
/scripts        # Utility scripts
```

## Environment Variables

See `.env.local.example` for all required environment variables.

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Documentation

- [Development Plan](./development-plan.md)
- [Simplified Development Plan](./development-plan-simplified.md)
- [Airtable Setup](./AIRTABLE_SETUP.md)
- [Airtable Configuration](./AIRTABLE_CONFIG.md)

## License

ISC

