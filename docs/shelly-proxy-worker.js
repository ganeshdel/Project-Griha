/**
 * Griha — Shelly Cloud relay (Cloudflare Worker)
 *
 * Why this exists: browsers block direct calls to Shelly Cloud because it
 * doesn't send CORS headers. This tiny relay forwards the request and adds
 * them, so the Griha web app can read your device live.
 *
 * Setup (~10 minutes, free tier is plenty):
 *   1. Create a free account at https://dash.cloudflare.com
 *   2. Workers & Pages → Create → Worker → paste this file → Deploy
 *   3. Set SHELLY_SERVER below to your account's server (shown in the
 *      Shelly app under Settings → Authorization cloud key, e.g.
 *      "https://shelly-56-eu.shelly.cloud")
 *   4. Copy the worker URL (https://<name>.<account>.workers.dev) into
 *      Griha → Devices → Live connect → Relay URL
 *
 * Security notes:
 *   - The auth key travels in the POST body over HTTPS end to end; the
 *     worker does not log or store it.
 *   - ALLOWED_ORIGIN restricts who may call this relay. Set it to your
 *     Griha URL. Use "*" only while testing.
 */

const SHELLY_SERVER = 'https://shelly-56-eu.shelly.cloud';
const ALLOWED_ORIGIN = 'https://ganeshdel.github.io';

const CORS = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }
    if (request.method !== 'POST') {
      return new Response('POST only', { status: 405, headers: CORS });
    }
    const url = new URL(request.url);
    // Forward path as-is: the app calls <relay>/device/status
    const upstream = await fetch(SHELLY_SERVER + url.pathname, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: await request.text(),
    });
    const body = await upstream.text();
    return new Response(body, {
      status: upstream.status,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  },
};
