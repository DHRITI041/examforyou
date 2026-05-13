// Ensures the protected admin account exists with the requested credentials.
// Public endpoint (verify_jwt = false) — safe because it only ever creates/updates ONE
// hardcoded account and assigns it the admin role.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const ADMIN_EMAIL = "dhriti@admin.app";
const ADMIN_PASSWORD = "dhriti@admin123";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Find existing user by listing (small project, fine).
    const { data: list, error: listErr } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (listErr) throw listErr;

    let user = list.users.find((u) => (u.email ?? "").toLowerCase() === ADMIN_EMAIL);

    if (!user) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: "Admin (dhriti)" },
      });
      if (error) throw error;
      user = data.user!;
    } else {
      // Make sure password matches the requested one.
      await supabase.auth.admin.updateUserById(user.id, {
        password: ADMIN_PASSWORD,
        email_confirm: true,
      });
    }

    // Ensure admin role row exists.
    await supabase.from("user_roles").upsert(
      { user_id: user.id, role: "admin" },
      { onConflict: "user_id,role" },
    );

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
