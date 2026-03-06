import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { isWalletConnected } = useAuth();

  // 1. Agar Wallet hi connect nahi hai, toh Login pe bhejo
  if (!isWalletConnected) {
    return <Navigate to="/login" replace />;
  }

  // ✅ FIX: Maine yahan se 'isOfficer' wala check HATA DIYA hai.
  // Ab ye User, Admin, Surveyor sabko andar aane dega.
  // Security ab 'App.jsx' mein AdminGuard sambhal raha hai.

  return children;
};

export default ProtectedRoute;