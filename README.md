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
   - Supabase URL and keys (including SERVICE_ROLE_KEY for ingestion)
   - Jibble API credentials
   - Resend API key (for Phase 8)

See `DEPLOYMENT.md` for detailed deployment instructions including Vercel setup.

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

### Getting Started
- [Deployment Guide](./DEPLOYMENT.md) - Complete deployment instructions
- [Environment Variables](./VERCEL_ENV_VARIABLES.md) - Environment variable reference
- [Development Plan](./development-plan.md) - Full development roadmap

### User Guides
- [API Documentation](./API_DOCUMENTATION.md) - Complete API reference
- [UI User Guide](./UI_USER_GUIDE.md) - Internal UI usage guide

### Operations
- [Troubleshooting Guide](./TROUBLESHOOTING.md) - Common issues and solutions
- [Maintenance Guide](./MAINTENANCE.md) - Maintenance procedures and monitoring
- [Daily Sync Deployment](./DAILY_SYNC_DEPLOYMENT.md) - Daily sync setup and verification

### Configuration
- [Airtable Setup](./AIRTABLE_SETUP.md)
- [Airtable Configuration](./AIRTABLE_CONFIG.md)
- [Database Schema](./DATABASE_SCHEMA.md)

## License

ISC

