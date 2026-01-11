import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, role } = await req.json();

    if (!userId || !role) {
      console.error("Missing userId or role", { userId, role });
      return new Response(
        JSON.stringify({ error: "Missing userId or role" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (role !== "student" && role !== "investor") {
      console.error("Invalid role", { role });
      return new Response(
        JSON.stringify({ error: "Invalid role" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const clerkSecretKey = Deno.env.get("CLERK_SECRET_KEY");
    if (!clerkSecretKey) {
      console.error("CLERK_SECRET_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Syncing role "${role}" to publicMetadata for user ${userId}`);

    // Update user's publicMetadata using Clerk Backend API
    const clerkResponse = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${clerkSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        public_metadata: { role },
      }),
    });

    if (!clerkResponse.ok) {
      const errorText = await clerkResponse.text();
      console.error("Clerk API error:", clerkResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to update Clerk metadata", details: errorText }),
        { status: clerkResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const updatedUser = await clerkResponse.json();
    console.log("Successfully synced role to publicMetadata", { 
      userId, 
      role,
      publicMetadata: updatedUser.public_metadata 
    });

    return new Response(
      JSON.stringify({ success: true, role }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in sync-clerk-role:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
