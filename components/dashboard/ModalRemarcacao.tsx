"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Clock, User, AlertCircle, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@radix-ui/themes";
import { format, addDays, setHours, setMinutes, parseISO, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { gerarTodosHorarios } from "@/lib/horarios";

const BOT_URL = process.env.NEXT_PUBLIC_BOT_URL || 'https://barbearia-bot.fly.dev';

interface Agendamento {
  id: string;
  data_hora: string;
  status: string;
  clientes: {
    nome: string;
    telefone: string;
  };
  barbeiros: {
    id: string;
    nome: string;
  };
  servicos: {
    nome: string;
    preco: number;
    duracao: number;
  };
}

interface HorarioDisponivel {
  hora: string;
  disponivel: boolean;
  agendamento?: {
    cliente: string;
    servico: string;
  };
}

interface ModalRemarcacaoProps {
  agendamento: Agendamento;
  aberto: boolean;
  onFechar: () => void;
  onSucesso: () => void;
}

/**
 * Modal Inteligente de Remarcação
 * Mostra disponibilidade de horários em tempo real
 */
export function ModalRemarcacao({ agendamento, aberto, onFechar, onSucesso }: ModalRemarcacaoProps) {
  const [dataSelecionada, setDataSelecionada] = useState<Date>(new Date());
  const [horarioSelecionado, setHorarioSelecionado] = useState<string>("");
  const [horariosDisponiveis, setHorariosDisponiveis] = useState<HorarioDisponivel[]>([]);
  const [motivo, setMotivo] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Gerar próximos 14 dias
  const proximosDias = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i));

  useEffect(() => {
    if (aberto && dataSelecionada) {
      buscarHorariosDisponiveis();
    }
  }, [dataSelecionada, aberto]);

  const buscarHorariosDisponiveis = async () => {
    setCarregando(true);
    try {
      // Buscar agendamentos do barbeiro nesta data
      const inicioDia = new Date(dataSelecionada);
      inicioDia.setHours(0, 0, 0, 0);
      
      const fimDia = new Date(dataSelecionada);
      fimDia.setHours(23, 59, 59, 999);

      console.log("🔍 Buscando agendamentos para:", {
        barbeiro_id: agendamento.barbeiros.id,
        barbeiro_nome: agendamento.barbeiros.nome,
        data: format(dataSelecionada, "dd/MM/yyyy"),
        inicioDia: inicioDia.toISOString(),
        fimDia: fimDia.toISOString(),
      });

      // Buscar agendamentos do barbeiro nesta data
      const { data: agendamentosData, error: erroAgendamentos } = await supabase
        .from("agendamentos")
        .select(`
          id,
          data_hora,
          status,
          servicos (nome, duracao)
        `)
        .eq("barbeiro_id", agendamento.barbeiros.id)
        .gte("data_hora", inicioDia.toISOString())
        .lte("data_hora", fimDia.toISOString())
        .neq("status", "cancelado");

      if (erroAgendamentos) {
        console.error("❌ Erro ao buscar agendamentos:", erroAgendamentos);
        setCarregando(false);
        return;
      }

      console.log("✅ Agendamentos encontrados:", agendamentosData?.length || 0);

      // Converter agendamentos para formato {horario, duracao}
      const horariosOcupados = (agendamentosData || [])
        .filter((ag: any) => ag.id !== agendamento.id) // Excluir o agendamento atual
        .map((ag: any) => ({
          horario: format(parseISO(ag.data_hora), "HH:mm"),
          duracao: ag.servicos?.duracao || 30
        }));

      console.log("🔴 Horários ocupados:", horariosOcupados);

      // Gerar todos os horários com intervalo de 20 minutos
      const duracaoServico = agendamento.servicos.duracao;
      const todosHorarios = gerarTodosHorarios(duracaoServico, horariosOcupados, {
        inicio: "08:00",
        fim: "18:00",
        intervaloHorarios: 20 // 20 minutos
      });

      console.log("📋 Total de horários gerados:", todosHorarios.length);

      // Converter para formato do componente
      const horarios: HorarioDisponivel[] = todosHorarios.map((h) => {
        const ocupado = horariosOcupados.find((ho: any) => ho.horario === h.horario);
        
        return {
          hora: h.horario,
          disponivel: h.disponivel,
          agendamento: ocupado ? {
            cliente: "Ocupado",
            servico: "Agendamento existente"
          } : undefined
        };
      });

      console.log("✅ Horários disponíveis:", horarios.filter(h => h.disponivel).length);
      setHorariosDisponiveis(horarios);
    } catch (error) {
      console.error("Erro ao buscar horários:", error);
    } finally {
      setCarregando(false);
    }
  };

  const remarcar = async () => {
    if (!horarioSelecionado) {
      alert("⚠️ Selecione um horário");
      return;
    }

    setSalvando(true);
    try {
      const [h, m] = horarioSelecionado.split(":").map(Number);
      const novaDataHora = setMinutes(setHours(new Date(dataSelecionada), h), m);

      // Atualizar agendamento
      const { error: erroUpdate } = await supabase
        .from("agendamentos")
        .update({ data_hora: novaDataHora.toISOString() })
        .eq("id", agendamento.id);

      if (erroUpdate) throw erroUpdate;

      // Registrar histórico
      await supabase.from("historico_agendamentos").insert({
        agendamento_id: agendamento.id,
        data_hora_anterior: agendamento.data_hora,
        data_hora_nova: novaDataHora.toISOString(),
        motivo: motivo || "Remarcação via dashboard",
        alterado_por: localStorage.getItem("admin_email") || "admin",
      });

      // Notificar cliente
      await notificarCliente(novaDataHora);

      alert("✅ Agendamento remarcado com sucesso!");
      onSucesso();
      onFechar();
    } catch (error) {
      console.error("Erro ao remarcar:", error);
      alert("❌ Erro ao remarcar agendamento");
    } finally {
      setSalvando(false);
    }
  };

  const notificarCliente = async (novaDataHora: Date) => {
    try {
      const dataFormatada = format(novaDataHora, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
      const mensagem = `🔄 *Agendamento Remarcado*\n\nOlá ${agendamento.clientes.nome}!\n\nSeu agendamento foi remarcado:\n\n📅 *Nova Data:* ${dataFormatada}\n✂️ *Serviço:* ${agendamento.servicos.nome}\n👤 *Barbeiro:* ${agendamento.barbeiros.nome}\n💰 *Valor:* R$ ${agendamento.servicos.preco.toFixed(2)}\n\n${motivo ? `📝 *Motivo:* ${motivo}\n\n` : ""}Qualquer dúvida, entre em contato!\n\n_Barbearia BR99_`;

      // Limpar e formatar número
      let telefone = agendamento.clientes.telefone.replace(/\D/g, '');
      
      // Adicionar código do país se não tiver
      if (!telefone.startsWith('55')) {
        telefone = '55' + telefone;
      }
      
      // Remover o 9 extra se tiver 13 dígitos (formato antigo)
      if (telefone.length === 13 && telefone.charAt(4) === '9') {
        telefone = telefone.substring(0, 4) + telefone.substring(5);
      }

      await fetch(`${BOT_URL}/api/mensagens/enviar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numero: telefone,
          mensagem,
        }),
      });
    } catch (error) {
      console.error("Erro ao notificar:", error);
    }
  };

  if (!aberto) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                Remarcar Agendamento
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                {agendamento.clientes.nome} • {agendamento.servicos.nome}
              </p>
            </div>
            <button
              onClick={onFechar}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Seleção de Data */}
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Selecione a Data
                </h3>
                <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                  {proximosDias.map((dia) => {
                    const ehHoje = isSameDay(dia, new Date());
                    const ehSelecionado = isSameDay(dia, dataSelecionada);
                    const ehDomingo = dia.getDay() === 0;

                    return (
                      <button
                        key={dia.toISOString()}
                        onClick={() => {
                          if (!ehDomingo) {
                            setDataSelecionada(dia);
                            setHorarioSelecionado("");
                          }
                        }}
                        disabled={ehDomingo}
                        className={`p-3 rounded-lg text-left transition-all ${
                          ehDomingo
                            ? "bg-zinc-100 dark:bg-zinc-800 opacity-50 cursor-not-allowed"
                            : ehSelecionado
                            ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-lg"
                            : "bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                        }`}
                      >
                        <div className="text-xs text-zinc-600 dark:text-zinc-400">
                          {format(dia, "EEE", { locale: ptBR })}
                        </div>
                        <div className="text-lg font-bold">
                          {format(dia, "dd/MM")}
                        </div>
                        {ehHoje && (
                          <div className="text-xs text-blue-600 dark:text-blue-400">Hoje</div>
                        )}
                        {ehDomingo && (
                          <div className="text-xs text-red-600 dark:text-red-400">Fechado</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Seleção de Horário */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Selecione o Horário (intervalo de 20min)
                  </h3>
                  {!carregando && (
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {horariosDisponiveis.filter(h => h.disponivel).length} disponíveis
                    </span>
                  )}
                </div>
                {carregando ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-white"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 max-h-96 overflow-y-auto pr-2">
                    {horariosDisponiveis.map((horario) => {
                      const ehSelecionado = horarioSelecionado === horario.hora;

                      return (
                        <button
                          key={horario.hora}
                          onClick={() => {
                            if (horario.disponivel) {
                              setHorarioSelecionado(horario.hora);
                            }
                          }}
                          disabled={!horario.disponivel}
                          className={`p-2.5 rounded-lg text-center transition-all relative ${
                            !horario.disponivel
                              ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 cursor-not-allowed opacity-60"
                              : ehSelecionado
                              ? "bg-green-600 dark:bg-green-500 text-white shadow-lg scale-105"
                              : "bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-green-500 dark:hover:border-green-400 hover:shadow-md"
                          }`}
                        >
                          <div className="flex flex-col items-center gap-1">
                            <span className={`font-bold text-sm ${
                              ehSelecionado 
                                ? "text-white" 
                                : horario.disponivel 
                                ? "text-zinc-900 dark:text-white" 
                                : "text-red-600 dark:text-red-400"
                            }`}>
                              {horario.hora}
                            </span>
                            {horario.disponivel ? (
                              <Check className={`w-3 h-3 ${ehSelecionado ? "text-white" : "text-green-600 dark:text-green-400"}`} />
                            ) : (
                              <X className="w-3 h-3 text-red-600 dark:text-red-400" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
                {!carregando && horariosDisponiveis.length === 0 && (
                  <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                    Nenhum horário disponível para esta data
                  </div>
                )}
              </div>
            </div>

            {/* Motivo */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Motivo da Remarcação (opcional)
              </label>
              <input
                type="text"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ex: Conflito de agenda"
                className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
              />
            </div>

            {/* Alerta */}
            <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-300">
                  O cliente receberá automaticamente uma mensagem no WhatsApp com os novos detalhes.
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-zinc-200 dark:border-zinc-800">
            <Button onClick={onFechar} variant="soft" className="cursor-pointer">
              Cancelar
            </Button>
            <Button
              onClick={remarcar}
              disabled={!horarioSelecionado || salvando}
              className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 cursor-pointer"
            >
              {salvando ? "Remarcando..." : "Remarcar e Notificar"}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
