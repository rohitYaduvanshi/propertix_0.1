# 🏠 Propertix — Blockchain-Powered Property Registry

> A full-stack Web3 dApp to register, verify, and transfer property ownership on the Ethereum blockchain.  
> Built with **React + Vite**, **Express/Node.js**, **Solidity (Hardhat)**, and **NeonDB (PostgreSQL)**.

---

## 📁 Project Structure

```
Propertix/
├── backend/                          # Express REST API (deployed on Railway / Vercel)
│   ├── db/                           # Drizzle ORM schema
│   ├── routes/                       # API route handlers
│   ├── server.js                     # Main Express server entry point
│   ├── drizzle.config.js             # Drizzle ORM config
│   └── package.json
│
└── property-blockchain/              # React + Vite Frontend (deployed on Netlify)
    ├── src/
    │   ├── pages/                    # All app pages (Home, Dashboard, etc.)
    │   ├── components/               # Reusable UI components
    │   ├── blockchain/               # Ethers.js smart contract interaction
    │   ├── context/                  # React context (wallet, auth)
    │   └── utils/                    # Helper utilities
    ├── netlify/functions/            # Netlify serverless API functions
    ├── property-blockchain-contracts/ # Solidity smart contracts (Hardhat)
    │   ├── contracts/
    │   │   └── PropertyRegistry.sol  # Main smart contract
    │   └── hardhat.config.cjs
    └── package.json
```

---

## ⚙️ Prerequisites

Make sure you have the following installed before you begin:

| Tool | Version | Download |
|------|---------|----------|
| **Node.js** | v20.x (LTS) | https://nodejs.org |
| **npm** | v9+ (comes with Node) | — |
| **Git** | Latest | https://git-scm.com |
| **MetaMask** | Browser Extension | https://metamask.io |

---

## 🚀 Getting Started

### Step 1 — Clone the Repository

```bash
git clone https://github.com/rohitYaduvanshi/propertix_0.1.git
cd propertix_0.1
```

> ⚠️ The repo has two sub-projects inside: `backend/` and `property-blockchain/`. You need to set up **both** separately.

---

## 🖥️ Part 1 — Backend Setup (`/backend`)

### Step 2 — Install Dependencies

```bash
cd backend
npm install
```

### Step 3 — Configure Environment Variables

Create a `.env` file inside the `backend/` folder:

```bash
# backend/.env

DATABASE_URL=your_neon_postgres_connection_string
PORT=5000
```

> 💡 **How to get `DATABASE_URL`:**  
> 1. Go to [https://neon.tech](https://neon.tech) and create a free account.  
> 2. Create a new project and database.  
> 3. Copy the **Connection String** (starts with `postgresql://...`) and paste it as `DATABASE_URL`.

### Step 4 — Push the Database Schema

```bash
npx drizzle-kit push
```

This will create the required tables in your NeonDB automatically.

### Step 5 — Run the Backend Server

```bash
# Development mode (with auto-reload)
npm run dev

# OR Production mode
npm start
```

The backend will start at: **`http://localhost:5000`**

You should see: `✅ Propertix Backend running on http://localhost:5000`

---

## 🌐 Part 2 — Frontend Setup (`/property-blockchain`)

### Step 6 — Install Dependencies

```bash
cd ../property-blockchain
npm install
```

### Step 7 — Configure Environment Variables

Create a `.env` file inside the `property-blockchain/` folder:

```bash
# property-blockchain/.env

VITE_BACKEND_URL=http://localhost:5000
VITE_CONTRACT_ADDRESS=your_deployed_contract_address
VITE_EMAILJS_SERVICE_ID=your_emailjs_service_id
VITE_EMAILJS_TEMPLATE_ID=your_emailjs_template_id
VITE_EMAILJS_PUBLIC_KEY=your_emailjs_public_key
```

> 💡 **Notes:**
> - `VITE_BACKEND_URL` — Point this to your running backend. Use `http://localhost:5000` for local dev.
> - `VITE_CONTRACT_ADDRESS` — The address of the deployed `PropertyRegistry` contract (see Part 3 below).
> - `VITE_EMAILJS_*` — Optional. Get free keys from [https://www.emailjs.com](https://www.emailjs.com) for email notification features.

### Step 8 — Run the Frontend

```bash
npm run dev
```

The app will open at: **`http://localhost:5173`**

---

## 🔗 Part 3 — Smart Contract Setup (`/property-blockchain-contracts`)

> Skip this part if you just want to use the already-deployed contract. Only needed if you want to deploy your own instance.

### Step 9 — Install Contract Dependencies

```bash
cd property-blockchain-contracts
npm install
```

### Step 10 — Configure Contract Environment Variables

Create a `.env` file inside the `property-blockchain-contracts/` folder:

```bash
# property-blockchain-contracts/.env

SEPOLIA_URL=your_sepolia_rpc_url
PRIVATE_KEY=your_metamask_private_key_without_0x_prefix
```

> 💡 **How to get these:**
> - `SEPOLIA_URL` — Get a free RPC URL from [Alchemy](https://www.alchemy.com) or [Infura](https://infura.io). Select the **Ethereum Sepolia** testnet.
> - `PRIVATE_KEY` — Export your private key from MetaMask: `MetaMask → Account Details → Export Private Key`. **NEVER share this with anyone.**
> - You also need **Sepolia test ETH** in your wallet. Get it free from [https://sepoliafaucet.com](https://sepoliafaucet.com).

### Step 11 — Deploy the Smart Contract

```bash
# Deploy to Sepolia testnet
npx hardhat run scripts/deploy.js --network sepolia

# OR deploy to local Hardhat node (for testing)
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
```

After deployment, copy the **contract address** printed in the terminal and paste it as `VITE_CONTRACT_ADDRESS` in your frontend `.env`.

---

## 🦊 MetaMask Wallet Setup

1. Install the [MetaMask browser extension](https://metamask.io).
2. Create a new wallet or import an existing one.
3. Switch to the **Sepolia Test Network**:
   - Open MetaMask → Click on the network dropdown → **Add Network**
   - Or enable test networks: `Settings → Advanced → Show test networks → ON`
4. Get free Sepolia ETH from [https://sepoliafaucet.com](https://sepoliafaucet.com).
5. Visit the running app and click **Connect Wallet** to login.

---

## 🧪 Running Everything Together (Quick Reference)

Open **3 terminals** simultaneously:

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd property-blockchain
npm run dev

# Terminal 3 — (Optional) Local Hardhat Blockchain Node
cd property-blockchain/property-blockchain-contracts
npx hardhat node
```

Then open **`http://localhost:5173`** in your browser.

---

## 📦 Key Technologies Used

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS |
| Blockchain | Ethers.js v6, MetaMask |
| Smart Contracts | Solidity 0.8.20, Hardhat, OpenZeppelin |
| Backend API | Node.js, Express.js |
| Database | NeonDB (PostgreSQL), Drizzle ORM |
| Deployment (Frontend) | Netlify |
| Deployment (Backend) | Railway / Vercel |
| Maps | Leaflet.js, React-Leaflet |
| AI Features | TensorFlow.js, Tesseract.js (OCR) |
| Emails | EmailJS |

---

## 🔑 Environment Variables Summary

### `backend/.env`
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | NeonDB PostgreSQL connection string |
| `PORT` | Port to run the backend (default: 5000) |

### `property-blockchain/.env`
| Variable | Description |
|----------|-------------|
| `VITE_BACKEND_URL` | URL of the running backend API |
| `VITE_CONTRACT_ADDRESS` | Deployed PropertyRegistry contract address |
| `VITE_EMAILJS_SERVICE_ID` | EmailJS service ID (optional) |
| `VITE_EMAILJS_TEMPLATE_ID` | EmailJS template ID (optional) |
| `VITE_EMAILJS_PUBLIC_KEY` | EmailJS public key (optional) |

### `property-blockchain-contracts/.env`
| Variable | Description |
|----------|-------------|
| `SEPOLIA_URL` | Sepolia testnet RPC URL (from Alchemy/Infura) |
| `PRIVATE_KEY` | Your MetaMask wallet private key (keep secret!) |

---

## ⚠️ Important Security Notes

- **NEVER** commit your `.env` files to GitHub. They are already listed in `.gitignore`.
- **NEVER** share your MetaMask private key with anyone.
- Use test wallets with **Sepolia test ETH** (not real ETH) for development.

---

## 🐛 Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| `Cannot connect to database` | Check your `DATABASE_URL` in `backend/.env` is correct |
| `MetaMask not detected` | Install the MetaMask browser extension and refresh |
| `Wrong network` | Switch MetaMask to the **Sepolia** testnet |
| `Contract call failed` | Ensure `VITE_CONTRACT_ADDRESS` matches the deployed contract |
| `CORS error` | Make sure the backend is running and `VITE_BACKEND_URL` is correct |
| `npm install` fails | Ensure you are using **Node.js v20** (`node --version`) |

---

## 📜 License

This project is licensed under the **ISC License**.

---

## 🙋‍♂️ Author

Made with ❤️ by **Rohit Yaduvanshi**  
GitHub: [@rohitYaduvanshi](https://github.com/rohitYaduvanshi)
