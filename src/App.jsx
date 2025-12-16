import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Login from "./pages/Login.jsx";
import Home from "./pages/Home.jsx";
import Blockchain from "./pages/Blockchain.jsx";
import About from "./pages/About.jsx";
import Contact from "./pages/Contact.jsx";
import { useAuth } from "./context/AuthContext.jsx";

const App = () => {
  const { isAuthenticated } = useAuth();

  // Login ke baad /login pe wapas aaye to redirect
  const LoginWrapper = () =>
    isAuthenticated ? <Navigate to="/" replace /> : <Login />;

  return (
    <div className="min-h-screen bg-black text-white">
      <Routes>
        <Route path="/login" element={<LoginWrapper />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <Home />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/blockchain"
          element={
            <ProtectedRoute>
              <Layout>
                <Blockchain />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/about"
          element={
            <ProtectedRoute>
              <Layout>
                <About />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/contact"
          element={
            <ProtectedRoute>
              <Layout>
                <Contact />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-black via-zinc-900 to-black">
      <Navbar />
      <main className="flex-1">{children}</main>
    </div>
  );
};

export default App;
