"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { LogIn, UserPlus, Lock, Mail, User, Phone } from "lucide-react";
import { Button, TextField } from "@radix-ui/themes";
import { useAutenticacao } from "@/contexts/AutenticacaoContext";
import { useRouter } from "next/navigation";

/**
 * Página de Login e Cadastro
 * Permite clientes acessarem suas contas
 */
export default function PaginaEntrar() {
  const [modo, setModo] = useState<"entrar" | "cadastrar">("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [camposTocados, setCamposTocados] = useState({
    nome: false,
    email: false,
    telefone: false,
    senha: false,
  });

  const router = useRouter();
  const { entrar, cadastrar } = useAutenticacao();

  const handleEntrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    const resultado = await entrar(email, senha);

    if (resultado.sucesso) {
      router.push("/meus-agendamentos");
    } else {
      setErro(resultado.erro || "Erro ao entrar. Verifique suas credenciais.");
    }

    setCarregando(false);
  };

  const handleCadastrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");

    // Validações
    if (!nome || !email || !telefone || !senha) {
      setErro("Por favor, preencha todos os campos.");
      return;
    }

    if (senha.length < 6) {
      setErro("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    setCarregando(true);

    const resultado = await cadastrar(email, senha, nome, telefone);

    if (resultado.sucesso) {
      // Cadastro bem-sucedido, fazer login automático
      const resultadoLogin = await entrar(email, senha);
      
      if (resultadoLogin.sucesso) {
        // Redirecionar para tela de boas-vindas
        router.push("/bem-vindo");
      } else {
        setErro("Cadastro realizado, mas erro ao fazer login. Por favor, faça login manualmente.");
        setModo("entrar");
      }
    } else {
      setErro(resultado.erro || "Erro ao cadastrar. Tente novamente.");
    }

    setCarregando(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900 py-12 px-4">
      <div className="max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-8 border border-zinc-200 dark:border-zinc-800"
        >
          {/* Cabeçalho */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-900 dark:bg-white mb-4">
              {modo === "entrar" ? (
                <LogIn className="w-8 h-8 text-white dark:text-black" />
              ) : (
                <UserPlus className="w-8 h-8 text-white dark:text-black" />
              )}
            </div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
              {modo === "entrar" ? "Bem-vindo de volta!" : "Criar conta"}
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              {modo === "entrar"
                ? "Entre para ver seus agendamentos"
                : "Cadastre-se para agendar cortes"}
            </p>
          </div>

          {/* Seletor de Modo */}
          <div className="flex gap-2 mb-6 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
            <button
              onClick={() => setModo("entrar")}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                modo === "entrar"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow"
                  : "text-zinc-600 dark:text-zinc-400"
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => setModo("cadastrar")}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                modo === "cadastrar"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow"
                  : "text-zinc-600 dark:text-zinc-400"
              }`}
            >
              Cadastrar
            </button>
          </div>

          {/* Mensagem de Erro */}
          {erro && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mb-4 p-3 rounded-lg bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-900"
            >
              <p className="text-sm text-red-800 dark:text-red-400">{erro}</p>
            </motion.div>
          )}

          {/* Formulário de Entrada */}
          {modo === "entrar" && (
            <form onSubmit={handleEntrar} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <TextField.Root
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <TextField.Root
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={carregando}
                className="w-full bg-zinc-900 dark:bg-white text-white dark:text-black py-3 rounded-lg font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                {carregando ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          )}

          {/* Formulário de Cadastro */}
          {modo === "cadastrar" && (
            <form onSubmit={handleCadastrar} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Nome Completo
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <TextField.Root
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="João Silva"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <TextField.Root
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Telefone <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                    camposTocados.telefone && !telefone ? 'text-red-500' : 'text-zinc-400'
                  }`} />
                  <TextField.Root
                    type="tel"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    onBlur={() => setCamposTocados({ ...camposTocados, telefone: true })}
                    placeholder="(11) 98765-4321"
                    className={`pl-10 ${
                      camposTocados.telefone && !telefone 
                        ? 'border-red-500 focus:border-red-500 ring-red-500' 
                        : ''
                    }`}
                    required
                  />
                </div>
                {camposTocados.telefone && !telefone && (
                  <p className="text-xs text-red-500 mt-1">Telefone é obrigatório</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <TextField.Root
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10"
                    required
                  />
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Mínimo de 6 caracteres
                </p>
              </div>

              <Button
                type="submit"
                disabled={carregando}
                className="w-full bg-zinc-900 dark:bg-white text-white dark:text-black py-3 rounded-lg font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                {carregando ? "Cadastrando..." : "Criar Conta"}
              </Button>
            </form>
          )}

          {/* Link Alternativo */}
          <div className="mt-6 text-center">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {modo === "entrar" ? (
                <>
                  Não tem uma conta?{" "}
                  <button
                    onClick={() => setModo("cadastrar")}
                    className="text-zinc-900 dark:text-white font-semibold hover:underline"
                  >
                    Cadastre-se
                  </button>
                </>
              ) : (
                <>
                  Já tem uma conta?{" "}
                  <button
                    onClick={() => setModo("entrar")}
                    className="text-zinc-900 dark:text-white font-semibold hover:underline"
                  >
                    Entre
                  </button>
                </>
              )}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
