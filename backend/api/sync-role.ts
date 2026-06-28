// Vercel Serverless Function: Sync Clerk role to publicMetadata
// Deploy within the `vercel-api` project.

import crypto from "crypto";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

type Role = "student" | "investor";

function base64UrlToBuffer(input: string) {
  const pad = "=".repeat((4 - (input.length % 4)) % 4);
  const base64 = (input + pad).replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64");
}

function decodeBase64UrlJson<T = any>(input: string): T {
  return JSON.parse(base64UrlToBuffer(input).toString("utf8"));
}

async function verifyClerkJwtAndGetUserId(token: string): Promise<{ userId: string; issuer: string } | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, encodedSig] = parts;
  const header = decodeBase64UrlJson<{ kid?: string; alg?: string }>(encodedHeader);
  const payload = decodeBase64UrlJson<{ sub?: string; iss?: string; exp?: number }>(encodedPayload);

  if (!header?.kid || header.alg !== "RS256") return null;
  if (!payload?.sub || !payload?.iss) return null;

  // Exp check (basic)
  if (typeof payload.exp === "number" && Date.now() / 1000 >= payload.exp) return null;

  // Fetch JWKS from issuer
  const jwksUrl = `${payload.iss.replace(/\/$/, "")}/.well-known/jwks.json`;
  const jwksRes = await fetch(jwksUrl);
  if (!jwksRes.ok) return null;
  const jwks = (await jwksRes.json()) as { keys?: Array<any> };
  const jwk = jwks?.keys?.find((k) => k.kid === header.kid);
  if (!jwk) return null;

  const keyObject = crypto.createPublicKey({ key: jwk, format: "jwk" });
  const data = Buffer.from(`${encodedHeader}.${encodedPayload}`, "utf8");
  const signature = base64UrlToBuffer(encodedSig);

  const ok = crypto.verify("RSA-SHA256", data, keyObject, signature);
  if (!ok) return null;

  return { userId: payload.sub, issuer: payload.iss };
}

export default async function handler(req: any, res: any) {
  // Handle CORS
  if (req.method === "OPTIONS") {
    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(200).json({ ok: true });
  }

  Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const authHeader = String(req.headers?.authorization || "");
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    const token = match?.[1];
    if (!token) {
      return res.status(401).json({ success: false, error: "Missing Authorization bearer token" });
    }

    const verified = await verifyClerkJwtAndGetUserId(token);
    if (!verified) {
      return res.status(401).json({ success: false, error: "Invalid session token" });
    }

    const role = (req.body?.role as Role | undefined) ?? undefined;
    if (role !== "student" && role !== "investor") {
      return res.status(400).json({ success: false, error: "Invalid role" });
    }

    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    if (!clerkSecretKey) {
      return res.status(500).json({ success: false, error: "Server not configured" });
    }

    // Overwrite role in Clerk public metadata (always)
    const clerkRes = await fetch(`https://api.clerk.com/v1/users/${verified.userId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${clerkSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ public_metadata: { role } }),
    });

    const clerkText = await clerkRes.text();
    if (!clerkRes.ok) {
      console.error("sync-role: Clerk API error", clerkRes.status, clerkText);
      return res.status(502).json({ success: false, error: "Failed to update role" });
    }

    return res.status(200).json({ success: true, role });
  } catch (e: any) {
    console.error("sync-role: exception", e);
    return res.status(500).json({ success: false, error: e?.message || "Unknown error" });
  }
}
