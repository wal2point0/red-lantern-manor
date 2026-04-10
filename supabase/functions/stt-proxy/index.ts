import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  try {
    const deepgramApiKey = Deno.env.get("DEEPGRAM_API_KEY");
    const expectedToken = Deno.env.get("STT_AUTH_TOKEN") || "";

    if (!deepgramApiKey) {
      return new Response(JSON.stringify({ error: "Server not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const authHeader = req.headers.get("authorization") || "";
    const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

    if (expectedToken && bearer !== expectedToken) {
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
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
