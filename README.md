# Vyaapar Backend

A TypeScript backend API built with **Next.js** (App Router), Prisma ORM, and PostgreSQL database.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL database (Supabase, local PostgreSQL, or any PostgreSQL instance)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd vyaapar-backend
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required dependencies including Next.js, Prisma, and other packages.

### 3. Set Up Environment Variables

Create a `.env` or `.env.local` file in the root directory (use `env.template` as reference):

```bash
cp env.template .env.local
```

Edit the `.env` file and add your configuration:

```env
# Database Configuration
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"

# Server Configuration
PORT=3000
NODE_ENV=development

# Optional: Logging
LOG_LEVEL=DEBUG
```

**Important:** Replace the `DATABASE_URL` with your actual PostgreSQL connection string.

### 4. Generate Prisma Client

After setting up your database URL, generate the Prisma Client:

```bash
npm run prisma:generate
```

This command reads your Prisma schema and generates the Prisma Client with TypeScript types.

### 5. Run Database Migrations

#### First Time Setup (Initial Migration)

For the first time setup, create and apply the initial migration:

```bash
npm run prisma:migrate
```

This will:
- Create a new migration file in `prisma/migrations/`
- Apply the migration to your database
- Create all tables defined in your Prisma schema

#### Subsequent Migrations

When you modify your Prisma schema (`prisma/schema.prisma`), run:

```bash
npm run prisma:migrate
```

This will:
- Prompt you to name the migration
- Generate a new migration file
- Apply the changes to your database

#### Alternative: Push Schema (Development Only)

For quick development iterations, you can push schema changes without creating migration files:

```bash
npm run prisma:push
```

**Note:** This is useful for prototyping but should not be used in production. Always use migrations for production.

### 6. Verify Database Connection

The server automatically checks the database connection on startup. You can also verify it manually:

```bash
# Start the server
npm run dev

# In another terminal, check the health endpoint
curl http://localhost:3000/health
```

The health endpoint will return:
- `200 OK` with `database: "connected"` if the database is connected
- `503 Service Unavailable` with `database: "disconnected"` if the database is not connected

## Running the Application

### Development Mode

Start the Next.js development server with hot reload:

```bash
npm run dev
```

The server will be available at `http://localhost:3000` (or the port in your `.env`).

### Production Mode

1. **Build:**
   ```bash
   npm run build
   ```

2. **Start:**
   ```bash
   npm start
   ```

## Database Migrations

### Understanding Migrations

Migrations are version-controlled database schema changes. They allow you to:
- Track all database changes
- Apply changes consistently across environments
- Rollback changes if needed
- Collaborate with team members

### Migration Commands

| Command | Description |
|---------|-------------|
| `npm run prisma:migrate` | Create and apply a new migration |
| `npm run prisma:push` | Push schema changes without creating migration files (dev only) |
| `npx prisma migrate reset` | Reset the database and apply all migrations |
| `npx prisma migrate status` | Check the status of migrations |
| `npx prisma migrate resolve --applied <migration-name>` | Mark a migration as applied |
| `npx prisma migrate resolve --rolled-back <migration-name>` | Mark a migration as rolled back |

### Creating a Migration

1. **Modify your Prisma schema** (`prisma/schema.prisma`):
   ```prisma
   model User {
     id        String   @id @default(uuid())
     email     String   @unique
     name      String?
     createdAt DateTime @default(now())
     updatedAt DateTime @updatedAt
   }
   ```

2. **Create and apply the migration:**
   ```bash
   npm run prisma:migrate
   ```

3. **Name your migration** when prompted (e.g., `add_user_model`)

4. The migration file will be created in `prisma/migrations/` and applied to your database.

### Migration Workflow

```bash
# 1. Modify prisma/schema.prisma
# 2. Create migration
npm run prisma:migrate

# 3. Review the generated migration SQL in prisma/migrations/
# 4. Migration is automatically applied to your database
```

### Resetting the Database

To reset your database and reapply all migrations (⚠️ **This will delete all data**):

```bash
npx prisma migrate reset
```

### Checking Migration Status

To see which migrations have been applied:

```bash
npx prisma migrate status
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Next.js development server |
| `npm run build` | Build Next.js for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |
| `npm run prisma:generate` | Generate Prisma Client |
| `npm run prisma:migrate` | Create and apply database migrations |
| `npm run prisma:studio` | Open Prisma Studio (database GUI) |
| `npm run prisma:push` | Push schema changes without migrations (dev only) |

## Project Structure

```
vyaapar-backend/
├── app/
│   ├── api/            # Next.js API routes
│   │   ├── auth/       # Login, me, users (admin)
│   │   ├── users/      # User CRUD
│   │   ├── dashboard/  # Role-specific dashboards
│   │   └── health/     # Health check
│   ├── health/         # GET /health
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── config/         # Database, env
│   ├── services/       # Business logic (auth, user)
│   ├── validators/     # Joi schemas
│   ├── errors/         # AppError
│   ├── utils/          # Logger
│   ├── auth.ts         # getAuth, requireAdmin, requireRoleDashboard
│   └── errorHandler.ts
├── prisma/
│   └── schema.prisma
├── .env.local          # Environment variables (not in git)
└── package.json
```

## API Endpoints

### Health Check

```bash
GET /health
```

Returns server and database connection status.

### User API

- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create a new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Getting Your Database Connection String

### Supabase

1. Go to your Supabase project dashboard
2. Navigate to **Settings → Database**
3. Find the **Connection string** section
4. Copy the URI connection string
5. Replace `[YOUR-PASSWORD]` with your database password
6. Add it to your `.env` file as `DATABASE_URL`

Example:
```
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

### Local PostgreSQL

```
postgresql://postgres:password@localhost:5432/vyaapar_db?schema=public
```

## Troubleshooting

### Database Connection Issues

1. **Check your `.env` file** - Ensure `DATABASE_URL` is correctly set
2. **Verify database is running** - Make sure your PostgreSQL database is accessible
3. **Check network/firewall** - Ensure your IP is whitelisted (for cloud databases)
4. **Test connection** - Use `npm run dev` and check the startup logs

### Migration Issues

1. **Migration conflicts** - Use `npx prisma migrate resolve` to resolve conflicts
2. **Schema drift** - Use `npx prisma migrate status` to check for drift
3. **Reset database** - Use `npx prisma migrate reset` (⚠️ deletes all data)

### Build Issues

1. **TypeScript errors** - Run `npm run build` to see compilation errors
2. **Missing types** - Run `npm run prisma:generate` to regenerate Prisma types
3. **Clean build** - Delete `dist/` folder and rebuild

## Next Steps

- Modify the Prisma schema (`prisma/schema.prisma`) to define your database models
- Add API routes in `src/routes/`
- Implement authentication and authorization
- Add request validation using Joi schemas
- Add more middleware as needed
- Write tests for your API endpoints

## License

ISC
