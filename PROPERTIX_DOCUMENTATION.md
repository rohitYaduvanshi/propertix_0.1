# 🏛️ PROPERTIX — Project Documentation

> **"The Smartest Way to Verify & Own Land"**
> A blockchain-powered property registration and verification platform designed for India.

---

## 📌 What is Propertix?

**Propertix** is a full-stack Web3 decentralized application (dApp) that digitizes and secures India's property registration process using blockchain technology. It replaces the traditional, paper-heavy, and corruption-prone land registration system with an immutable, transparent, and tamper-proof digital ledger.

The platform allows citizens to:
- Register land/property as a digital deed on the blockchain
- Get the deed verified through a 3-phase government workflow
- Receive a unique **NFT (ERC-721)** token representing their property ownership
- Transfer, sell, or lease property ownership directly on-chain
- Search and verify any registered property using its IPFS hash or transaction hash

---

## 🎯 Problem It Solves

Traditional Indian property registration (the "Gopu Chand Problem"):
- **Day 1–15:** Endless document gathering (Registry, Khatauni, No-Objection Certificates...)
- **Day 16–45:** Multiple office visits, unofficial "facilitation fees"
- **Day 46–90:** Still waiting for final name mutation

**Propertix Solution:**
- ✅ Instant digital submission with IPFS-backed documents
- ✅ Transparent, traceable 3-phase government verification
- ✅ NFT minted as proof of ownership — tamper-proof forever
- ✅ 100% on-chain record — searchable by anyone

---

## 🏗️ Architecture Overview

```
Propertix
├── Frontend (React + Vite)         → property-blockchain/
│   ├── Pages (12 pages)
│   ├── Blockchain Integration      → ethers.js + Smart Contract ABI
│   ├── Map System                  → react-leaflet + OpenStreetMap
│   ├── IPFS Integration            → Pinata / IPFS Gateway
│   └── Auth Context                → MetaMask Wallet
│
├── Backend (Node.js + Express)     → backend/
│   ├── REST API (Express.js)
│   ├── Database ORM (Drizzle ORM)
│   └── Cloud Database (Neon PostgreSQL)
│
└── Blockchain Layer                → Ethereum (Sepolia Testnet)
    ├── Smart Contract (Solidity)   → PropertyRegistry.sol
    └── NFT Standard (ERC-721)      → Minted upon approval
```

---

## 🧰 Technology Stack

### 🖥️ Frontend

| Technology | Version | Purpose |
|---|---|---|
| **React** | v19.2.0 | UI Framework |
| **Vite** | v7.2.4 | Build Tool & Dev Server |
| **React Router DOM** | v7.10.1 | Client-side Routing |
| **Tailwind CSS** | v4.2.0 | Utility-first Styling |
| **ethers.js** | v6.16.0 | Ethereum / Blockchain Interaction |
| **react-leaflet** | v5.0.0 | Interactive Map Component |
| **leaflet** | v1.9.4 | Core Map Library |
| **leaflet.markercluster** | v1.5.3 | Map Marker Clustering |
| **leaflet-geosearch** | v4.2.2 | Location Search on Map |
| **axios** | v1.13.2 | HTTP Client for API Calls |
| **lucide-react** | v0.575.0 | Icon Library |
| **tesseract.js** | v7.0.0 | OCR (Document Scanning) |
| **@tensorflow/tfjs** | v4.22.0 | ML / Image Recognition |
| **@tensorflow-models/mobilenet** | v2.1.1 | Image Classification Model |
| **html2canvas** | v1.4.1 | Screenshot / PDF Generation |
| **pdf-lib** | v1.17.1 | PDF Document Creation |
| **crypto-js** | v4.2.0 | Aadhaar Hashing / Encryption |
| **matter-js** | v0.20.0 | Physics Engine (UI Animations) |
| **@emailjs/browser** | v4.4.1 | Contact Form Email Integration |

### ⚙️ Backend

| Technology | Version | Purpose |
|---|---|---|
| **Node.js** | 20.x | Runtime Environment |
| **Express.js** | v4.19.2 | REST API Framework |
| **Drizzle ORM** | v0.45.2 | Type-safe Database ORM |
| **@neondatabase/serverless** | v1.0.2 | Neon PostgreSQL Serverless Driver |
| **cors** | v2.8.5 | Cross-Origin Resource Sharing |
| **dotenv** | v16.4.5 | Environment Variable Management |
| **nodemon** | v3.1.0 | Dev Auto-Restart |

### ⛓️ Blockchain

| Technology | Purpose |
|---|---|
| **Ethereum (Sepolia Testnet)** | Blockchain Network |
| **Solidity** | Smart Contract Language |
| **ERC-721 (NFT Standard)** | Property NFT Minting |
| **MetaMask** | Wallet / Identity Provider |
| **IPFS (via Pinata)** | Decentralized File Storage |
| **Etherscan (Sepolia)** | Transaction Explorer |

### ☁️ Deployment & Infrastructure

| Service | Purpose |
|---|---|
| **Netlify** | Frontend Hosting + Serverless Functions |
| **Vercel** | Alternative Frontend + Backend Deployment |
| **Neon DB** | Serverless PostgreSQL (Cloud) |
| **Railway** | Backend Hosting (optional) |
| **Pinata / IPFS** | Property Document & Image Storage |

---

## 📂 Project Structure

```
Propertix/
├── backend/                          # Node.js Express Backend
│   ├── db/
│   │   └── schema.js                 # Drizzle ORM - Users Table Schema
│   ├── routes/
│   │   └── propertyRoutes.js         # Property API Routes
│   ├── server.js                     # Main Server + API Endpoints
│   ├── drizzle.config.js             # Drizzle DB Configuration
│   ├── vercel.json                   # Vercel Deployment Config
│   └── .env                          # Environment Variables (DB URL, PORT)
│
└── property-blockchain/              # React + Vite Frontend
    ├── src/
    │   ├── blockchain/
    │   │   ├── contractConfig.js      # Smart Contract Address + ABI
    │   │   └── PropertyRegistry.json  # Contract ABI (compiled)
    │   ├── components/
    │   │   ├── Navbar.jsx             # Navigation Bar
    │   │   ├── Footer.jsx             # Footer Component
    │   │   └── ProtectedRoute.jsx     # Auth Route Guard
    │   ├── context/
    │   │   └── AuthContext.jsx        # Global Auth State (Wallet + Roles)
    │   ├── pages/
    │   │   ├── Home.jsx               # Landing + Property Search
    │   │   ├── Login.jsx              # MetaMask Login
    │   │   ├── Registersys.jsx        # User Registration
    │   │   ├── RegisterAsset.jsx      # Property Registration + IPFS Upload
    │   │   ├── PropertyMap.jsx        # Interactive Property Map
    │   │   ├── OwnerDashboard.jsx     # Owner's Property Portfolio
    │   │   ├── GiftOwnership.jsx      # Transfer NFT to Another Wallet
    │   │   ├── AdminPanel.jsx         # Surveyor / Registrar Panel
    │   │   ├── GovernmentPortal.jsx   # Govt Officer Verification Desk
    │   │   ├── MyProfile.jsx          # User Profile Management
    │   │   ├── About.jsx              # About Page
    │   │   └── Contact.jsx            # Contact Page
    │   ├── utils/
    │   │   └── ipfs.js                # IPFS Upload Utilities
    │   ├── App.jsx                    # Root Routes + Guards
    │   └── index.css                  # Global Styles + Animations
    ├── netlify/
    │   └── functions/
    │       └── register.mjs           # Netlify Serverless Function
    └── property-blockchain-contracts/ # Smart Contract Source
```

---

## 🗃️ Database Schema (Neon PostgreSQL via Drizzle ORM)

```js
// users table
{
  id:            serial PRIMARY KEY,
  name:          text NOT NULL,
  email:         text NOT NULL,
  role:          text NOT NULL,         // "USER" | "GOVT_OFFICER" | "SURVEYOR" | "REGISTRAR" | "ADMIN"
  walletAddress: text UNIQUE NOT NULL,  // MetaMask Address (lowercase)
  phone:         text,
  bio:           text,
  location:      text,
  createdAt:     timestamp DEFAULT now()
}
```

---

## 🌐 REST API Endpoints (Backend)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health Check |
| `POST` | `/api/auth/register` | Register / Upsert User by Wallet |
| `GET` | `/api/auth/user/:address` | Get User Profile by Wallet Address |
| `PUT` | `/api/auth/update-profile` | Update User Bio, Phone, Location |

---

## ⛓️ Smart Contract Functions

The **PropertyRegistry** smart contract (ERC-721) handles all on-chain logic:

| Function | Who Can Call | Description |
|---|---|---|
| `requestRegistration(...)` | Citizen (USER) | Files a new property registration request |
| `verifyByGovt(id)` | Govt Officer | Phase 1 — Identity verification |
| `completeSurvey(id)` | Surveyor | Phase 2 — Field survey completion |
| `approveAndMint(id)` | Registrar | Phase 3 — Approve & mint ownership NFT |
| `rejectRequest(id)` | Registrar | Reject a registration request |
| `transferFrom(from, to, id)` | NFT Owner | Transfer / Gift property NFT |
| `buyProperty(id, name)` | Buyer (USER) | Purchase a listed property |
| `rentProperty(id)` | Tenant (USER) | Lease a listed property |
| `withdrawFunds()` | Admin | Withdraw accumulated contract ETH |
| `getAllRequests()` | Anyone | View all property requests |
| `walletToIdentity(addr)` | Anyone | Get Aadhaar hash linked to a wallet |

---

## 🔄 Property Registration Workflow (3-Phase Process)

```
Citizen submits → [Status: 0 - Pending]
        ↓
Govt Officer verifies identity → [Status: 1 - Govt Approved]
        ↓
Surveyor inspects field → [Status: 2 - Surveyed]
        ↓
Registrar approves + mints NFT → [Status: 3 - Verified & Minted ✅]
        
        (or) Registrar rejects → [Status: 4 - Rejected ❌]
```

---

## 👤 User Roles & Access Control

| Role | Dashboard | Permissions |
|---|---|---|
| **USER** (Citizen) | `/home`, `/registerAsset`, `/dashboard`, `/map`, `/profile`, `/giftOwnership` | Register property, search, buy, sell, transfer |
| **GOVT_OFFICER** | `/government-portal` | Review citizen submissions, verify Aadhaar hash, bond identity |
| **SURVEYOR** | `/admin` | Mark properties as field-surveyed (Phase 2) |
| **REGISTRAR** | `/admin` | Final approve + mint NFT, or reject (Phase 3) |
| **ADMIN** | `/admin` | Full access + withdraw ETH from contract treasury |

---

## 🗺️ Key Features Implemented

### 1. 🔐 MetaMask Authentication
- Login via MetaMask wallet injection (`window.ethereum`)
- Role-based route guards (`OfficerGuard`, `UserGuard`)
- Persistent session via `AuthContext` (React Context API)

### 2. 📝 Property Registration (RegisterAsset)
- Interactive **Leaflet map** with draggable markers
- **GPS auto-locate** via browser geolocation API
- **Address search** via Photon/Komoot geocoding API
- Satellite, Standard, and Terrain map views
- Upload land photos (up to 3) + deed PDF → IPFS
- Khasra number (official plot ID) input
- Smart contract call with 0.001 ETH registration fee

### 3. 🌍 Property Map Explorer (PropertyMap)
- Full-screen interactive map of all **verified & minted** properties
- Property boundary polygons rendered on map
- Filter by: All / For Sale / For Lease / Government
- Search by Khasra number or location
- Buy or Lease properties directly on-chain from map panel
- Custom color-coded markers (red=sale, purple=lease, green=private, amber=govt)

### 4. 🏛️ Government Portal
- Exclusive to `GOVT_OFFICER` role
- View all pending citizen registration requests
- Preview uploaded property images and legal deed PDFs
- See Aadhaar hash (linked identity) and Khasra number
- One-click **"Verify & Bond"** to call `verifyByGovt()` on contract

### 5. 🔧 Admin Panel (Multi-Role)
- **Surveyor Hub**: See govt-approved requests, mark as physically inspected
- **Registrar Authority**: Final approve & mint NFT, or reject
- **Super Admin**: View contract ETH treasury balance, execute fund withdrawal
- **Asset Lineage Tracing**: Full history table of all sales, leases, and mints — filterable by Property ID

### 6. 🎁 Gift Ownership (GiftOwnership)
- View all your verified property NFTs (fetched live from blockchain)
- Transfer NFT to any recipient wallet address
- Requires recipient's Aadhaar number and relationship
- Executes `transferFrom()` ERC-721 function on-chain
- Irreversible — shown with clear warning

### 7. 🔍 Property Search (Home)
- Search by **TX Hash** → verifies existence on blockchain
- Search by **IPFS URL** → fetches and displays full property metadata
- Shows: name, address, area, owner wallet, status, and property image

### 8. 👤 My Profile
- View and update: name, phone, bio, location
- Connected to backend REST API (Neon PostgreSQL)
- Wallet address displayed and copied

### 9. 📊 Owner Dashboard
- Portfolio view of all properties owned by connected wallet
- Shows registration status, IPFS links, and NFT token IDs

---

## 🔒 IPFS & Decentralized Storage

All property data is stored off-chain on **IPFS** via **Pinata**:
- Property images (JPG/PNG) → uploaded, IPFS CID returned
- Legal deed documents (PDF) → uploaded, IPFS CID returned
- Metadata JSON (name, address, area, images, document, GPS coords, timestamp) → pinned to IPFS
- The **IPFS metadata URL** is what gets stored permanently in the smart contract

---

## 🚀 Running the Project Locally

### Backend
```bash
cd backend
npm install
npm run dev          # Starts on http://localhost:5000
```

### Frontend
```bash
cd property-blockchain
npm install
npm run dev          # Starts on http://localhost:5173
```

### Environment Variables

**backend/.env**
```env
DATABASE_URL=your_neon_postgres_connection_string
PORT=5000
```

**property-blockchain/.env**
```env
VITE_BACKEND_URL=http://localhost:5000
VITE_PINATA_API_KEY=your_pinata_api_key
VITE_PINATA_SECRET=your_pinata_secret_key
```

---

## 🌐 Deployment

| Part | Platform | URL |
|---|---|---|
| Frontend | Netlify | https://propertixx.netlify.app |
| Frontend (alt) | Vercel | https://propertix-0-1.vercel.app |
| Backend | Vercel / Railway | Configured via `vercel.json` |
| Database | Neon PostgreSQL | Serverless cloud DB |
| Smart Contract | Sepolia Testnet | Address: `0x5FbDB2315678afecb367f032d93F642f64180aa3` |

---

## 🧠 Developer Notes

- The smart contract address is currently set to a **local Hardhat/Anvil address** (`0x5FbDB2315678afecb367f032d93F642f64180aa3`). For production use, deploy to Sepolia and update `contractConfig.js`.
- CORS is configured to allow all `.netlify.app` and `.vercel.app` subdomains for preview deployments.
- The `onConflictDoUpdate` pattern in the backend ensures user registration is idempotent — re-registering with the same wallet just updates the record.
- Aadhaar numbers are **hashed with crypto-js** before being sent to the blockchain — never stored in plain text.

---

*Documentation written for Propertix v0.2 — July 2026*
