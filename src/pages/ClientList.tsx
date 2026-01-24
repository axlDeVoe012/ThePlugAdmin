import React, { useEffect, useState, useMemo, useCallback } from "react";
import Navbar from "../components/Navbar";
import { api } from "../api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Swal from "sweetalert2";
import { HubConnectionBuilder } from "@microsoft/signalr"; // 1. Import SignalR

// Define Base URL for SignalR (Adjust port if necessary)
const API_BASE = import.meta.env.VITE_API_BASE;

// --- Interfaces ---
interface Client {
    clientId: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    gender: string;
    dateOfBirth: string | null;
    address: string;
    city: string;
    joinDate: string;
    isDeleted: boolean;
}

export default function ClientList() {
    // --- State ---
    const [allClients, setAllClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    // Filter State
    const [minJoinDate, setMinJoinDate] = useState<string>('');
    const [maxAge, setMaxAge] = useState<string>('');
    const [minAge, setMinAge] = useState<string>('');

    // Edit Modal State
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [isSaving, setIsSaving] = useState<boolean>(false);

    // --- Helpers ---
    const calculateAge = (dobString: string): number | null => {
        if (!dobString) return null;
        try {
            const birthDate = new Date(dobString);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDifference = today.getMonth() - birthDate.getMonth();
            if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            return age;
        } catch {
            return null;
        }
    };

    const formatDateForInput = (dateString: string | null) => {
        if (!dateString) return "";
        return new Date(dateString).toISOString().split('T')[0];
    };

    const formatDateForDisplay = (dateString: string | null) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // --- API Calls ---
    const fetchAllClients = useCallback(async () => {
        setLoading(true);
        try {
            const timestamp = new Date().getTime();
            const res = await api.get(`/Clients/get-allClients?cb=${timestamp}`);

            if (res.data && res.data.status && Array.isArray(res.data.clients)) {
                setAllClients(res.data.clients);
            } else {
                setAllClients([]);
            }
        } catch (e) {
            console.error("Fetch error:", e);
            setAllClients([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // --- 2. SIGNALR INTEGRATION ---
    useEffect(() => {
        // A. Initial Fetch
        fetchAllClients();

        // B. Setup Connection
        const connection = new HubConnectionBuilder()
            .withUrl(`${API_BASE}/hubs/notifications`) // Ensure this matches Program.cs
            .withAutomaticReconnect()
            .build();

        // C. Register Event Handlers
        connection.on("ClientCreated", (newClient: Client) => {
            console.log("Real-time: Client Created");
            setAllClients(prev => [newClient, ...prev]);
        });

        connection.on("ClientUpdated", (updatedClient: Client) => {
            console.log("Real-time: Client Updated");
            setAllClients(prev => prev.map(c =>
                c.clientId === updatedClient.clientId ? updatedClient : c
            ));
        });

        connection.on("ClientDeleted", (deletedId: number) => {
            console.log("Real-time: Client Deleted");
            setAllClients(prev => prev.filter(c => c.clientId !== deletedId));
        });

        // D. Start Connection
        connection.start()
            .then(() => console.log("Connected to SignalR for Clients"))
            .catch(err => console.error("SignalR Connection Error: ", err));

        // E. Cleanup
        return () => {
            connection.stop();
        };

    }, [fetchAllClients]);

    // --- DELETE ---
    const deleteClient = async (id: number) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this delete action!",
            icon: 'warning',
            showCancelButton: true,
            background: '#1f2937',
            color: '#ecfdf5',
            confirmButtonColor: '#d33',
            cancelButtonColor: '#059669',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/Clients/delete-client?id=${id}`);
                // Note: We don't technically need setAllClients here anymore because SignalR will handle it,
                // but keeping it makes the UI feel instant for the user who clicked delete.
                setAllClients(prev => prev.filter(c => c.clientId !== id));

                Swal.fire({
                    title: 'Deleted!',
                    text: 'The client has been removed.',
                    icon: 'success',
                    background: '#1f2937',
                    color: '#ecfdf5',
                    confirmButtonColor: '#059669'
                });
            } catch (err) {
                console.error("Delete error:", err);
                Swal.fire({
                    title: 'Error!',
                    text: 'Failed to delete client.',
                    icon: 'error',
                    background: '#1f2937',
                    color: '#ecfdf5'
                });
            }
        }
    };

    // --- UPDATE ---
    const handleUpdateClient = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingClient) return;

        const result = await Swal.fire({
            title: 'Save Changes?',
            text: `Are you sure you want to update details for ${editingClient.firstName}?`,
            icon: 'question',
            showCancelButton: true,
            background: '#1f2937',
            color: '#ecfdf5',
            confirmButtonColor: '#059669',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, save changes'
        });

        if (result.isConfirmed) {
            setIsSaving(true);
            try {
                await api.put(`/Clients/update-client?id=${editingClient.clientId}`, editingClient);
                
                // Optimistic update (SignalR will also broadcast this)
                setAllClients(prev => prev.map(c =>
                    c.clientId === editingClient.clientId ? editingClient : c
                ));

                setEditingClient(null);

                Swal.fire({
                    title: 'Updated!',
                    text: 'Client details have been saved successfully.',
                    icon: 'success',
                    background: '#1f2937',
                    color: '#ecfdf5',
                    confirmButtonColor: '#059669',
                    timer: 2000,
                    showConfirmButton: false
                });

            } catch (err) {
                console.error("Update error:", err);
                Swal.fire({
                    title: 'Error!',
                    text: 'Failed to update client. Please try again.',
                    icon: 'error',
                    background: '#1f2937',
                    color: '#ecfdf5'
                });
            } finally {
                setIsSaving(false);
            }
        }
    };

    // --- Filter Logic ---
    const filteredClients = useMemo(() => {
        let currentClients = allClients;

        if (minJoinDate) {
            const minDate = new Date(minJoinDate);
            currentClients = currentClients.filter(client => {
                const clientJoinDate = new Date(client.joinDate);
                return clientJoinDate >= minDate;
            });
        }

        const min = minAge ? parseInt(minAge, 10) : null;
        const max = maxAge ? parseInt(maxAge, 10) : null;

        if (min !== null || max !== null) {
            currentClients = currentClients.filter(client => {
                const age = client.dateOfBirth ? calculateAge(client.dateOfBirth) : null;
                if (age === null) return false;
                if (min !== null && age < min) return false;
                if (max !== null && age > max) return false;
                return true;
            });
        }

        return currentClients;
    }, [allClients, minJoinDate, minAge, maxAge]);

    // --- FULL CSV EXPORT ---
    const downloadCSV = () => {
        if (filteredClients.length === 0) return;

        // Includes ALL headers
        const header = ["ID,First Name,Last Name,Email,Phone,Gender,Date of Birth,Address,City,Join Date"];

        const rows = filteredClients.map(c => {
            // Escape Address to prevent CSV breaking on commas
            const safeAddress = c.address ? `"${c.address.replace(/"/g, '""')}"` : '""';
            return `${c.clientId},${c.firstName},${c.lastName},${c.email},${c.phoneNumber},${c.gender},${c.dateOfBirth},${safeAddress},${c.city},${c.joinDate}`;
        });

        const csvContent = [...header, ...rows].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "clients_full_export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // --- FULL PDF EXPORT ---
    const downloadPDF = () => {
        // Landscape orientation to fit all columns
        const doc = new jsPDF('l', 'mm', 'a4');
        doc.text("Full Client List", 14, 15);

        // Map all data
        const tableData = filteredClients.map(c => [
            c.clientId,
            c.firstName,
            c.lastName,
            c.email,
            c.phoneNumber,
            c.gender,
            formatDateForDisplay(c.dateOfBirth),
            c.address,
            c.city,
            formatDateForDisplay(c.joinDate)
        ]);

        autoTable(doc, {
            head: [["ID", "First Name", "Last Name", "Email", "Phone", "Gender", "DOB", "Address", "City", "Joined"]],
            body: tableData,
            startY: 20,
            theme: 'grid',
            headStyles: {
                fillColor: [16, 185, 129], // Emerald
                fontSize: 8
            },
            styles: {
                fontSize: 8, // Smaller font to fit 10 columns
                cellPadding: 2
            },
            columnStyles: {
                0: { cellWidth: 10 }, // ID
                7: { cellWidth: 35 }  // Address (give it more space)
            }
        });

        doc.save("clients_full_export.pdf");
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white relative">
                <Navbar />
                <p className="p-6 text-lg text-emerald-100 font-semibold animate-pulse text-center mt-10">Loading clients...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white relative">
            <Navbar />
            
            <div className="p-4 md:p-8">
                {/* Background Animations */}
                <div className="fixed top-1/4 left-1/4 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob pointer-events-none"></div>
                <div className="fixed top-1/2 right-1/4 w-72 h-72 bg-emerald-700 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000 pointer-events-none"></div>

                {/* --- Main Content Wrapper --- */}
                <div className="relative z-10 p-4 md:p-6 lg:p-8 rounded-xl
                                  bg-gradient-to-br from-green-500/10 to-green-900/10 
                                  backdrop-blur-xl border border-green-400/20 shadow-2xl">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                        <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 to-green-400">
                            Client Management
                        </h1>

                        <div className="flex flex-wrap justify-center gap-3">
                            <button onClick={downloadPDF} className="btn-glass bg-emerald-600/80 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition-all shadow-lg text-sm font-medium">
                                PDF
                            </button>
                            <button onClick={downloadCSV} className="btn-glass bg-green-600/80 hover:bg-green-500 text-white px-4 py-2 rounded-lg transition-all shadow-lg text-sm font-medium">
                                CSV
                            </button>
                            <button onClick={fetchAllClients} className="btn-glass bg-gray-700/80 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-all shadow-lg text-sm font-medium">
                                Refresh
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="p-4 md:p-6 mb-8 rounded-xl bg-white/5 border border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="flex flex-col">
                            <label className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-2">Joined After</label>
                            <input type="date" value={minJoinDate} onChange={(e) => setMinJoinDate(e.target.value)}
                                className="input-glass w-full p-2 rounded-lg bg-black/20 border border-emerald-500/30 text-emerald-50 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none transition-all" />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-2">Min Age</label>
                            <input type="number" value={minAge} onChange={(e) => setMinAge(e.target.value)} placeholder="18"
                                className="input-glass w-full p-2 rounded-lg bg-black/20 border border-emerald-500/30 text-emerald-50 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none transition-all" />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-2">Max Age</label>
                            <input type="number" value={maxAge} onChange={(e) => setMaxAge(e.target.value)} placeholder="65"
                                className="input-glass w-full p-2 rounded-lg bg-black/20 border border-emerald-500/30 text-emerald-50 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none transition-all" />
                        </div>
                    </div>

                    <p className="text-sm text-emerald-200/70 mb-4 font-mono">
                        Showing {filteredClients.length} of {allClients.length} records
                    </p>

                    {/* --- Content Area --- */}
                    {filteredClients.length === 0 ? (
                        <div className="text-center p-12 bg-white/5 rounded-xl border border-dashed border-emerald-500/30">
                            <p className="text-emerald-200">No clients match your filters.</p>
                        </div>
                    ) : (
                        <>
                            {/* DESKTOP TABLE */}
                            <div className="hidden md:block overflow-x-auto rounded-xl border border-emerald-500/20 shadow-xl scrollbar-thin scrollbar-thumb-emerald-600 scrollbar-track-transparent">
                                <table className="min-w-full divide-y divide-emerald-500/30 bg-black/20">
                                    <thead className="bg-emerald-900/40">
                                        <tr>
                                            <th className="px-4 py-4 text-left text-xs font-bold text-emerald-300 uppercase tracking-wider">ID</th>
                                            <th className="px-4 py-4 text-left text-xs font-bold text-emerald-300 uppercase tracking-wider">Name</th>
                                            <th className="px-4 py-4 text-left text-xs font-bold text-emerald-300 uppercase tracking-wider">Email</th>
                                            <th className="px-4 py-4 text-left text-xs font-bold text-emerald-300 uppercase tracking-wider">Phone</th>
                                            <th className="px-4 py-4 text-left text-xs font-bold text-emerald-300 uppercase tracking-wider">Gender</th>
                                            <th className="px-4 py-4 text-left text-xs font-bold text-emerald-300 uppercase tracking-wider">DOB</th>
                                            <th className="px-4 py-4 text-left text-xs font-bold text-emerald-300 uppercase tracking-wider">Address</th>
                                            <th className="px-4 py-4 text-left text-xs font-bold text-emerald-300 uppercase tracking-wider">City</th>
                                            <th className="px-4 py-4 text-left text-xs font-bold text-emerald-300 uppercase tracking-wider">Joined</th>
                                            <th className="px-4 py-4 text-left text-xs font-bold text-emerald-300 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-emerald-500/10">
                                        {filteredClients.map((client) => (
                                            <tr key={client.clientId} className="hover:bg-emerald-500/10 transition-colors">
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-emerald-100/70">{client.clientId}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-white font-medium">{client.firstName} {client.lastName}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-emerald-100/80">{client.email}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-emerald-100/80">{client.phoneNumber}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-emerald-100/80">{client.gender}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-emerald-100/80">{formatDateForDisplay(client.dateOfBirth)}</td>
                                                <td className="px-4 py-4 text-sm text-emerald-100/80 max-w-[150px] truncate" title={client.address}>{client.address}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-emerald-100/80">{client.city}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-emerald-100/80">{formatDateForDisplay(client.joinDate)}</td>

                                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                                                    <button onClick={() => setEditingClient(client)}
                                                        className="text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-md transition-all border border-amber-500/30">
                                                        Edit
                                                    </button>
                                                    <button onClick={() => deleteClient(client.clientId)}
                                                        className="text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-md transition-all border border-red-500/30">
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* MOBILE CARDS */}
                            <div className="md:hidden grid grid-cols-1 gap-4">
                                {filteredClients.map((client) => (
                                    <div key={client.clientId} className="p-5 rounded-xl bg-white/5 border border-emerald-500/20 shadow-lg backdrop-blur-md">
                                        <div className="flex justify-between items-start mb-4 border-b border-emerald-500/20 pb-2">
                                            <div>
                                                <h3 className="text-lg font-bold text-white">{client.firstName} {client.lastName}</h3>
                                                <span className="text-xs text-emerald-400 bg-emerald-900/40 px-2 py-0.5 rounded-full">ID: {client.clientId}</span>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-400">Joined</p>
                                                <p className="text-sm text-emerald-200">{formatDateForDisplay(client.joinDate)}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-300 mb-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs text-emerald-500 uppercase font-semibold">Contact</span>
                                                <span className="truncate">{client.email}</span>
                                                <span>{client.phoneNumber}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs text-emerald-500 uppercase font-semibold">Personal</span>
                                                <span>{client.gender} • {calculateAge(client.dateOfBirth || '')} yrs</span>
                                                <span>Born: {formatDateForDisplay(client.dateOfBirth)}</span>
                                            </div>
                                            <div className="flex flex-col sm:col-span-2 pt-2">
                                                <span className="text-xs text-emerald-500 uppercase font-semibold">Location</span>
                                                <span>{client.address}</span>
                                                <span>{client.city}</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 mt-4 border-t border-emerald-500/20 pt-4">
                                            <button onClick={() => setEditingClient(client)}
                                                className="py-2 px-4 rounded-lg bg-amber-600/20 text-amber-300 border border-amber-500/30 hover:bg-amber-600/30 transition-all font-medium text-center">
                                                Edit
                                            </button>
                                            <button onClick={() => deleteClient(client.clientId)}
                                                className="py-2 px-4 rounded-lg bg-red-600/20 text-red-300 border border-red-500/30 hover:bg-red-600/30 transition-all font-medium text-center">
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* --- EDIT MODAL --- */}
                {editingClient && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
                        <div className="bg-gray-900 border border-emerald-500/40 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">

                            {/* Modal Header */}
                            <div className="p-6 border-b border-emerald-500/20 bg-emerald-900/10 sticky top-0 backdrop-blur-md z-10 flex justify-between items-center">
                                <h2 className="text-2xl font-bold text-white">Edit Client Details</h2>
                                <button onClick={() => setEditingClient(null)} className="text-gray-400 hover:text-white transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Modal Form */}
                            <form onSubmit={handleUpdateClient} className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* First Name */}
                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-emerald-300">First Name</label>
                                        <input required type="text" name="firstName"
                                            value={editingClient.firstName}
                                            onChange={e => setEditingClient({ ...editingClient, firstName: e.target.value })}
                                            className="w-full bg-black/40 border border-emerald-500/30 rounded-lg px-4 py-2.5 text-white focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none transition-all" />
                                    </div>
                                    {/* Last Name */}
                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-emerald-300">Last Name</label>
                                        <input required type="text" name="lastName"
                                            value={editingClient.lastName}
                                            onChange={e => setEditingClient({ ...editingClient, lastName: e.target.value })}
                                            className="w-full bg-black/40 border border-emerald-500/30 rounded-lg px-4 py-2.5 text-white focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none transition-all" />
                                    </div>
                                    {/* Email */}
                                    <div className="space-y-1 md:col-span-2">
                                        <label className="text-sm font-semibold text-emerald-300">Email Address</label>
                                        <input required type="email" name="email"
                                            value={editingClient.email}
                                            onChange={e => setEditingClient({ ...editingClient, email: e.target.value })}
                                            className="w-full bg-black/40 border border-emerald-500/30 rounded-lg px-4 py-2.5 text-white focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none transition-all" />
                                    </div>
                                    {/* Phone */}
                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-emerald-300">Phone Number</label>
                                        <input required type="text" name="phoneNumber"
                                            value={editingClient.phoneNumber}
                                            onChange={e => setEditingClient({ ...editingClient, phoneNumber: e.target.value })}
                                            className="w-full bg-black/40 border border-emerald-500/30 rounded-lg px-4 py-2.5 text-white focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none transition-all" />
                                    </div>
                                    {/* City */}
                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-emerald-300">City</label>
                                        <input required type="text" name="city"
                                            value={editingClient.city}
                                            onChange={e => setEditingClient({ ...editingClient, city: e.target.value })}
                                            className="w-full bg-black/40 border border-emerald-500/30 rounded-lg px-4 py-2.5 text-white focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none transition-all" />
                                    </div>
                                    {/* Address */}
                                    <div className="space-y-1 md:col-span-2">
                                        <label className="text-sm font-semibold text-emerald-300">Residential Address</label>
                                        <input required type="text" name="address"
                                            value={editingClient.address}
                                            onChange={e => setEditingClient({ ...editingClient, address: e.target.value })}
                                            className="w-full bg-black/40 border border-emerald-500/30 rounded-lg px-4 py-2.5 text-white focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none transition-all" />
                                    </div>
                                    {/* DOB */}
                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-emerald-300">Date of Birth</label>
                                        <input type="date" name="dateOfBirth"
                                            value={formatDateForInput(editingClient.dateOfBirth)}
                                            onChange={e => setEditingClient({ ...editingClient, dateOfBirth: e.target.value })}
                                            className="w-full bg-black/40 border border-emerald-500/30 rounded-lg px-4 py-2.5 text-white focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none transition-all" />
                                    </div>
                                    {/* Gender */}
                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-emerald-300">Gender</label>
                                        <select name="gender"
                                            value={editingClient.gender}
                                            onChange={e => setEditingClient({ ...editingClient, gender: e.target.value })}
                                            className="w-full bg-black/40 border border-emerald-500/30 rounded-lg px-4 py-2.5 text-white focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none transition-all appearance-none"
                                        >
                                            <option value="Male" className="bg-gray-800">Male</option>
                                            <option value="Female" className="bg-gray-800">Female</option>
                                            <option value="Other" className="bg-gray-800">Other</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Modal Footer */}
                                <div className="flex justify-end gap-3 pt-4 border-t border-emerald-500/20 mt-6">
                                    <button type="button" onClick={() => setEditingClient(null)}
                                        className="px-5 py-2.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-500/10 transition-colors">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={isSaving}
                                        className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white shadow-lg shadow-emerald-900/50 font-medium transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                                        {isSaving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}