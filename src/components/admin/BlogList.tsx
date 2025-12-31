import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Pencil, Trash2, Search } from "lucide-react";

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  published: boolean;
  published_at: string | null;
  created_at: string;
};

type StatusFilter = "all" | "published" | "drafts";

export default function BlogList() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (status !== "all") {
      params.set("status", status);
    }
    if (search.trim()) {
      params.set("search", search.trim());
    }
    return params.toString();
  }, [status, search]);

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/blog/posts${queryString ? `?${queryString}` : ""}`);
      if (!response.ok) {
        throw new Error("Failed to load posts");
      }
      const data = await response.json();
      setPosts(data.posts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [queryString]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this post? This action cannot be undone.")) {
      return;
    }
    await fetch(`/api/blog/${id}`, { method: "DELETE" });
    fetchPosts();
  };

  const togglePublish = async (post: BlogPost) => {
    await fetch(`/api/blog/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !post.published }),
    });
    fetchPosts();
  };

  const rowClass =
    "group border-b border-gray-100 hover:bg-[#0A0A0A]/5 transition-colors cursor-pointer";

  return (
    <div className={`space-y-6 transition-opacity duration-500 ${mounted ? "opacity-100" : "opacity-0"}`}>
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 w-full lg:w-80">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search posts..."
            className="w-full text-sm text-gray-700 focus:outline-none"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          {(["all", "published", "drafts"] as StatusFilter[]).map((value) => (
            <button
              key={value}
              type="button"
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                status === value
                  ? "bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/30"
                  : "text-gray-600 border-gray-200 hover:border-[#D4AF37]/30 hover:text-[#D4AF37]"
              }`}
              onClick={() => setStatus(value)}
            >
              {value === "all" ? "All" : value === "published" ? "Published" : "Drafts"}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr className="text-xs uppercase tracking-wider text-gray-500">
              <th className="px-6 py-4 font-semibold">Title</th>
              <th className="px-6 py-4 font-semibold">Category</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Date</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                  Loading posts...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-red-500">
                  {error}
                </td>
              </tr>
            ) : posts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                  No blog posts found.
                </td>
              </tr>
            ) : (
              posts.map((post) => {
                const date = post.published_at || post.created_at;
                return (
                  <tr
                    key={post.id}
                    className={rowClass}
                    onClick={() => (window.location.href = `/admin/blog/edit/${post.id}`)}
                  >
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {post.title}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {post.category || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
                          post.published
                            ? "bg-[#D4AF37]/10 text-[#D4AF37]"
                            : "bg-[#0A0A0A]/10 text-[#0A0A0A]"
                        }`}
                      >
                        {post.published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(date).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          className="p-2 rounded-lg hover:bg-[#0A0A0A]/5"
                          onClick={(event) => {
                            event.stopPropagation();
                            window.location.href = `/admin/blog/edit/${post.id}`;
                          }}
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          type="button"
                          className="p-2 rounded-lg hover:bg-[#0A0A0A]/5"
                          onClick={(event) => {
                            event.stopPropagation();
                            togglePublish(post);
                          }}
                          title={post.published ? "Unpublish" : "Publish"}
                        >
                          {post.published ? (
                            <EyeOff className="w-4 h-4 text-gray-600" />
                          ) : (
                            <Eye className="w-4 h-4 text-gray-600" />
                          )}
                        </button>
                        <button
                          type="button"
                          className="p-2 rounded-lg hover:bg-red-50"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDelete(post.id);
                          }}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
