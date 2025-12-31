import type { APIRoute, AstroCookies } from "astro";
import { createSupabaseServerClient } from "../../../lib/supabase";
import { sanitizeBlogHtml } from "../../../utils/sanitizeHtml";

const requireAdmin = async (request: Request, cookies: AstroCookies) => {
  const supabase = createSupabaseServerClient(cookies);
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) {
    return { supabase, session: null };
  }
  const role = data.session.user.user_metadata?.role;
  if (role !== "admin") {
    return { supabase, session: null };
  }
  return { supabase, session: data.session };
};

export const GET: APIRoute = async ({ request, cookies }) => {
  const { supabase, session } = await requireAdmin(request, cookies);
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const search = url.searchParams.get("search");

  let query = supabase
    .from("blog_posts")
    .select("id,title,slug,category,published,published_at,created_at");

  if (status === "published") {
    query = query.eq("published", true);
  } else if (status === "drafts") {
    query = query.eq("published", false);
  }

  if (search) {
    query = query.ilike("title", `%${search}%`);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ posts: data }), { status: 200 });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const { supabase, session } = await requireAdmin(request, cookies);
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const payload = await request.json();
  const { title, slug, excerpt, content, featured_image, category, read_time, published } = payload || {};

  if (!title || !slug || !content) {
    return new Response(JSON.stringify({ error: "Title, slug, and content are required." }), { status: 400 });
  }

  const sanitizedContent = sanitizeBlogHtml(content);
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("blog_posts")
    .insert({
      title,
      slug,
      excerpt,
      content: sanitizedContent,
      featured_image,
      category,
      read_time,
      published: !!published,
      published_at: published ? now : null,
      updated_at: now,
    })
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ post: data }), { status: 201 });
};
