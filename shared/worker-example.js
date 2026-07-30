/**
 * Plume API proxy — Cloudflare Worker
 * ------------------------------------------------------------
 * This keeps your Anthropic API key OFF the public website.
 * The browser calls this Worker; the Worker calls Anthropic
 * using a secret only it knows.
 *
 * SETUP (about 5 minutes):
 * 1. Get an Anthropic API key: https://console.anthropic.com/settings/keys
 * 2. Go to https://dash.cloudflare.com -> Workers & Pages -> Create -> Worker
 * 3. Paste this whole file into the editor, replacing the default code.
 * 4. Go to Settings -> Variables -> add an encrypted variable:
 *      Name:  ANTHROPIC_API_KEY
 *      Value: <your key>
 * 5. Deploy. Copy the worker's URL (looks like
 *      https://plume-proxy.<your-subdomain>.workers.dev )
 * 6. In shared/config.js, set:
 *      const PLUME_API_ENDPOINT = "https://plume-proxy.<your-subdomain>.workers.dev";
 * 7. (Recommended) In ALLOWED_ORIGIN below, replace "*" with your
 *    exact GitHub Pages URL, e.g. "https://frenchstudy.github.io",
 *    so only your site can use this key.
 */

const ALLOWED_ORIGIN = "*"; // e.g. "https://frenchstudy.github.io"

export default {
  async fetch(request, env){
    if(request.method === "OPTIONS"){
      return new Response(null, { headers: corsHeaders() });
    }
    if(request.method !== "POST"){
      return new Response("Method not allowed", { status:405, headers: corsHeaders() });
    }
    try{
      const body = await request.json();
      const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version":"2023-06-01"
        },
        body: JSON.stringify({
          model: body.model || "claude-sonnet-4-6",
          max_tokens: body.max_tokens || 1000,
          system: body.system,
          messages: body.messages
        })
      });
      const data = await anthropicRes.text();
      return new Response(data, {
        status: anthropicRes.status,
        headers: { "Content-Type":"application/json", ...corsHeaders() }
      });
    }catch(err){
      return new Response(JSON.stringify({ error:{ message: String(err) } }), {
        status:500, headers:{ "Content-Type":"application/json", ...corsHeaders() }
      });
    }
  }
};

function corsHeaders(){
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}
