// lib/auth.js
// Resolve the calling user from a Supabase Auth bearer token.
// Returns the auth user object, or null if missing/invalid/unconfigured.
import { createClient } from "@supabase/supabase-js";

export function isAuthConfigured() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
}

export async function getAuthedUser(req) {
  if (!isAuthConfigured()) return null;
  const hdr = req.headers?.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : "";
  if (!token) return null;
  const anon = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
  const { data, error } = await anon.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

export function readRawBody(req) {
  // Vercel serverless: collect the raw request body (needed for Stripe sig verify).
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}
