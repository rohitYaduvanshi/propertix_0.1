import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Login from "./pages/Login.jsx";
import Home from "./pages/Home.jsx";
import Blockchain from "./pages/RegisterAsset.jsx";
import About from "./pages/About.jsx";
import Contact from "./pages/Contact.jsx";
import Footer from "./components/Footer.jsx";
import AdminPanel from "./pages/AdminPanel.jsx";
import PropertyMap from "./pages/PropertyMap.jsx";
import MyProfile from './pages/MyProfile';
import OwnerDashboard from './pages/OwnerDashboard'; 
import { useAuth } from "./context/AuthContext.jsx";
import Register from "./pages/Registersys.jsx"; 
import GovernmentPortal from "./pages/GovernmentPortal.jsx";

// --- 🛡️ GUARDS LOGIC ---

const OfficerGuard = ({ children, requiredRole }) => {
  const { isUserLoggedIn, userRole } = useAuth();
  
  if (!isUserLoggedIn) return <Navigate to="/login" replace />;
  
  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/admin" replace />; 
  }

  const isAnyOfficer = ["GOVT_OFFICER", "SURVEYOR", "REGISTRAR", "ADMIN"].includes(userRole);
  if (!isAnyOfficer) return <Navigate to="/home" replace />;
  
  return children;
};

const UserGuard = ({ children }) => {
  const { isUserLoggedIn, userRole } = useAuth();
  
  if (!isUserLoggedIn) return <Navigate to="/login" replace />;
  if (userRole !== "USER") return <Navigate to="/admin" replace />;
  
  return children;
};

// --- 🖥️ MAIN APP ---
const App = () => {
  const { isUserLoggedIn, userRole, loading } = useAuth(); 

  // ✅ FIX: Using your requested Loading UI
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500"></div>
        <span className="ml-4 text-xl font-bold">Connecting to Propertix...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-white w-full">
      <Routes>
        
        {/* 🔓 PUBLIC ROUTES */}
        <Route 
          path="/login" 
          element={
            isUserLoggedIn 
              ? <Navigate to={userRole === "USER" ? "/home" : (userRole === "GOVT_OFFICER" ? "/government-portal" : "/admin")} replace /> 
              : <Login />
          } 
        />
        <Route path="/register" element={<Register />} />
        
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/about" element={<Layout><About /></Layout>} />
        <Route path="/contact" element={<Layout><Contact /></Layout>} />

        {/* 🏛️ GOVERNMENT OFFICER ROUTE */}
        <Route 
          path="/government-portal" 
          element={
            <OfficerGuard requiredRole="GOVT_OFFICER">
               <Layout><GovernmentPortal /></Layout>
            </OfficerGuard>
          } 
        />

        {/* 🛠️ ADMIN/OFFICER ROUTES (Surveyor & Registrar) */}
        <Route path="/admin" element={<OfficerGuard><Layout><AdminPanel /></Layout></OfficerGuard>} />
        
        {/* 👤 CITIZEN PROTECTED ROUTES */}
        <Route path="/home" element={<UserGuard><Layout><Home /></Layout></UserGuard>} />
        <Route path="/registerAsset" element={<UserGuard><Layout><Blockchain /></Layout></UserGuard>} />
        <Route path="/map" element={<UserGuard><Layout><PropertyMap /></Layout></UserGuard>} />
        <Route path="/dashboard" element={<UserGuard><Layout><OwnerDashboard /></Layout></UserGuard>} />
        <Route path="/profile" element={<UserGuard><Layout><MyProfile /></Layout></UserGuard>} />

        {/* 🚨 404 CATCH-ALL */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

// --- 📐 LAYOUT ENGINE ---
const Layout = ({ children }) => (
  <div className="flex flex-col flex-1 w-full min-h-screen bg-[#050505]">
    <Navbar />
    <main className="flex-1 flex flex-col w-full relative">
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none"></div>
        <div className="relative z-10 flex-1">
            {children}
        </div>
    </main>
    <div className="mt-auto w-full border-t border-white/5">
        <Footer />
    </div>
  </div>
);

export default App;