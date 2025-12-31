import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerClient } from "./lib/supabase";

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies, redirect } = context;

  // Protect /admin routes (except login)
  if (url.pathname.startsWith('/admin') && url.pathname !== '/admin/login') {
    const supabase = createSupabaseServerClient(cookies);
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
      return redirect('/admin/login');
    }

    // Check if user has admin role
    const userRole = session.user.user_metadata?.role;
    if (userRole !== 'admin') {
      return redirect('/admin/login');
    }

    // Attach session to context for admin pages
    context.locals.session = session;
    context.locals.user = session.user;
  }

  return next();
});
