import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { BrowserProvider, Contract } from "ethers";
import { PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI } from "../blockchain/contractConfig";

const Register = () => {
  const navigate = useNavigate();
  
  // States
  const [formData, setFormData] = useState({ name: "", email: "", role: "USER", secretCode: "" });
  const [loading, setLoading] = useState(false);

  // --- REGISTER HANDLE (Connect Wallet -> Select Account -> Register) ---
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!window.ethereum) {
        alert("Please install MetaMask!");
        setLoading(false);
        return;
      }

      // 1. Force Wallet Selection (User picks specific account NOW)
      // Isse pehle se connected account hat jayega aur user naya account chun sakega
      await window.ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });

      // 2. Get Provider & Signer after selection
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const connectedAddress = signer.address;

      console.log(`Selected Wallet: ${connectedAddress}`);
      console.log(`Registering as: ${formData.role}`);

      // 3. Validation Check
      if (formData.role !== "USER" && !formData.secretCode) {
         setLoading(false);
         return alert(`Please enter the Secret Code for ${formData.role}`);
      }

      // 4. Contract Instance
      const contract = new Contract(PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI, signer);

      // 🛑 DEBUG CHECK: Agar ABI purana hai to yahi pakad lo
      if (typeof contract.registerUser !== "function") {
          alert("CRITICAL ERROR: 'registerUser' function not found in ABI!\nPlease update src/blockchain/contractConfig.js with the latest ABI.");
          setLoading(false);
          return;
      }

      // 5. Call Smart Contract
      // Note: Hum 4 arguments bhej rahe hain (Name, Email, Role, SecretCode)
      const tx = await contract.registerUser(
          formData.name, 
          formData.email, 
          formData.role, 
          formData.secretCode || "N/A" // Agar User hai to dummy text bhej do
      );
      
      console.log("Transaction Sent:", tx.hash);
      await tx.wait(); // Blockchain confirmation ka wait

      alert(`✅ Registration Successful for ${formData.role}! Redirecting to Login...`);
      navigate("/login");

    } catch (error) {
      console.error(error);
      
      // Error Handling
      if (error.code === 4001) {
         alert("❌ You cancelled the wallet selection.");
      } else if (error.reason) {
        alert("❌ Blockchain Error: " + error.reason);
      } else {
        alert("❌ Failed: " + (error.message || "Unknown Error"));
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-[#0a0a0a] border border-white/10 p-8 rounded-3xl w-full max-w-md relative overflow-hidden shadow-2xl">
        
        <h1 className="text-3xl font-bold text-white mb-2 text-center">Create Account</h1>
        <p className="text-gray-500 text-xs text-center mb-6">Select your role, then connect wallet</p>

        <form onSubmit={handleRegister} className="space-y-4">
          
          <div>
            <label className="text-gray-500 text-[10px] font-bold tracking-widest uppercase ml-1">Full Name</label>
            <input type="text" required onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-black border border-zinc-800 text-white p-3 rounded-xl focus:border-cyan-500 outline-none transition mt-1" />
          </div>

          <div>
            <label className="text-gray-500 text-[10px] font-bold tracking-widest uppercase ml-1">Email</label>
            <input type="email" required onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-black border border-zinc-800 text-white p-3 rounded-xl focus:border-cyan-500 outline-none transition mt-1" />
          </div>

          <div>
            <label className="text-gray-500 text-[10px] font-bold tracking-widest uppercase ml-1">Select Role</label>
            <div className="grid grid-cols-3 gap-2 mt-2">
                {['USER', 'SURVEYOR', 'REGISTRAR'].map(role => (
                    <button 
                        key={role}
                        type="button"
                        onClick={() => setFormData({...formData, role: role, secretCode: ""})} 
                        className={`py-3 px-2 text-[10px] sm:text-xs font-bold rounded-xl border transition-all duration-200 ${
                            formData.role === role 
                            ? 'bg-cyan-600 border-cyan-500 text-white shadow-lg' 
                            : 'bg-zinc-900 border-zinc-800 text-gray-500 hover:bg-zinc-800'
                        }`}
                    >
                        {role}
                    </button>
                ))}
            </div>
          </div>

          {/* Secret Code Input (Sirf Officers ke liye) */}
          {formData.role !== "USER" && (
              <div className="animate-fade-in-down">
                <label className="text-red-400 text-[10px] font-bold tracking-widest uppercase ml-1 flex justify-between">
                    <span>Secret Code Required</span>
                    <span className="opacity-50">(Ask Admin)</span>
                </label>
                <input 
                    type="password" 
                    required 
                    onChange={(e) => setFormData({...formData, secretCode: e.target.value})} 
                    className="w-full bg-red-900/10 border border-red-500/30 text-white p-3 rounded-xl focus:border-red-500 outline-none transition mt-1 placeholder-red-500/30" 
                    placeholder={`Enter code for ${formData.role}`}
                />
              </div>
          )}

          {/* Main Action Button */}
          <button 
            type="submit"
            disabled={loading} 
            className={`w-full font-bold py-3.5 rounded-xl mt-6 transition-all flex items-center justify-center gap-2 ${
                loading 
                ? "bg-zinc-900 text-zinc-600 cursor-not-allowed border border-zinc-800" 
                : "bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:shadow-xl hover:shadow-cyan-500/20 active:scale-95"
            }`}
          >
            {loading ? (
                <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Processing...
                </>
            ) : (
                <>Connect Wallet & Register</>
            )}
          </button>

        </form>

        <p className="text-center text-gray-500 text-xs mt-6">
          Already have an account? <Link to="/login" className="text-cyan-400 font-bold hover:underline">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;