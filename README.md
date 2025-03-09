# Next.js Metrics Dashboard

A Next.js application that displays sales metrics and data analytics using Supabase as the backend.

## Features

- Sales data visualization
- Metrics of interest display
- Responsive table layouts
- Real-time data updates
- Hypothetical scenario analysis
- AI-powered monthly report generation

## Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
- Supabase

## Environment Variables

Required environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
PERPLEXITY_API_KEY=your-perplexity-api-key
```

The Perplexity API key is required for the AI-powered monthly report generation feature.

## Development

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment on Vercel

1. Connect your GitHub repository to Vercel
2. Add the required environment variables in Vercel's project settings
3. Deploy with default settings

The application will be automatically deployed on push to the main branch.
