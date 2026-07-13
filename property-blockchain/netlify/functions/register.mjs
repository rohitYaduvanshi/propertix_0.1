import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// ─── Schema ──────────────────────────────────────────────────────────────────
const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  role: text('role').notNull(),
  walletAddress: text('wallet_address').unique().notNull(),
  phone: text('phone'),
  bio: text('bio'),
  location: text('location'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ─── CORS Headers ─────────────────────────────────────────────────────────────
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Requested-With',
};

// ─── Handler: POST /api/auth/register ─────────────────────────────────────────
export const handler = async (event) => {
  // Pre-flight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { name, email, role, walletAddress } = JSON.parse(event.body || '{}');

    if (!walletAddress) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ success: false, message: 'Wallet address is required' }),
      };
    }

    const sql = neon(process.env.DATABASE_URL);
    const db = drizzle(sql);

    const newUser = await db.insert(users).values({
      name,
      email,
      role,
      walletAddress: walletAddress.toLowerCase(),
    }).returning();

    return {
      statusCode: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: 'Saved to Neon DB!',
        user: newUser[0],
      }),
    };
  } catch (err) {
    console.error('DB Error:', err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        message: 'Database error or User already exists',
        error: err.message,
      }),
    };
  }
};
