import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { api } from "../api";
import { useNavigate, useParams } from "react-router-dom";
import { showSuccess, showError, showConfirm } from "../components/Alert";

export default function EditUser() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, [id]);

  const loadUser = async () => {
    if (!id) return;

    try {
      const res = await api.get(`/Admins/get-userById?id=${id}`);
      const user = res.data;

      // Update form fields with user data
      setUsername(user.username || "");
      setFullName(user.fullName || "");
      setEmail(user.email || "");
      setPhoneNumber(user.phoneNumber || "");
    } catch (err: any) {
      console.error(err);
      showError("Failed to load user details");
    } finally {
      setLoading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    const confirmed = await showConfirm("Are you sure you want to update this user?");
    if (!confirmed) return;

    setBusy(true);
    try {
      const data: any = { fullName, email, phoneNumber };
      if (password) data.password = password;

      await api.put(`/Admins/update-user?id=${id}`, data);
      showSuccess("User updated successfully!");
      navigate("/users");
    } catch (err: any) {
      console.error(err);
      showError(err.response?.data?.message || "Failed to update user");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-emerald-950 to-black flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-white text-xl animate-pulse">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-emerald-950 to-black flex flex-col">
      <Navbar />

      <div className="flex-grow flex flex-col items-center justify-center p-4">
        <h2 className="text-center text-3xl font-bold text-white mb-6">
          Edit User
        </h2>

        <form
          onSubmit={submit}
          className="w-full sm:w-[80%] md:w-3xl lg:w-5xl h-auto flex flex-col gap-6 bg-white/35 border border-white/40 shadow-lg rounded-2xl p-6 sm:p-8 text-white backdrop-blur-sm"
        >
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Username</label>
            <input
              type="text"
              value={username}
              disabled
              className="px-3 py-2 rounded-lg bg-black/30 border border-white/30 cursor-not-allowed"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">
              New Password (leave blank to keep current)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="px-3 py-2 rounded-lg bg-black/30 border border-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-950/30 placeholder-white/60"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="px-3 py-2 rounded-lg bg-black/30 border border-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-950/30 placeholder-white/60"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="px-3 py-2 rounded-lg bg-black/30 border border-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-950/30 placeholder-white/60"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Phone Number</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              className="px-3 py-2 rounded-lg bg-black/30 border border-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-950/30 placeholder-white/60"
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="mt-4 bg-emerald-950 hover:bg-white/20 disabled:bg-gray-400 text-white py-2 rounded-xl shadow-md transition-all duration-300"
          >
            {busy ? "Updating..." : "Update"}
          </button>
        </form>
      </div>
    </div>
  );
}
