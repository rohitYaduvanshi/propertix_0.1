import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { eq } from 'drizzle-orm';

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

// ─── Handler: PUT /api/auth/update-profile ────────────────────────────────────
export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'PUT') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { walletAddress, phone, bio, location } = JSON.parse(event.body || '{}');

    if (!walletAddress) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ success: false, message: 'Wallet address is required' }),
      };
    }

    const sql = neon(process.env.DATABASE_URL);
    const db = drizzle(sql);

    const updatedUser = await db.update(users)
      .set({ phone, bio, location })
      .where(eq(users.walletAddress, walletAddress.toLowerCase()))
      .returning();

    if (updatedUser.length === 0) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ success: false, message: 'User not found' }),
      };
    }

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedUser[0]),
    };
  } catch (err) {
    console.error('Profile Update Error:', err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ success: false, error: err.message }),
    };
  }
};
