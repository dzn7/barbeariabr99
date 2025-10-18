"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Scissors, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Button, TextField, Card } from "@radix-ui/themes";
import { useRouter } from "next/navigation";
import Link from "next/link";

/**
 * Página de login para acesso administrativo
 * Apenas funcionários autorizados podem acessar dashboard e configurações
 */
export default function PaginaLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  /**
   * Processa o login do usuário
   * Credencial mestre: derick123 / Derick2020@
   */
  const processarLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      // Credencial mestre do proprietário
      if (email === "derick123" && senha === "Derick2020@") {
        // Salva sessão
        localStorage.setItem("auth-token", "master-token");
        localStorage.setItem("user-email", email);
        localStorage.setItem("user-role", "master");
        
        // Redireciona para dashboard
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get("redirect") || "/dashboard";
        router.push(redirect);
      } else {
        // TODO: Integrar com Supabase Auth para outros usuários
        // const { data, error } = await supabase.auth.signInWithPassword({
        //   email,
        //   password: senha,
        // });
        
        setErro("Email ou senha incorretos");
      }
    } catch (error) {
      setErro("Erro ao fazer login. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          {/* Logo e título */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-zinc-900 dark:bg-zinc-100 rounded-full">
                <Scissors className="h-8 w-8 text-white dark:text-zinc-900" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              Área Administrativa
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Acesso restrito para funcionários
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={processarLogin} className="space-y-6">
            {erro && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg"
              >
                <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>
              </motion.div>
            )}

            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                <TextField.Root
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  size="3"
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                <TextField.Root
                  type={mostrarSenha ? "text" : "password"}
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                  size="3"
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  {mostrarSenha ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              size="3"
              disabled={carregando}
              className="w-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 cursor-pointer"
            >
              {carregando ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          {/* Informações de acesso */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-600 dark:text-blue-400 mb-2 font-medium">
              💡 Acesso Administrativo
            </p>
            <p className="text-xs text-blue-500 dark:text-blue-500">
              Use suas credenciais de administrador para acessar o sistema.
            </p>
          </div>

          {/* Link para voltar */}
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              ← Voltar para o site
            </Link>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
