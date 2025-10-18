"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, User, Shield, Eye, EyeOff } from "lucide-react";
import { Button, TextField } from "@radix-ui/themes";
import { useRouter } from "next/navigation";

/**
 * Página de Login Administrativo
 * Acesso ao dashboard com chave mestre
 */
export default function LoginAdmin() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const router = useRouter();

  // Credenciais mestras
  const EMAIL_MESTRE = "admin";
  const SENHA_MESTRE = "1503";

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    // Simular delay de verificação
    setTimeout(() => {
      if (email === EMAIL_MESTRE && senha === SENHA_MESTRE) {
        // Salvar token de autenticação no localStorage
        localStorage.setItem("admin_autenticado", "true");
        localStorage.setItem("admin_email", email);
        
        // Salvar cookie para o middleware
        document.cookie = "admin_autenticado=true; path=/; max-age=86400"; // 24 horas
        
        console.log("Login admin bem-sucedido");
        router.push("/dashboard");
      } else {
        setErro("Email ou senha incorretos");
        setCarregando(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4">
      {/* Card de Login */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-8 border border-zinc-200 dark:border-zinc-800">
          {/* Logo/Ícone */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-zinc-900 dark:bg-white rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-white dark:text-zinc-900" />
            </div>
          </div>

          {/* Título */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
              Acesso Administrativo
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Dashboard Barbearia BR99
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Campo Email/Usuário */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Usuário
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <TextField.Root
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Digite o usuário"
                  className="pl-10"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <TextField.Root
                  type={mostrarSenha ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Digite a senha"
                  className="pl-10 pr-10"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  {mostrarSenha ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Mensagem de Erro */}
            {erro && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="p-3 rounded-lg bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-900"
              >
                <p className="text-sm text-red-800 dark:text-red-400 text-center font-medium">
                  🔒 {erro}
                </p>
              </motion.div>
            )}

            {/* Botão de Login */}
            <Button
              type="submit"
              disabled={carregando || !email || !senha}
              className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 py-3 rounded-lg font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              {carregando ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          {/* Rodapé */}
          <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800">
            <p className="text-xs text-center text-zinc-500 dark:text-zinc-500">
              🔐 Acesso restrito apenas para administradores
            </p>
          </div>
        </div>

        {/* Link para voltar */}
        <div className="text-center mt-6">
          <button
            onClick={() => router.push("/")}
            className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            ← Voltar para o site
          </button>
        </div>
      </motion.div>
    </div>
  );
}
