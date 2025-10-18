import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware para proteger rotas administrativas
 * Verifica se o usuário está autenticado antes de acessar dashboard e configurações
 */
export function middleware(request: NextRequest) {
  const caminhoAtual = request.nextUrl.pathname;
  
  // Permitir acesso à página de login sem verificação
  if (caminhoAtual === "/dashboard/login") {
    return NextResponse.next();
  }
  
  // Rotas protegidas (exceto login)
  const rotasProtegidas = ["/dashboard", "/configuracoes"];
  const rotaProtegida = rotasProtegidas.some(rota => 
    caminhoAtual.startsWith(rota)
  );

  if (rotaProtegida) {
    // Verifica se existe token de autenticação
    const adminToken = request.cookies.get("admin_autenticado");
    
    if (!adminToken) {
      // Redireciona para login administrativo se não estiver autenticado
      const urlLogin = new URL("/dashboard/login", request.url);
      urlLogin.searchParams.set("redirect", caminhoAtual);
      return NextResponse.redirect(urlLogin);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/configuracoes/:path*"],
};
