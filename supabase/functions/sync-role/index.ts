const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Role = "student" | "investor";

function base64UrlToBytes(input: string): Uint8Array {
  const pad = "=".repeat((4 - (input.length % 4)) % 4);
  const base64 = (input + pad).replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function decodeBase64UrlJson<T = unknown>(input: string): T {
  const text = new TextDecoder().decode(base64UrlToBytes(input));
  return JSON.parse(text) as T;
}

async function verifyClerkJwtAndGetUserId(
  token: string
): Promise<{ userId: string; issuer: string } | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, encodedSig] = parts;
  const header = decodeBase64UrlJson<{ kid?: string; alg?: string }>(encodedHeader);
  const payload = decodeBase64UrlJson<{ sub?: string; iss?: string; exp?: number }>(encodedPayload);

  if (header?.alg !== "RS256" || !header?.kid) return null;
  if (!payload?.sub || !payload?.iss) return null;

  if (typeof payload.exp === "number" && Date.now() / 1000 >= payload.exp) return null;

  const issuer = payload.iss.replace(/\/$/, "");
  const jwksRes = await fetch(`${issuer}/.well-known/jwks.json`);
  if (!jwksRes.ok) return null;
  const jwks = (await jwksRes.json()) as { keys?: Array<Record<string, unknown>> };
  const jwk = jwks.keys?.find((k: Record<string, unknown>) => k.kid === header.kid);
  if (!jwk) return null;

  const publicKey = await crypto.subtle.importKey(
    "jwk",
    jwk as JsonWebKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const dataU8 = new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`);
  const sigU8 = base64UrlToBytes(encodedSig);

  // Force ArrayBuffers (avoid SharedArrayBuffer typing issues)
  const data = Uint8Array.from(dataU8).buffer;
  const signature = Uint8Array.from(sigU8).buffer;

  const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", publicKey, signature, data);
  if (!ok) return null;

  return { userId: payload.sub, issuer };
}

declare const Deno: any;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, role } = (await req.json().catch(() => ({}))) as {
      token?: string;
      role?: Role;
    };

    if (!token) {
      return new Response(JSON.stringify({ success: false, error: "Missing token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (role !== "student" && role !== "investor") {
      return new Response(JSON.stringify({ success: false, error: "Invalid role" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const verified = await verifyClerkJwtAndGetUserId(token);
    if (!verified) {
      return new Response(JSON.stringify({ success: false, error: "Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const clerkSecret = Deno.env.get("CLERK_SECRET_KEY");
    if (!clerkSecret) {
      return new Response(JSON.stringify({ success: false, error: "Server not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const clerkRes = await fetch(`https://api.clerk.com/v1/users/${verified.userId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${clerkSecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ public_metadata: { role } }),
    });

    const clerkText = await clerkRes.text();
    if (!clerkRes.ok) {
      console.error("sync-role: Clerk API error", clerkRes.status, clerkText);
      return new Response(JSON.stringify({ success: false, error: "Clerk update failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, role }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("sync-role: exception", e);
    return new Response(JSON.stringify({ success: false, error: "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
