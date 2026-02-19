
# Property Management using Blockchain

A modern Web3 dApp to manage and verify property records using blockchain.  
User MetaMask wallet se login karta hai, property hash search kar sakta hai, aur future me smart contract ke through nayi properties add ki ja sakengi.

***

## Features

- Fancy dark UI with React + Tailwind CSS  
- Responsive navbar with logo and protected routes  
- MetaMask wallet login (no username / password)  
- Wallet address based authentication and route protection  
- Home page par property hash search UI (abhi dummy data, baad me contract se connect hoga)  
- “Latest Blocks” style fancy card with hover effects  
- Basic informational pages: Blockchain, About, Contact

***

## Tech Stack

- **Frontend**: React (Vite)  
- **Styling**: Tailwind CSS  
- **Routing**: React Router v6  
- **Web3**: MetaMask + ethers.js (BrowserProvider)  

***

## Project Setup

```bash
# 1. Vite React project create karo
npm create vite@latest property-blockchain -- --template react

cd property-blockchain

# 2. Tailwind CSS install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# 3. App dependencies
npm install react-router-dom ethers
```

Tailwind configuration:

- `tailwind.config.js`:

```js
content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
```

- `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

***

## Folder Structure (src)

```text
src/
  main.jsx
  App.jsx
  index.css

  context/
    AuthContext.jsx

  components/
    Navbar.jsx
    ProtectedRoute.jsx

  pages/
    Login.jsx
    Home.jsx
    Blockchain.jsx
    About.jsx
    Contact.jsx

  assets/
    logo.png
```

***

## Authentication (Wallet Based)

Auth humne React Context se implement kiya hai.  
Idea: agar wallet address present hai to user logged‑in maana jata hai.

### AuthContext.jsx

- Global state store karta hai:

  - `walletAddress`  
  - `isAuthenticated` (true/false)  
  - `connectWallet()` – MetaMask se connect karne ke liye  
  - `disconnectWallet()` – state clear karne ke liye  

- MetaMask detection:

  - `window.ethereum` check karke pata chalta hai extension installed hai ya nahi.  
  - Agar nahi hai to login screen pe warning message dikhta hai.

- Wallet connect flow:

  - `BrowserProvider(window.ethereum)` banaya.  
  - `provider.send("eth_requestAccounts", [])` se MetaMask popup open hota hai.  
  - User approve karta hai to first account `walletAddress` state me store ho jata hai.  

- `accountsChanged` event:

  - Agar user MetaMask me account change / disconnect karta hai to React state automatically update ho jati hai (address change ya null).

AuthContext ko `AuthProvider` ke through `main.jsx` me pura app ke around wrap kiya gaya hai.

***

## Routing & Protection

React Router v6 use hua hai.

- `main.jsx`:

  - `BrowserRouter` + `AuthProvider` ke andar `<App />`.

- `App.jsx`:

  - Routes:
    - `/login` → `Login` page  
    - `/` → `Home` (protected)  
    - `/blockchain` → `Blockchain` (protected)  
    - `/about` → `About` (protected)  
    - `/contact` → `Contact` (protected)  
  - Sab protected routes `ProtectedRoute` component se wrap hai.

### ProtectedRoute.jsx

- Context se `isAuthenticated` read karta hai.  
- Agar false ho to `<Navigate to="/login" />` return karta hai.  
- Agar true ho to children component render karta hai.

Isse bina wallet connect kiye koi user Home/Blockchain/About/Contact open nahi kar sakta.

***

## Login Page (Connect Wallet)

`pages/Login.jsx`:

- Dark gradient background, center me glassmorphism card.  
- Heading + short description: “Login with your Ethereum wallet…”.  
- Agar MetaMask detect nahi hota to red warning text show: “MetaMask extension not detected…”.  
- Button: **“Connect MetaMask Wallet”**

Button logic:

- `connectWallet()` (AuthContext se) call karta hai.  
- Address milte hi `useEffect` ke through `/` (Home) par redirect kar deta hai.  
- Agar already connected ho to button text “Connected” ho sakta hai, niche address show.

***

## Navbar

`components/Navbar.jsx`:

- Left: app logo (`logo.png`) image (circle nahi, original aspect ratio with `h-10 w-auto`).  
- Center (desktop): links – Home, Blockchain, About, Contact.  
- Right:

  - Agar wallet connected:
    - Short address badge (`0x1234...abcd`).  
    - “Disconnect” button jo `disconnectWallet()` call karta hai aur `/login` pe le jata hai.  
  - Agar wallet disconnected:
    - “Connect Wallet” button jo `connectWallet()` trigger karta hai.

Navbar transparent black + blur background ke saath top pe fixed‑style feel deta hai.

***

## Home Page (Hash Search + Latest Blocks Card)

`pages/Home.jsx`:

- Layout:

  - Left side: hero text + hash search card.  
  - Right side (desktop only): “Latest Blocks” style fancy card.

### Hash Search UI

Abhi ke liye dummy data:

- `demoHashes = ["0x123", "0xabc", "0x999", ...]`  
- User input field: “Enter property hash (e.g. 0x123…)”  
- “Search” button click par:

  - `exists = demoHashes.includes(hash.trim())`  
  - Agar `exists` true → green message: “Property exists on blockchain for this hash.”  
  - Nahi to red message: “No property record found for this hash.”

Later yahi logic smart contract ke `checkProperty(hash)` function se replace hoga.

### Latest Blocks Card

Right side card ko glassmorphism + gradient glow se design kiya:

- Outer `group` div ke peeche gradient blur glow background.  
- Inner card:

  - Rounded corners, semi‑transparent dark background, border + heavy shadow.  
  - Top row: “Latest Blocks” + small `LIVE` badge (green pulsing dot).  
  - List of `BlockRow` components.

`BlockRow`:

- Thoda bada row with:

  - Left: “Block #XXXX” + “Hash: 0x…”.  
  - Right: “confirmed” status badge.  
- Hover effect:

  - Border color amber me shift, background thoda warm, row thoda upar lift, smooth transition.

***

## Other Pages

- **Blockchain.jsx**:  
  - Simple heading + description: yaha future me “Add Property” form, wallet connect UI ke through transactions, block listing etc. add honge.

- **About.jsx**:  
  - Short text explaining concept: blockchain‑based tamper‑proof property records, verification via hash.

- **Contact.jsx**:  
  - Placeholder text where team info, GitHub repo link, email etc. add kiye ja sakte hain (hackathon/demo ke liye).

***

## Current Status & Next Plans

Ab tak:

- Full React + Tailwind responsive UI ready.  
- Wallet‑based authentication MetaMask + ethers.js se working.  
- Protected routes + navigation flow complete.  
- Hash search UI and visual “Latest Blocks” card implemented (dummy data).

Next steps (planned):

- Solidity smart contract for property registry (`addProperty`, `checkProperty`).  
- Hardhat/Foundry se local/testnet deploy.  
- React se real contract calls (`addProperty(hash)` to add block, `checkProperty(hash)` to verify).  
- Optionally property details + IPFS integration for documents.

---
#command
cd property-blockchain-contracts
npx hardhat node

cd property-blockchain-contracts
npx hardhat run scripts/deploy.cjs --network localhost

npm run dev



#Update

Sale---> Wallet disconnect
All --> same 

