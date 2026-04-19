// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Call our axelo-admin API route to generate the blog
    const adminUrl = Deno.env.get("ADMIN_URL") || "https://admin.axelotours.co.ke";
    
    console.log("Triggering weekly AI blog generation at", adminUrl);
    
    // In production, we'd add an Authorization header or secret.
    const res = await fetch(`${adminUrl}/api/blog/generate`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({}) // Uses a random topic from the list
    });

    const data = await res.json();
    
    if (!res.ok || !data.success) {
        throw new Error(`Generation failed: ${JSON.stringify(data)}`);
    }

    return new Response(
      JSON.stringify({ message: "Weekly blog draft generated successfully", post: data.post }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Weekly Blog Cron Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
