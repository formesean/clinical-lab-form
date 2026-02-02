import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that require APPROVED (USER or ADMIN)
const APPROVED_PREFIXES = ["/patient", "/home"];

// Routes that require APPROVED ADMIN
const ADMIN_PREFIXES = ["/admin"];

function needsGuard(pathname: string) {
  const isAdmin = ADMIN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const isApproved = isAdmin || APPROVED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  return { isApproved, isAdmin };
}

function readCookie(req: NextRequest, name: string) {
  return req.cookies.get(name)?.value ?? null;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const { isApproved, isAdmin } = needsGuard(pathname);
  if (!isApproved) return NextResponse.next();

  const accessToken = readCookie(req, "sb_access_token");
  if (!accessToken) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const url = req.nextUrl.clone();
  url.pathname = "/api/authz/check";
  url.search = isAdmin ? "?adminOnly=1" : "";

  const resp = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (resp.ok) return NextResponse.next();

  // 401 -> force re-login
  if (resp.status === 401) {
    const r = req.nextUrl.clone();
    r.pathname = "/";
    r.searchParams.set("next", pathname);
    return NextResponse.redirect(r);
  }

  // 403 -> forbidden (you can change this route)
  const f = req.nextUrl.clone();
  f.pathname = "/";
  return NextResponse.redirect(f);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
