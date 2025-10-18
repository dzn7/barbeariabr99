"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, User, Scissors, MapPin, LogOut, Plus, XCircle } from "lucide-react";
import { Button, Badge } from "@radix-ui/themes";
import { useAutenticacao } from "@/contexts/AutenticacaoContext";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Agendamento {
  id: string;
  data_hora: string;
  status: string;
  observacoes: string | null;
  barbeiros: { nome: string } | null;
  servicos: { nome: string; preco: number } | null;
}

/**
 * Página Meus Agendamentos
 * Cliente visualiza seus próprios agendamentos
 */
export default function PaginaMeusAgendamentos() {
  const { usuario, sair, carregando: autenticacaoCarregando } = useAutenticacao();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [processandoId, setProcessandoId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!autenticacaoCarregando && !usuario) {
      router.push("/entrar");
      return;
    }

    if (usuario) {
      buscarAgendamentos();
    }
  }, [usuario, autenticacaoCarregando, router]);

  const buscarAgendamentos = async () => {
    try {
      if (!usuario) return;

      // Buscar cliente pelo user_id
      const { data: cliente, error: erroCliente } = await supabase
        .from("clientes")
        .select("id")
        .eq("user_id", usuario.id)
        .single();

      if (erroCliente) {
        console.error("Erro ao buscar cliente:", erroCliente);
        return;
      }

      // Buscar agendamentos do cliente
      const { data, error } = await supabase
        .from("agendamentos")
        .select(`
          *,
          barbeiros (nome),
          servicos (nome, preco)
        `)
        .eq("cliente_id", cliente.id)
        .order("data_hora", { ascending: false });

      if (error) {
        console.error("Erro ao buscar agendamentos:", error);
        return;
      }

      console.log("Agendamentos encontrados:", data);
      setAgendamentos(data || []);
    } catch (error) {
      console.error("Erro:", error);
    } finally {
      setCarregando(false);
    }
  };

  const handleSair = async () => {
    await sair();
    router.push("/");
  };

  const handleNovoAgendamento = () => {
    router.push("/agendamento");
  };

  const cancelarAgendamento = async (id: string) => {
    const confirmacao = window.confirm(
      "Tem certeza que deseja cancelar este agendamento?\n\nEsta ação não pode ser desfeita."
    );

    if (!confirmacao) return;

    setProcessandoId(id);
    try {
      console.log("Cancelando agendamento:", id);

      const { error } = await supabase
        .from("agendamentos")
        .update({ status: "cancelado" })
        .eq("id", id);

      if (error) {
        console.error("Erro ao cancelar:", error);
        throw error;
      }

      console.log("Agendamento cancelado com sucesso");

      // Atualizar estado local imediatamente
      setAgendamentos((prev) =>
        prev.map((ag) =>
          ag.id === id ? { ...ag, status: "cancelado" } : ag
        )
      );

      // Recarregar para garantir sincronização
      setTimeout(() => {
        buscarAgendamentos();
      }, 1000);
    } catch (error: any) {
      console.error("Erro ao cancelar agendamento:", error);
      alert(`Erro ao cancelar: ${error.message}`);
    } finally {
      setProcessandoId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pendente":
        return "yellow";
      case "confirmado":
        return "blue";
      case "concluido":
        return "green";
      case "cancelado":
        return "red";
      default:
        return "gray";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pendente":
        return "Pendente";
      case "confirmado":
        return "Confirmado";
      case "concluido":
        return "Concluído";
      case "cancelado":
        return "Cancelado";
      default:
        return status;
    }
  };

  if (autenticacaoCarregando || carregando) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-zinc-900 dark:border-white mb-4"></div>
          <p className="text-zinc-600 dark:text-zinc-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
              Meus Agendamentos
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Olá, {usuario.user_metadata?.nome || usuario.email}!
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleNovoAgendamento}
              className="bg-zinc-900 dark:bg-white text-white dark:text-black cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Agendamento
            </Button>
            <Button
              onClick={handleSair}
              variant="outline"
              className="cursor-pointer"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>

        {/* Lista de Agendamentos */}
        {agendamentos.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl p-12 text-center border border-zinc-200 dark:border-zinc-800"
          >
            <Calendar className="w-16 h-16 mx-auto text-zinc-400 mb-4" />
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
              Nenhum agendamento ainda
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              Faça seu primeiro agendamento e apareça aqui!
            </p>
            <Button
              onClick={handleNovoAgendamento}
              className="bg-zinc-900 dark:bg-white text-white dark:text-black cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agendar Agora
            </Button>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            {agendamentos.map((agendamento, index) => (
              <motion.div
                key={agendamento.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {/* Informações Principais */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <Badge color={getStatusColor(agendamento.status)} size="2">
                        {getStatusLabel(agendamento.status)}
                      </Badge>
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">
                        #{agendamento.id.slice(0, 8)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                        <Calendar className="w-4 h-4 text-zinc-500" />
                        <span>
                          {format(new Date(agendamento.data_hora), "dd 'de' MMMM 'de' yyyy", {
                            locale: ptBR,
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                        <Clock className="w-4 h-4 text-zinc-500" />
                        <span>
                          {format(new Date(agendamento.data_hora), "HH:mm", { locale: ptBR })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                        <User className="w-4 h-4 text-zinc-500" />
                        <span>{agendamento.barbeiros?.nome || "Não definido"}</span>
                      </div>

                      <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                        <Scissors className="w-4 h-4 text-zinc-500" />
                        <span>{agendamento.servicos?.nome || "Serviço"}</span>
                      </div>
                    </div>

                    {agendamento.observacoes && (
                      <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                        <strong>Observações:</strong> {agendamento.observacoes}
                      </div>
                    )}
                  </div>

                  {/* Preço e Ações */}
                  <div className="md:text-right space-y-3">
                    {agendamento.servicos && (
                      <div className="text-2xl font-bold text-zinc-900 dark:text-white">
                        R$ {agendamento.servicos.preco.toFixed(2)}
                      </div>
                    )}
                    
                    {/* Botão de Cancelar - apenas para agendamentos não concluídos/cancelados */}
                    {agendamento.status !== "concluido" && agendamento.status !== "cancelado" && (
                      <Button
                        size="2"
                        variant="soft"
                        color="red"
                        className="cursor-pointer w-full md:w-auto"
                        onClick={() => cancelarAgendamento(agendamento.id)}
                        disabled={processandoId === agendamento.id}
                      >
                        {processandoId === agendamento.id ? (
                          "Cancelando..."
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 mr-2" />
                            Cancelar
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
