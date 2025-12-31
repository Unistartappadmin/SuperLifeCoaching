import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  const bodyText = await request.text();
  console.log('[Stripe webhook received]', bodyText);

  // temporary always-OK response so local Stripe CLI can forward events
  return new Response('OK', { status: 200 });
};
