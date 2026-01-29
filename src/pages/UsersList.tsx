import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar"; // Imported Navbar
import { api } from "../api";
import { showSuccess, showError, showConfirm } from "../components/Alert";

// Matches C# AdminListItem
interface AdminUser {
  id: number;
  username: string;
  fullName: string;
  email: string;
  phoneNumber: string;
}

export default function UsersList() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get("/Admins/get-allUsers");
      if (response.data && response.data.admins) {
        setUsers(response.data.admins);
      }
    } catch (err: any) {
      console.error(err);
      showError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await showConfirm("Are you sure you want to delete this admin?");
    if (!confirmed) return;

    try {
      await api.delete(`/Admins/delete-user?Id=${id}`);
      showSuccess("User deleted successfully");
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err: any) {
      console.error(err);
      showError("Failed to delete user");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 to-black text-white">
      <Navbar />

      {/* MAIN CONTENT WRAPPER */}
      <div className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">System Users</h1>
              <p className="text-gray-400 text-sm mt-1">Manage admin access</p>
            </div>
            <Link
              to="/newuser"
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-xl shadow-md transition"
            >
              + Add Admin
            </Link>
          </div>

          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-12 bg-white/10 rounded w-full"></div>
              <div className="h-64 bg-white/5 rounded w-full"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-gray-400">No users found.</p>
            </div>
          ) : (
            <>
              {/* MOBILE CARDS */}
              <div className="grid grid-cols-1 gap-4 md:hidden">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="bg-white/10 border border-white/10 rounded-xl p-5 shadow-lg"
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-lg text-blue-200">{user.fullName}</h3>
                      <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                        @{user.username}
                      </span>
                    </div>
                    <div className="mt-3 text-sm text-gray-300 space-y-1">
                      <p>{user.email}</p>
                      <p>{user.phoneNumber}</p>
                    </div>
                    <div className="flex gap-3 mt-4 pt-3 border-t border-white/10">
                      <Link
                        to={`/edit-user/${user.id}`}
                        className="flex-1 text-center bg-white/5 py-2 rounded text-sm hover:bg-white/10 transition"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="flex-1 text-center bg-red-500/20 text-red-300 py-2 rounded text-sm hover:bg-red-500/30 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* DESKTOP TABLE */}
              <div className="hidden md:block overflow-hidden rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-white/10 text-gray-300 uppercase text-xs font-semibold">
                    <tr>
                      <th className="px-6 py-4">ID</th>
                      <th className="px-6 py-4">Full Name</th>
                      <th className="px-6 py-4">Username</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Phone</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 text-sm">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-white/5 transition">
                        <td className="px-6 py-4 text-gray-400">#{user.id}</td>
                        <td className="px-6 py-4 font-medium text-white">{user.fullName}</td>
                        <td className="px-6 py-4 text-blue-300">@{user.username}</td>
                        <td className="px-6 py-4 text-gray-300">{user.email}</td>
                        <td className="px-6 py-4 text-gray-300">{user.phoneNumber}</td>
                        <td className="px-6 py-4 text-right space-x-4">
                          <Link
                            to={`/edit-user/${user.id}`}
                            className="text-green-400 hover:text-green-300 font-medium"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="text-red-400 hover:text-red-300 font-medium"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}