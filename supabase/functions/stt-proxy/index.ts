import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const DEFAULT_ALLOWED_ORIGINS = [
  "https://walthreepoint0.github.io",
  "https://wal2point0.github.io",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:8080",
  "http://127.0.0.1:8080"
];

function normalizeOrigin(value: string): string {
  const raw = String(value || "").trim();
  if (!raw) return "";

  try {
    return new URL(raw).origin;
  } catch {
    return raw.replace(/\/+$/, "");
  }
}

function buildCorsHeaders(origin = "") {
  const allowOrigin = normalizeOrigin(origin) || "*";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin"
  };
}

function isOriginAllowed(origin: string, allowedOrigins: string[]): boolean {
  const normalizedOrigin = normalizeOrigin(origin);
  if (!normalizedOrigin) return true;
  if (!allowedOrigins.length) return true;

  const normalizedAllowedOrigins = new Set(
    [...DEFAULT_ALLOWED_ORIGINS, ...allowedOrigins]
      .map(normalizeOrigin)
      .filter(Boolean)
  );

  return normalizedAllowedOrigins.has(normalizedOrigin);
}

serve(async (req) => {
  const origin = req.headers.get("origin") || "";

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: buildCorsHeaders(origin) });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...buildCorsHeaders(origin), "Content-Type": "application/json" }
    });
  }

  try {
    const deepgramApiKey = Deno.env.get("DEEPGRAM_API_KEY");
    const requiredAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const allowedOriginsCsv = Deno.env.get("ALLOWED_ORIGINS") || "";
    const allowedOrigins = allowedOriginsCsv
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const originAllowed = isOriginAllowed(origin, allowedOrigins);
    const corsHeaders = buildCorsHeaders(originAllowed ? origin : "");

    if (!deepgramApiKey) {
      return new Response(JSON.stringify({ error: "Server not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (allowedOrigins.length && origin && !originAllowed) {
      return new Response(JSON.stringify({ error: "Origin not allowed" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const apikey = req.headers.get("apikey") || "";
    if (requiredAnonKey && apikey !== requiredAnonKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const form = await req.formData();
    const audio = form.get("audio");
    const language = String(form.get("language") || "en-GB");

    if (!(audio instanceof File)) {
      return new Response(JSON.stringify({ error: "Missing audio file" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const audioBytes = await audio.arrayBuffer();

    const deepgramUrl =
      "https://api.deepgram.com/v1/listen?model=nova-3&smart_format=true&punctuate=true&language=" +
      encodeURIComponent(language);

    const dgRes = await fetch(deepgramUrl, {
      method: "POST",
      headers: {
        Authorization: `Token ${deepgramApiKey}`,
        "Content-Type": audio.type || "audio/webm"
      },
      body: audioBytes
    });

    if (!dgRes.ok) {
      const errText = await dgRes.text();
      return new Response(JSON.stringify({ error: "Deepgram failed", detail: errText }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const dgJson = await dgRes.json();
    const alt = dgJson?.results?.channels?.[0]?.alternatives?.[0] || {};
    const transcript = String(alt.transcript || "").trim();
    const confidence = Number(alt.confidence || 0);

    return new Response(JSON.stringify({ text: transcript, confidence }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Unhandled proxy error", detail: String(err) }),
      {
        status: 500,
        headers: { ...buildCorsHeaders(origin), "Content-Type": "application/json" }
      }
    );
  }
});
