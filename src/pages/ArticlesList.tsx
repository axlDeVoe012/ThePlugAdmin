import { useEffect, useState } from "react";
import Navbar from "../components/Navbar"; // Imported Navbar
import { api } from "../api";
import { showSuccess, showError, showConfirm } from "../components/Alert";

interface RawArticle {
  id: number;
  title?: string;
  description?: string;
  discription?: string; // handle typo from API
  link?: string | null;
  images?: string[];
  createdAt?: string;
}

export interface Article {
  id: number;
  title: string;
  description: string;
  link?: string | null;
  images: string[];
  createdAt: string;
}

export default function ArticleList() {
  const [items, setItems] = useState<Article[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const normalizeArticle = (raw: RawArticle): Article => ({
    id: raw.id,
    title: raw.title ?? "Untitled",
    description: raw.description ?? raw.discription ?? "",
    link: raw.link ?? null,
    images: Array.isArray(raw.images) ? raw.images : [],
    createdAt: raw.createdAt ?? new Date().toISOString(),
  });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/Articles/get-allArticles");
      let rawData: RawArticle[] = [];

      if (Array.isArray(response.data)) rawData = response.data;
      else if (Array.isArray((response.data as any)?.data))
        rawData = (response.data as any).data;
      else if (Array.isArray((response.data as any)?.items))
        rawData = (response.data as any).items;
      else if (Array.isArray((response.data as any)?.articles))
        rawData = (response.data as any).articles;

      const normalized: Article[] = rawData.map(normalizeArticle);
      setItems(normalized);
    } catch (err: any) {
      console.error("Error loading articles:", err);
      setError(err.response?.data?.message || err.message || "Failed to load articles");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const del = async (id: number) => {
    const confirmed = await showConfirm("Are you sure you want to delete this article?");
    if (!confirmed) return;
    try {
      await api.delete(`/Articles/delete-article?id=${id}`);
      showSuccess("Article deleted successfully!");
      await load();
    } catch (err: any) {
      console.error("Error deleting article:", err);
      showError(err.response?.data?.message || "Failed to delete article");
    }
  };

  // Render shimmer placeholders with multiple image blocks
  if (loading) {
    const placeholders = Array.from({ length: 4 });
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-gray-900 to-black">
        <Navbar />
        {/* Added wrapper for padding so Navbar stays full width */}
        <div className="py-10 px-6">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {placeholders.map((_, idx) => (
              <div
                key={idx}
                className="bg-white/10 border border-white/10 rounded-2xl p-4 shadow-xl backdrop-blur-md animate-pulse flex flex-col"
              >
                {/* Simulate multiple images */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="h-32 w-full bg-white/20 rounded-lg" />
                  <div className="h-32 w-full bg-white/20 rounded-lg" />
                </div>
                <div className="h-6 bg-white/20 rounded w-3/4 mb-2" />
                <div className="h-4 bg-white/20 rounded w-full mb-2" />
                <div className="h-4 bg-white/20 rounded w-5/6 mb-2" />
                <div className="h-8 w-24 bg-white/20 rounded mt-4 ml-auto" />
              </div>
            ))}
          </div>
          {/* Spinner with loading text */}
          <div className="flex justify-center items-center mt-8">
            <svg
              className="animate-spin h-6 w-6 text-green-400 mr-3"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              ></path>
            </svg>
            <span className="text-green-300 font-semibold text-lg">Loading articles...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-900 via-gray-900 to-black">
        <Navbar />
        {/* Centering wrapper */}
        <div className="flex-grow flex items-center justify-center">
          <div className="bg-red-600/20 border border-red-500/50 text-red-200 px-6 py-4 rounded-xl backdrop-blur-lg shadow-xl">
            <p>{error}</p>
            <button
              onClick={load}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-gray-900 to-black">
      <Navbar />
      {/* Main Content Wrapper with Padding */}
      <div className="py-6 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-10">
            <h1 className="text-4xl font-bold text-white">Articles</h1>
            <a
              href="/newarticle"
              className="bg-green-600 hover:bg-green-700 text-white  rounded-3xl p-2 shadow-md transition"
            >
              + New Article
            </a>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>No articles found.</p>
              <a
                href="/newarticle"
                className="inline-block mt-6 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-xl shadow-md transition"
              >
                Create your first article
              </a>
            </div>
          ) : (
            <ul className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 place-content-center">
              {items.map((a) => (
                <li
                  key={a.id}
                  className="bg-white/10 border border-white/10 rounded-2xl p-3 shadow-xl backdrop-blur-md hover:bg-white/20 hover:shadow-2xl transition flex flex-col min-h-80"
                >
                  {a.images?.length > 0 && (
                    <div className="flex justify-center mb-4">
                      <div className="grid grid-cols-2 gap-2 max-w-md ">
                        {a.images.slice(0, 4).map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt={`${a.title} image ${idx + 1}`}
                            className="ml-[50%] rounded-lg w-full h-32 object-cover "
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  <h2 className="text-2xl font-semibold text-green-300">{a.title}</h2>
                  <p className="text-gray-200 mt-2 line-clamp-3 leading-relaxed">{a.description}</p>
                  {a.link && (
                    <a
                      href={a.link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block mt-3 text-green-400 hover:underline"
                    >
                      Visit Link →
                    </a>
                  )}
                  <div className="mt-auto flex justify-center space-x-3">
                    <button
                      aria-label="Delete article"
                      onClick={() => del(a.id)}
                      className="bg-red-600 hover:bg-red-700 hover:scale-105 text-white px-3 py-1 rounded-lg text-sm transition transform"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        ></path>
                      </svg>
                    </button>
                    <a
                      aria-label="Edit article"
                      href={`/edit/${a.id}`}
                      className="bg-green-600 hover:bg-green-700 hover:scale-105 text-white px-3 py-1 rounded-lg text-sm transition transform inline-flex items-center"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        ></path>
                      </svg>
                      Edit
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}