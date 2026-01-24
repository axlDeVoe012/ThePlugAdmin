import { useState, useEffect } from "react";
import Navbar from "../components/Navbar"; // Imported Navbar
import { api } from "../api";
import { useParams } from "react-router-dom";
import { showSuccess, showError } from "../components/Alert";
import Swal from "sweetalert2";

interface Article {
  id: number;
  title: string;
  description: string;
  link?: string;
  images: string[];
}

export default function EditArticle() {
  const { id } = useParams<{ id: string }>();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [images, setImage] = useState<FileList | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArticle();
  }, [id]);

  const loadArticle = async () => {
    if (!id) return;
    try {
      const response = await api.get(`/Articles/get-articleById?id=${id}`);
      const article: Article = response.data;
      setTitle(article.title);
      setDescription(article.description);
      setLink(article.link || "");
    } catch (error) {
      console.error("Error loading article:", error);
    } finally {
      setLoading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await Swal.fire({
      title: 'Confirm',
      text: 'Are you sure you want to update this article?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
    });
    if (!result.isConfirmed) return;
    setBusy(true);
    const fd = new FormData();
    fd.append("title", title);
    fd.append("description", description);
    if (link) fd.append("link", link);
    if (images) Array.from(images).forEach(f => fd.append("images", f));
    const token = sessionStorage.getItem("token");
    try {
      await api.put(`/Articles/update-article?id=${id}`, fd, {
        headers: { "Content-Type": "multipart/form-data", "Authorization": `Bearer ${token}` }
      });
      showSuccess("Article updated successfully!");
      window.location.href = "/articlelist";
    } catch (error: any) {
      console.error(error);
      showError(error.response?.data?.message || "Failed to update article");
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
    // Main container uses flex-col to stack Navbar and content
    <div className="min-h-screen bg-gradient-to-r from-emerald-950 to-black flex flex-col">
      <Navbar />

      {/* Content Wrapper - Centers the form */}
      <div className="flex-grow flex flex-col items-center justify-center p-4">
        <h2 className="text-center text-3xl font-bold text-white mb-6">
          Edit Article
        </h2>

        <form
          onSubmit={submit}
          className="w-full sm:w-[80%] md:w-3xl lg:w-5xl h-auto flex flex-col gap-6 bg-white/35 border border-white/40 shadow-lg rounded-2xl p-6 sm:p-8 text-white backdrop-blur-sm"
        >
          {/* Title */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="px-3 py-2 rounded-lg bg-black/30 border border-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-950/30 placeholder-white/60"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              className="px-3 py-2 rounded-lg bg-black/30 border border-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-950/30 placeholder-white/60 resize-none"
            />
          </div>

          {/* Link */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Link (optional)</label>
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://..."
              className="px-3 py-2 rounded-lg bg-black/30 border border-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-950/30 placeholder-white/60"
            />
          </div>

          {/* Images */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Images (upload to replace existing)</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setImage(e.target.files)}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
               file:text-sm file:font-medium file:bg-emerald-950 file:text-white
               hover:file:bg-emerald-950/30 cursor-pointer"
            />
          </div>

          {/* Button */}
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