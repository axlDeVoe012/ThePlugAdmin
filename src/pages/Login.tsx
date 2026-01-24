import React, { useState } from "react";
import { api } from "../api"; // ✅ CHANGE 1: Import the configured Axios instance
import "../../src/index.css";
import { useNavigate } from "react-router-dom";
import { showSuccess, showError } from "../components/Alert";
import { Eye, EyeOff } from "lucide-react";

export default function Login(){
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErr(null);
        try {
            // ✅ CHANGE 2: Use api.post (No hardcoded localhost URL)
            // The proxy handles the rest: /api/Auth/login -> AWS
            const res = await api.post("/Auth/login", { username, password });

            const token = res.data.token;
            const storeusername = res.data.username;
            
            sessionStorage.setItem("token", token);
            sessionStorage.setItem("username", storeusername);
            
            showSuccess("Login successful!");
            navigate("/articlelist");

        } catch (error: any) {
            console.error(error);
            // ✅ CHANGE 3: Better error handling for Axios responses
            const errorMessage = error.response?.data?.message || "Login failed";
            setErr(errorMessage); // Set local error state
            showError(errorMessage); // Show alert
        }
    }

    return(
        <div className="bg-linear-to-r/oklch from-green-950 to-black h-screen justify-items-center place-content-center">
            <h1 className="text-2xl font-bold font-sans text-white mb-4">Admin Login</h1>
            
            <form onSubmit={handleSubmit} className="w-[70%] max-w-lg h-auto flex flex-col gap-6 bg-white/35 border border-white/40 shadow-lg rounded-2xl p-8 text-white">
                <div className="flex flex-col">
                    <label className="mb-2 text-sm">Username</label>
                    <input 
                        value={username} 
                        onChange={e => setUsername(e.target.value)} 
                        required 
                        className="px-4 py-2 bg-transparent border border-white/30 rounded-4xl focus:outline-none focus:ring-2 focus:ring-white/40 placeholder-white/70" 
                    />
                </div>

                <div className="flex flex-col">
                    <label className="mb-2 text-sm">Password</label>
                    <div className="relative">
                        <input 
                            type={showPassword ? "text" : "password"} 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            required 
                            className="px-4 py-2 bg-transparent border border-white/30 rounded-4xl focus:outline-none focus:ring-2 focus:ring-white/40 placeholder-white/70 w-full pr-12"
                        />
                        <button 
                            type="button" 
                            onClick={() => setShowPassword(!showPassword)} 
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white"
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                    {/* Error message display */}
                    {err && <p className="text-red-400 text-sm mt-2 font-semibold">{err}</p>}
                </div>
                
                <button 
                    type="submit" 
                    className="mt-4 bg-white/30 hover:bg-emerald-950/30 text-white py-2 rounded-4xl shadow-lg transition cursor-pointer"
                >
                    Login
                </button>
            </form>
        </div>
    );
}