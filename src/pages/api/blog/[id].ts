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

export const GET: APIRoute = async ({ params, cookies, request }) => {
  const { supabase, session } = await requireAdmin(request, cookies);
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const { id } = params;
  const { data, error } = await supabase.from("blog_posts").select("*").eq("id", id).single();
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 404 });
  }
  return new Response(JSON.stringify({ post: data }), { status: 200 });
};

export const PUT: APIRoute = async ({ params, request, cookies }) => {
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
    .update({
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
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ post: data }), { status: 200 });
};

export const PATCH: APIRoute = async ({ params, request, cookies }) => {
  const { supabase, session } = await requireAdmin(request, cookies);
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const payload = await request.json();
  const published = !!payload?.published;
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("blog_posts")
    .update({
      published,
      published_at: published ? now : null,
      updated_at: now,
    })
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ post: data }), { status: 200 });
};

export const DELETE: APIRoute = async ({ params, request, cookies }) => {
  const { supabase, session } = await requireAdmin(request, cookies);
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const { error } = await supabase.from("blog_posts").delete().eq("id", params.id);
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
