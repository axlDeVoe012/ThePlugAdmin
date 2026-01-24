import { useState } from "react";
import Navbar from "../components/Navbar"; // Imported Navbar
import { api } from "../api";
import { useNavigate } from "react-router-dom";
import { showSuccess, showError } from "../components/Alert";

export default function NewUser() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/Admins/add-admin", {
        username,
        password,
        fullName,
        email,
        phoneNumber,
      });
      showSuccess("User created successfully!");
      navigate("/users");
    } catch (err: any) {
      console.error(err);
      showError(err.response?.data?.message || "Failed to create user");
    } finally {
      setBusy(false);
    }
  };

  return (
    // Changed to flex-col to stack Navbar and content
    <div className="min-h-screen bg-gradient-to-br from-green-950 to-black text-white flex flex-col">
      <Navbar />

      {/* Main Content Wrapper - Centered */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md mx-auto bg-white/5 p-8 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-sm">
          <h1 className="text-3xl font-bold mb-8 text-center text-green-400">New User</h1>
          <form onSubmit={submit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-2 bg-black/40 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 bg-black/40 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-4 py-2 bg-black/40 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 bg-black/40 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Phone Number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                className="w-full px-4 py-2 bg-black/40 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-gray-500"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-green-900/50 mt-4"
            >
              {busy ? "Creating..." : "Create User"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}