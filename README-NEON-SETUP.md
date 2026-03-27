# Neon PostgreSQL + Prisma 7 Setup Guide

## Setup Complete ✓

Your project is now configured with Neon PostgreSQL and Prisma 7. Here's what was set up:

### Installed Packages

- `prisma@7.5.0` - Prisma CLI
- `@prisma/client@7.5.0` - Prisma Client
- `@prisma/adapter-neon@7.5.0` - Neon serverless driver adapter
- `dotenv@17.3.1` - Environment variable management

### Files Created/Modified

1. **prisma/schema.prisma** - Your database schema with an example User model
2. **prisma.config.ts** - Prisma CLI configuration (uses DIRECT_URL)
3. **src/lib/db.ts** - Prisma Client instance with Neon adapter
4. **.env** - Environment variables template (needs your connection strings)

## Next Steps - Add Your Connection Strings

### 1. Get Your Neon Connection Strings

Go to your [Neon Console](https://console.neon.tech) and:

1. Select your project
2. Click "Connect"
3. Copy both connection strings:
   - **Pooled connection** (has `-pooler` in hostname)
   - **Direct connection** (no `-pooler`)

### 2. Update .env File

Replace the placeholders in `.env` with your actual connection strings:

```env
# Pooled connection - for your application
DATABASE_URL="postgresql://[user]:[password]@[endpoint]-pooler.[region].aws.neon.tech/[dbname]?sslmode=require"

# Direct connection - for Prisma CLI
DIRECT_URL="postgresql://[user]:[password]@[endpoint].[region].aws.neon.tech/[dbname]?sslmode=require"
```

### 3. Generate Prisma Client and Push Schema

After adding your connection strings, run:

```bash
npx prisma generate
npx prisma db push
```

## Usage

Import and use Prisma Client in your application:

```typescript
import { prisma } from '@/lib/db';

// Example: Fetch all users
const users = await prisma.user.findMany();

// Example: Create a user
const newUser = await prisma.user.create({
  data: {
    email: 'user@example.com',
    name: 'John Doe',
  },
});
```

## Important Notes

### Connection Strings

- **DATABASE_URL** (pooled): Used by your application for queries
- **DIRECT_URL** (direct): Used by Prisma CLI for migrations and schema operations

### Prisma 7 Changes

- Driver adapters are now required (using `@prisma/adapter-neon`)
- Client is generated to `src/generated/prisma` (not `node_modules`)
- `prisma.config.ts` is the new configuration file
- Environment variables must be loaded explicitly with `dotenv/config`

### Schema Modifications

Edit `prisma/schema.prisma` to define your data models, then run:

```bash
npx prisma db push  # Push changes to database
npx prisma generate # Regenerate Prisma Client
```

## Resources

- [Neon + Prisma Guide](https://neon.com/docs/guides/prisma)
- [Prisma 7 Upgrade Guide](https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Neon Documentation](https://neon.tech/docs)
