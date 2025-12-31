import { useEffect, useMemo, useRef, useState } from "react";
import BlogEditor from "./BlogEditor";
import { slugify } from "../../utils/slugify";

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featured_image: string | null;
  category: string | null;
  read_time: number | null;
  published: boolean;
};

interface BlogFormProps {
  mode: "create" | "edit";
  postId?: string;
}

const categories = [
  "Mindset",
  "Career",
  "Relationships",
  "Personal Growth",
  "Other",
];

export default function BlogForm({ mode, postId }: BlogFormProps) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("Personal Growth");
  const [excerpt, setExcerpt] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [readTime, setReadTime] = useState<number | "">("");
  const [content, setContent] = useState("");
  const [published, setPublished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const slugLocked = useRef(false);
  const dirtyRef = useRef(false);

  const previewData = useMemo(
    () => ({
      title: title || "Untitled Post",
      excerpt: excerpt || "Short summary will appear here.",
      category,
      readTime: readTime ? `${readTime} min read` : "—",
      featuredImage,
    }),
    [title, excerpt, category, readTime, featuredImage]
  );

  useEffect(() => {
    if (mode !== "edit" || !postId) return;
    setLoading(true);
    fetch(`/api/blog/${postId}`)
      .then((response) => response.json())
      .then((data) => {
        const post: BlogPost = data.post;
        setTitle(post.title);
        setSlug(post.slug);
        setCategory(post.category || "Personal Growth");
        setExcerpt(post.excerpt || "");
        setFeaturedImage(post.featured_image || "");
        setReadTime(post.read_time || "");
        setContent(post.content || "");
        setPublished(post.published);
        slugLocked.current = true;
      })
      .catch(() => setError("Failed to load blog post."))
      .finally(() => setLoading(false));
  }, [mode, postId]);

  useEffect(() => {
    if (slugLocked.current) return;
    setSlug(slugify(title));
  }, [title]);

  useEffect(() => {
    dirtyRef.current = true;
  }, [title, slug, excerpt, featuredImage, readTime, content, category]);

  useEffect(() => {
    if (mode !== "edit") return;
    const interval = setInterval(() => {
      if (!dirtyRef.current || saving) return;
      handleSave(false, true);
    }, 30000);
    return () => clearInterval(interval);
  }, [mode, saving]);

  const handleSave = async (publish: boolean, silent = false) => {
    if (!title.trim() || !slug.trim() || !content.trim()) {
      setError("Title, slug, and content are required.");
      return;
    }

    setSaving(true);
    setError(null);
    if (!silent) {
      setSuccess(null);
    }

    const nextPublished = publish ? true : mode === "create" ? false : published;
    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      category,
      excerpt: excerpt.trim(),
      featured_image: featuredImage.trim() || null,
      read_time: readTime === "" ? null : Number(readTime),
      content,
      published: nextPublished,
    };

    try {
      const response = await fetch(
        mode === "create" ? "/api/blog/posts" : `/api/blog/${postId}`,
        {
          method: mode === "create" ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const message = await response.json();
        throw new Error(message?.error || "Failed to save post.");
      }

      const data = await response.json();
      if (mode === "create") {
        window.location.href = `/admin/blog/edit/${data.post.id}`;
        return;
      }

      dirtyRef.current = false;
      setPublished(nextPublished);
      if (!silent) {
        setSuccess(publish ? "Post published." : "Draft saved.");
      }
    } catch (err) {
      if (!silent) {
        setError(err instanceof Error ? err.message : "Failed to save post.");
      }
    } finally {
      setSaving(false);
    }
  };

  const formDisabled = loading || saving;

  return (
    <div className="relative pb-24 lg:pb-0">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 text-sm px-4 py-3 rounded-lg">
              {success}
            </div>
          )}

          <div className="grid gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700">Title</label>
              <input
                type="text"
                className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Post title"
                disabled={formDisabled}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Slug</label>
              <input
                type="text"
                className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40"
                value={slug}
                onChange={(event) => {
                  slugLocked.current = true;
                  setSlug(event.target.value);
                }}
                placeholder="url-friendly-slug"
                disabled={formDisabled}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700">Category</label>
                <select
                  className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  disabled={formDisabled}
                >
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Read Time (minutes)</label>
                <input
                  type="number"
                  className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40"
                  value={readTime}
                  onChange={(event) => setReadTime(event.target.value === "" ? "" : Number(event.target.value))}
                  placeholder="5"
                  min={1}
                  disabled={formDisabled}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Excerpt</label>
              <textarea
                className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40"
                rows={4}
                value={excerpt}
                onChange={(event) => setExcerpt(event.target.value)}
                placeholder="Short summary for cards and SEO."
                disabled={formDisabled}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Featured Image URL</label>
              <input
                type="text"
                className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40"
                value={featuredImage}
                onChange={(event) => setFeaturedImage(event.target.value)}
                placeholder="https://..."
                disabled={formDisabled}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">Content</label>
            <BlogEditor value={content} onChange={setContent} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm lg:sticky lg:top-6">
            <h3 className="text-sm uppercase tracking-widest text-gray-500 mb-4">Preview</h3>
            <div className="space-y-4">
              {previewData.featuredImage && (
                <img
                  src={previewData.featuredImage}
                  alt={previewData.title}
                  className="w-full h-40 object-cover rounded-xl"
                />
              )}
              <div className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-[#D4AF37]/10 text-[#D4AF37]">
                {previewData.category}
              </div>
              <h4 className="text-xl font-bold text-[#0A0A0A]">{previewData.title}</h4>
              <p className="text-sm text-gray-600">{previewData.excerpt}</p>
              <p className="text-xs text-gray-500">{previewData.readTime}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 bg-white/95 backdrop-blur border-t border-gray-200 px-4 py-3 flex items-center justify-between gap-3 lg:static lg:bg-transparent lg:border-0 lg:px-0 lg:py-6 lg:justify-end">
        <button
          type="button"
          className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
          onClick={() => (window.location.href = "/admin/blog")}
          disabled={formDisabled}
        >
          Cancel
        </button>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="px-4 py-2.5 rounded-full border border-gray-300 text-sm font-semibold text-gray-700 hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors"
            onClick={() => handleSave(false)}
            disabled={formDisabled}
          >
            Save Draft
          </button>
          <button
            type="button"
            className="px-5 py-2.5 rounded-full bg-[#0A0A0A] text-sm font-semibold text-white hover:bg-[#D4AF37] transition-colors"
            onClick={() => handleSave(true)}
            disabled={formDisabled}
          >
            {saving ? "Saving..." : "Publish"}
          </button>
        </div>
      </div>
    </div>
  );
}
