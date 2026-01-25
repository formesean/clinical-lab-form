import { NextResponse } from "next/server";
import { supabaseAuth } from "@/lib/supabase";

/**
 * POST /api/auth/logout
 *
 * Logs out the current user by revoking the Supabase session
 * and clearing auth cookies.
 *
 * Returns: { success: true }
 *
 * Status codes:
 * - 200 OK
 */
export async function POST(req: Request) {
  try {
    const cookieHeader = req.headers.get("cookie") ?? "";
    const match = cookieHeader.match(/sb_access_token=([^;]+)/);
    const token = match?.[1];

    if (token) {
      await supabaseAuth.auth.signOut();
    }
  } catch { }

  const res = NextResponse.json({ success: true });

  res.headers.append(
    "Set-Cookie",
    "sb_access_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0"
  );

  res.headers.append(
    "Set-Cookie",
    "sb_refresh_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0"
  );

  res.headers.set("Cache-Control", "no-store");

  return res;
}
