import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const isPublicRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/cadastro") ||
    pathname.startsWith("/esqueci-senha") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/termos") ||
    pathname.startsWith("/privacidade") ||
    pathname.startsWith("/inativo");

  const isPasswordResetRoute = pathname.startsWith("/redefinir-senha");

  if (!user && !isPublicRoute && !isPasswordResetRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  const isAdminRoute = pathname.startsWith("/admin");
  const isApiRoute = pathname.startsWith("/api");
  const isOnboarding = pathname.startsWith("/onboarding");

  if (user && !isAdminRoute && !isApiRoute && !isOnboarding && !isPublicRoute) {
    const { data: perfil } = await supabase
      .from("perfis")
      .select("tenant_id")
      .eq("user_id", user.id)
      .single();

    if (perfil?.tenant_id) {
      const { data: tenant } = await supabase
        .from("tenants")
        .select("ativo")
        .eq("id", perfil.tenant_id)
        .single();

      if (tenant && tenant.ativo === false) {
        const url = request.nextUrl.clone();
        url.pathname = "/inativo";
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}
