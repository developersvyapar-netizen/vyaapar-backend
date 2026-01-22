# Vyaapar Backend

A Node.js backend API built with Express, Prisma ORM, and Supabase PostgreSQL database.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account with a PostgreSQL database

## Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   - Copy `.env.example` to `.env` (if it exists) or create a `.env` file
   - Add your Supabase PostgreSQL connection URL:
     ```
     DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
     ```
   - You can find your Supabase connection string in your Supabase project settings under "Database" → "Connection string"

3. **Generate Prisma Client:**
   ```bash
   npm run prisma:generate
   ```

4. **Run database migrations:**
   ```bash
   npm run prisma:migrate
   ```
   This will create the database schema based on your Prisma schema file.

5. **Start the development server:**
   ```bash
   npm run dev
   ```

   Or for production:
   ```bash
   npm start
   ```

## Available Scripts

- `npm run dev` - Start development server with watch mode
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio (database GUI)
- `npm run prisma:push` - Push schema changes to database without migrations

## Project Structure

```
vyaapar-backend/
├── src/
│   └── index.js          # Main application entry point
├── prisma/
│   └── schema.prisma     # Prisma schema definition
├── .env                  # Environment variables (not in git)
├── .gitignore
└── package.json
```

## Getting Your Supabase Connection String

1. Go to your Supabase project dashboard
2. Navigate to Settings → Database
3. Find the "Connection string" section
4. Copy the URI connection string (it should look like: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`)
5. Replace `[YOUR-PASSWORD]` with your database password
6. Add it to your `.env` file as `DATABASE_URL`

## Next Steps

- Modify the Prisma schema (`prisma/schema.prisma`) to define your database models
- Add your API routes in `src/index.js` or organize them in separate route files
- Implement authentication and authorization as needed
- Add validation middleware for request data
