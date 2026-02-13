import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Login from "./pages/Login.jsx";
import Home from "./pages/Home.jsx";
import Blockchain from "./pages/Blockchain.jsx";
import About from "./pages/About.jsx";
import Contact from "./pages/Contact.jsx";
import Footer from "./components/Footer.jsx";
import AdminPanel from "./pages/AdminPanel.jsx";
import PropertyMap from "./pages/PropertyMap.jsx";
import MyProfile from './pages/MyProfile';
import OwnerDashboard from './pages/OwnerDashboard'; 
import { useAuth } from "./context/AuthContext.jsx";
import Register from "./pages/Registersys.jsx"; 

// --- GUARDS ---
const OfficerGuard = ({ children }) => {
  const { isUserLoggedIn, isOfficer } = useAuth();
  if (!isUserLoggedIn) return <Navigate to="/login" replace />;
  if (!isOfficer) return <Navigate to="/home" replace />;
  return children;
};

const UserGuard = ({ children }) => {
  const { isUserLoggedIn, isOfficer } = useAuth();
  if (!isUserLoggedIn) return <Navigate to="/login" replace />;
  if (isOfficer) return <Navigate to="/admin" replace />;
  return children;
};

// --- MAIN APP ---
const App = () => {
  const { isUserLoggedIn, isOfficer, loading } = useAuth(); 

  // 🛑 FIX: Agar Loading hai, to Router ko mat chalne do
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500"></div>
        <span className="ml-4 text-xl font-bold">Connecting to Blockchain...</span>
      </div>
    );
  }

  return (
    // ✅ FIX 1: Outer div ko `flex flex-col min-h-screen` diya gaya hai
    <div className="flex flex-col min-h-screen bg-black text-white w-full">
      <Routes>
        
        {/* PUBLIC ROUTES */}
        <Route 
          path="/login" 
          element={
            isUserLoggedIn 
              ? <Navigate to={isOfficer ? "/admin" : "/home"} replace /> 
              : <Login />
          } 
        />
        
        <Route path="/register" element={<Register />} />
        
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/about" element={<Layout><About /></Layout>} />
        <Route path="/contact" element={<Layout><Contact /></Layout>} />

        {/* PROTECTED ROUTES */}
        <Route path="/admin" element={<OfficerGuard><Layout><AdminPanel /></Layout></OfficerGuard>} />
        
        <Route path="/blockchain" element={<UserGuard><Layout><Blockchain /></Layout></UserGuard>} />
        <Route path="/map" element={<UserGuard><Layout><PropertyMap /></Layout></UserGuard>} />
        <Route path="/dashboard" element={<UserGuard><Layout><OwnerDashboard /></Layout></UserGuard>} />
        <Route path="/profile" element={<UserGuard><Layout><MyProfile /></Layout></UserGuard>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

// ✅ FIX 2: Layout me 'flex-1' aur 'mt-auto' ka combination use kiya hai (Footer bottom me fix karne ke liye)
const Layout = ({ children }) => (
  <div className="flex flex-col flex-1 w-full min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black">
    <Navbar />
    {/* main tag 'flex-1' lega taaki bachi hui saari jagah ye bhar le */}
    <main className="flex-1 flex flex-col w-full">
        {children}
    </main>
    {/* mt-auto (Margin-top: auto) Footer ko forcefully niche dhakel dega */}
    <div className="mt-auto w-full">
        <Footer />
    </div>
  </div>
);

export default App;