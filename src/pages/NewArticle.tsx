import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar"; 
import { api } from "../api"; // ✅ Uses the interceptor for Auth
import { showSuccess, showError } from "../components/Alert";
import { X, Upload } from "lucide-react"; // Icons for better UI

export default function NewArticle() {
    const navigate = useNavigate();

    // Form State
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [link, setLink] = useState("");
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [busy, setBusy] = useState(false);

    // Cleanup object URLs to avoid memory leaks
    useEffect(() => {
        return () => {
            previews.forEach(url => URL.revokeObjectURL(url));
        };
    }, [previews]);

    // Handle File Selection
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            
            // 1. Add files to state
            setSelectedFiles(prev => [...prev, ...files]);

            // 2. Generate previews
            const newPreviews = files.map(file => URL.createObjectURL(file));
            setPreviews(prev => [...prev, ...newPreviews]);
        }
    };

    // Remove a specific image
    const removeImage = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!title.trim() || !description.trim()) {
            showError("Title and Description are required");
            return;
        }

        setBusy(true);
        const fd = new FormData();

        // 1. Append Text Fields (Matches C# [FromForm])
        fd.append("title", title);
        fd.append("description", description);
        if (link) fd.append("link", link);

        // 2. Append Images (Matches C# List<IFormFile> images)
        // We append multiple files with the SAME key "images"
        selectedFiles.forEach((file) => {
            fd.append("images", file);
        });

        try {
            // ✅ api.post handles the Base URL + Auth Token automatically
            await api.post("/Articles/add-article", fd, { 
                headers: { "Content-Type": "multipart/form-data" } 
            });
            
            showSuccess("Article created successfully!");
            navigate("/articlelist"); // Use navigate instead of window.location for SPA feel
            
        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.message || "Failed to create article";
            showError(msg);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-r from-emerald-950 to-black flex flex-col">
            <Navbar />

            {/* Content Wrapper */}
            <div className="flex-grow flex flex-col items-center justify-center p-4 py-10">
                <h2 className="text-center text-3xl font-bold text-white mb-6">
                    New Article
                </h2>

                <form
                    onSubmit={submit}
                    className="w-full sm:w-[80%] md:w-3xl lg:w-4xl h-auto flex flex-col gap-6 bg-white/10 border border-white/20 shadow-2xl rounded-2xl p-6 sm:p-8 text-white backdrop-blur-md"
                >
                    {/* Title */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-green-300">Title</label>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            placeholder="Enter article headline..."
                            className="px-4 py-3 rounded-xl bg-black/40 border border-white/20 focus:outline-none focus:ring-2 focus:ring-green-500/50 placeholder-white/40 transition"
                        />
                    </div>

                    {/* Description */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-green-300">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                            rows={5}
                            placeholder="What is this article about?"
                            className="px-4 py-3 rounded-xl bg-black/40 border border-white/20 focus:outline-none focus:ring-2 focus:ring-green-500/50 placeholder-white/40 resize-none transition"
                        />
                    </div>

                    {/* Link */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-green-300">External Link (Optional)</label>
                        <input
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                            placeholder="https://example.com"
                            className="px-4 py-3 rounded-xl bg-black/40 border border-white/20 focus:outline-none focus:ring-2 focus:ring-green-500/50 placeholder-white/40 transition"
                        />
                    </div>

                    {/* Image Upload Area */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-green-300">Images</label>
                        
                        {/* Hidden Input */}
                        <input
                            id="file-upload"
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                        />

                        {/* Custom Upload Button */}
                        <label 
                            htmlFor="file-upload"
                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/30 rounded-xl cursor-pointer hover:bg-white/5 hover:border-green-500 transition group"
                        >
                            <div className="flex flex-col items-center pt-5 pb-6 text-gray-400 group-hover:text-green-400">
                                <Upload className="w-8 h-8 mb-2" />
                                <p className="text-sm font-semibold">Click to upload images</p>
                            </div>
                        </label>

                        {/* Image Previews Grid */}
                        {previews.length > 0 && (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mt-4">
                                {previews.map((src, index) => (
                                    <div key={index} className="relative group">
                                        <img 
                                            src={src} 
                                            alt="Preview" 
                                            className="w-full h-24 object-cover rounded-lg border border-white/20 shadow-md" 
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 shadow-lg hover:bg-red-700 transition transform hover:scale-110"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={busy}
                        className={`mt-6 py-3 rounded-xl font-bold text-lg shadow-lg transition-all duration-300 transform active:scale-95 ${
                            busy 
                                ? "bg-gray-600 cursor-not-allowed text-gray-300" 
                                : "bg-emerald-600 hover:bg-emerald-500 text-white"
                        }`}
                    >
                        {busy ? "Publishing..." : "Publish Article"}
                    </button>
                </form>
            </div>
        </div>
    );
}