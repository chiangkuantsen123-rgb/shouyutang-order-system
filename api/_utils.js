import crypto from "node:crypto";

const requiredEnv = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SESSION_SECRET"];

export function getEnv() {
  const missing = requiredEnv.filter((key) => !process.env[key]);
  if (missing.length) {
    const error = new Error(`Missing environment variables: ${missing.join(", ")}`);
    error.statusCode = 500;
    throw error;
  }
  return {
    supabaseUrl: process.env.SUPABASE_URL.replace(/\/$/, ""),
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    sessionSecret: process.env.SESSION_SECRET,
    adminLogin: process.env.ADMIN_LOGIN || "admin",
    adminPassword: process.env.ADMIN_PASSWORD || "",
  };
}

export function json(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

export function method(req, res, allowed) {
  if (!allowed.includes(req.method)) {
    json(res, 405, { error: "Method not allowed" });
    return false;
  }
  return true;
}

export async function body(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

export function hashPassword(password) {
  return crypto.createHash("sha256").update(String(password)).digest("hex");
}

function sign(value, secret) {
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

export function createSession(payload) {
  const { sessionSecret } = getEnv();
  const data = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 1000 * 60 * 60 * 24 * 14 })).toString("base64url");
  return `${data}.${sign(data, sessionSecret)}`;
}

export function readSession(req) {
  const { sessionSecret } = getEnv();
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const [data, signature] = token.split(".");
  if (!data || !signature || sign(data, sessionSecret) !== signature) return null;
  const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
  if (!payload.exp || Date.now() > payload.exp) return null;
  return payload;
}

export function requireRole(req, role) {
  const session = readSession(req);
  if (!session || (role && session.role !== role)) {
    const error = new Error("Unauthorized");
    error.statusCode = 401;
    throw error;
  }
  return session;
}

export async function supabase(path, options = {}) {
  const { supabaseUrl, serviceKey } = getEnv();
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const error = new Error(data?.message || "Supabase request failed");
    error.statusCode = response.status;
    error.details = data;
    throw error;
  }
  return data;
}

export function handleError(res, error) {
  json(res, error.statusCode || 500, {
    error: error.message || "Server error",
    details: error.details,
  });
}
