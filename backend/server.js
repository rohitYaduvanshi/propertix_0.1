import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { users } from './db/schema.js';
import { eq } from 'drizzle-orm';

const app = express();

// 1. CORS: All deployment origins allowed
const allowedOrigins = [
  "https://propertix-0-1.vercel.app",
  "https://propertixx.netlify.app",
  "https://propertix.netlify.app",
  "http://localhost:5173",
  "http://localhost:5174",
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Allow all netlify.app and vercel.app subdomains for preview deploys
    if (origin.endsWith(".netlify.app") || origin.endsWith(".vercel.app")) return callback(null, true);
    callback(new Error("Not allowed by CORS: " + origin));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));

// Pre-flight requests (OPTIONS) ko handle karne ke liye
app.options('*', cors());

app.use(express.json());

// 2. Neon DB Connection
const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

// 3. Health Check: Railway/Browser verification ke liye
app.get('/', (req, res) => {
    res.status(200).send("Propertix Backend is Live and Healthy! 🚀");
});

// 4. API: Register User
app.post('/api/auth/register', async (req, res) => {
  const { name, email, role, walletAddress } = req.body;
  
  if (!walletAddress) {
    return res.status(400).json({ success: false, message: "Wallet address is required" });
  }

  try {
    console.log("Attempting to register/update:", walletAddress);
    
    const savedUser = await db.insert(users).values({
      name,
      email,
      role,
      walletAddress: walletAddress.toLowerCase(),
    })
    .onConflictDoUpdate({
      target: users.walletAddress,
      set: { name, email, role }
    })
    .returning();
    
    res.status(201).json({ 
      success: true, 
      message: "Saved to Neon DB!", 
      user: savedUser[0] 
    });

  } catch (err) {
    console.error("DB Error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Database error",
      error: err.message 
    });
  }
});

// 5. API: Get User Profile
app.get('/api/auth/user/:address', async (req, res) => {
  try {
    const address = req.params.address.toLowerCase();
    const result = await db.select().from(users).where(eq(users.walletAddress, address));
    
    if (result.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(result[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. API: Update User Profile
app.put('/api/auth/update-profile', async (req, res) => {
  const { walletAddress, phone, bio, location } = req.body;
  if (!walletAddress) {
    return res.status(400).json({ success: false, message: "Wallet address is required" });
  }

  try {
    const updatedUser = await db.update(users)
      .set({
        phone,
        bio,
        location
      })
      .where(eq(users.walletAddress, walletAddress.toLowerCase()))
      .returning();

    if (updatedUser.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json(updatedUser[0]);
  } catch (err) {
    console.error("Profile Update Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- VERCEL SERVERLESS EXPORT ---
// Vercel pe: export default app (serverless)
// Local dev pe: app.listen() chalata hai
if (process.env.NODE_ENV !== 'production' || process.env.FORCE_LOCAL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Propertix Backend running on http://localhost:${PORT}`);
  });
}

export default app;