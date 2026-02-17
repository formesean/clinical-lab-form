import { type NextRequest, NextResponse } from "next/server";

const ACCESS_TOKEN_COOKIE = "sb_access_token";
const REFRESH_TOKEN_COOKIE = "sb_refresh_token";
const SESSION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365 * 10;
const EXPIRY_SKEW_MS = 30_000;

const AUTH_PATHS_TO_SKIP = new Set([
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/logout",
]);

type RefreshTokenResponse = {
  access_token: string;
  refresh_token: string;
};

function base64UrlToBase64(input: string): string {
  const value = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = (4 - (value.length % 4)) % 4;
  return `${value}${"=".repeat(padding)}`;
}

function isJwtExpired(token: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 3) return true;

  try {
    const payloadRaw = atob(base64UrlToBase64(parts[1] ?? ""));
    const payload = JSON.parse(payloadRaw) as { exp?: unknown };
    if (typeof payload.exp !== "number") return true;
    return payload.exp * 1000 <= Date.now() + EXPIRY_SKEW_MS;
  } catch {
    return true;
  }
}

async function refreshSession(
  refreshToken: string,
): Promise<RefreshTokenResponse | null> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_ANON_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) return null;

  const res = await fetch(
    `${supabaseUrl}/auth/v1/token?grant_type=refresh_token`,
    {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store",
    },
  );

  if (!res.ok) return null;

  const data = (await res.json()) as Partial<RefreshTokenResponse>;
  if (!data.access_token || !data.refresh_token) return null;

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  };
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (AUTH_PATHS_TO_SKIP.has(pathname)) return NextResponse.next();

  const authorization = req.headers.get("authorization");
  const bearerToken = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : null;
  const accessToken =
    bearerToken ?? req.cookies.get(ACCESS_TOKEN_COOKIE)?.value ?? null;

  if (accessToken && !isJwtExpired(accessToken)) {
    return NextResponse.next();
  }

  const refreshToken = req.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!refreshToken) return NextResponse.next();

  const refreshed = await refreshSession(refreshToken);
  if (!refreshed) return NextResponse.next();

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("Authorization", `Bearer ${refreshed.access_token}`);

  const res = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  const secure = process.env.NODE_ENV === "production";

  res.cookies.set({
    name: ACCESS_TOKEN_COOKIE,
    value: refreshed.access_token,
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
  });

  res.cookies.set({
    name: REFRESH_TOKEN_COOKIE,
    value: refreshed.refresh_token,
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
  });

  return res;
}

export const config = {
  matcher: ["/api/:path*"],
};
