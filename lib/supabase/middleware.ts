import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { Database, UserRole } from "@/types/database";
import { asQueryClient } from "@/lib/supabase/query-client";
import { getRoleHomePath, isAuthPath } from "@/lib/utils/permissions";

type CookieToSet = {
  name: string;
  value: string;
  options?: CookieOptions;
};

type ProfileRoleRow = {
  role: UserRole;
};

const PUBLIC_PATHS = ["/login", "/register", "/forgot-password"];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function redirectTo(request: NextRequest, pathname: string) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = pathname;
  redirectUrl.search = "";
  return NextResponse.redirect(redirectUrl);
}

async function getAuthenticatedHomePath(
  supabase: ReturnType<typeof createServerClient<Database>>,
  userId: string
) {
  const { data } = await asQueryClient(supabase)
    .from<ProfileRoleRow>("profiles")
    .select("role")
    .eq("auth_user_id", userId)
    .limit(1);

  return data?.[0]?.role ? getRoleHomePath(data[0].role) : "/profile-required";
}

export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isProtected = !isPublicPath(pathname);

  if (!user && isProtected) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isAuthPath(pathname)) {
    return redirectTo(request, await getAuthenticatedHomePath(supabase, user.id));
  }

  return response;
}
