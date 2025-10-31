"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ChevronLeft, ChevronRight, Calendar, User, Scissors, CheckCircle, XCircle, MessageCircle, Trash2, X, Clock } from "lucide-react";
import { format, addDays, startOfWeek, isSameDay, parseISO, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/lib/supabase";
import { TextField, Select, Button } from "@radix-ui/themes";

interface Agendamento {
  id: string;
  data_hora: string;
  status: string;
  observacoes?: string;
  clientes: {
    nome: string;
    telefone: string;
  };
  barbeiros: {
    nome: string;
  };
  servicos: {
    nome: string;
    preco: number;
    duracao: number;
  };
}

const HORAS_DIA = Array.from({ length: 12 }, (_, i) => i + 8); // 08:00 às 19:00
const DIAS_SEMANA = ['DOM.', 'SEG.', 'TER.', 'QUA.', 'QUI.', 'SEX.', 'SÁB.'];
const ALTURA_HORA = 120; // Altura em pixels de cada hora (maior para cards legíveis)

const CORES_STATUS = {
  pendente: 'bg-yellow-600',
  confirmado: 'bg-teal-600',
  concluido: 'bg-green-600',
  cancelado: 'bg-red-600',
};

export function CalendarioSemanal() {
  const [diaSelecionado, setDiaSelecionado] = useState(new Date());
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<Agendamento | null>(null);
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);
  const [visualizacaoCompacta, setVisualizacaoCompacta] = useState(true);
  
  // Estados para novo agendamento
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [modalDataAberto, setModalDataAberto] = useState(false);
  const [modalHoraAberto, setModalHoraAberto] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [mensagemErro, setMensagemErro] = useState("");
  const [novoAgendamento, setNovoAgendamento] = useState({
    clienteNome: "",
    clienteTelefone: "",
    data: format(new Date(), "yyyy-MM-dd"),
    hora: "09:00",
    barbeiroId: "",
    servicoId: "",
  });
  const [barbeiros, setBarbeiros] = useState<any[]>([]);
  const [servicos, setServicos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);

  // Calcular semana do dia selecionado
  const diasSemana = useMemo(() => {
    const inicioDaSemana = startOfWeek(diaSelecionado, { weekStartsOn: 0 });
    return Array.from({ length: 7 }, (_, i) => addDays(inicioDaSemana, i));
  }, [diaSelecionado]);

  // Buscar agendamentos do dia selecionado
  useEffect(() => {
    buscarAgendamentos();
  }, [diaSelecionado]);

  // Carregar dados do formulário
  useEffect(() => {
    carregarDadosFormulario();
  }, []);

  const carregarDadosFormulario = async () => {
    try {
      const [barbeirosRes, servicosRes, clientesRes] = await Promise.all([
        supabase.from('barbeiros').select('id, nome').eq('ativo', true),
        supabase.from('servicos').select('id, nome, preco').eq('ativo', true),
        supabase.from('clientes').select('id, nome, telefone').eq('ativo', true),
      ]);

      if (barbeirosRes.data) setBarbeiros(barbeirosRes.data);
      if (servicosRes.data) setServicos(servicosRes.data);
      if (clientesRes.data) setClientes(clientesRes.data);

      if (barbeirosRes.data && barbeirosRes.data.length > 0) {
        setNovoAgendamento(prev => ({ ...prev, barbeiroId: barbeirosRes.data[0].id }));
      }
      if (servicosRes.data && servicosRes.data.length > 0) {
        setNovoAgendamento(prev => ({ ...prev, servicoId: servicosRes.data[0].id }));
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const salvarNovoAgendamento = async () => {
    try {
      setProcessando(true);
      setMensagemErro("");

      if (!novoAgendamento.clienteNome.trim()) {
        setMensagemErro("Por favor, digite o nome do cliente");
        return;
      }
      if (!novoAgendamento.clienteTelefone.trim()) {
        setMensagemErro("Por favor, digite o telefone");
        return;
      }
      if (!novoAgendamento.barbeiroId) {
        setMensagemErro("Por favor, selecione um barbeiro");
        return;
      }
      if (!novoAgendamento.servicoId) {
        setMensagemErro("Por favor, selecione um serviço");
        return;
      }

      const clienteExistente = clientes.find(c => c.nome.toLowerCase() === novoAgendamento.clienteNome.toLowerCase());
      let clienteId = clienteExistente?.id;

      if (!clienteId) {
        const { data: novoCliente, error: erroCliente } = await supabase
          .from('clientes')
          .insert([{ nome: novoAgendamento.clienteNome, telefone: novoAgendamento.clienteTelefone, ativo: true }])
          .select()
          .single();

        if (erroCliente) throw erroCliente;
        clienteId = novoCliente.id;
      }

      const dataHora = `${novoAgendamento.data}T${novoAgendamento.hora}:00`;

      const { error: erroAgendamento } = await supabase
        .from('agendamentos')
        .insert([{
          cliente_id: clienteId,
          barbeiro_id: novoAgendamento.barbeiroId,
          servico_id: novoAgendamento.servicoId,
          data_hora: dataHora,
          status: 'pendente',
        }]);

      if (erroAgendamento) throw erroAgendamento;

      setModalNovoAberto(false);
      buscarAgendamentos();
      setNovoAgendamento({
        clienteNome: "",
        clienteTelefone: "",
        data: format(new Date(), "yyyy-MM-dd"),
        hora: "09:00",
        barbeiroId: barbeiros.length > 0 ? barbeiros[0].id : "",
        servicoId: servicos.length > 0 ? servicos[0].id : "",
      });
    } catch (error) {
      console.error('Erro ao salvar:', error);
      setMensagemErro("Erro ao criar agendamento");
    } finally {
      setProcessando(false);
    }
  };

  const buscarAgendamentos = async () => {
    try {
      setCarregando(true);
      const inicio = new Date(diaSelecionado);
      inicio.setHours(0, 0, 0, 0);
      const fim = new Date(diaSelecionado);
      fim.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          *,
          clientes (nome, telefone),
          barbeiros (nome),
          servicos (nome, preco, duracao)
        `)
        .gte('data_hora', inicio.toISOString())
        .lte('data_hora', fim.toISOString())
        .order('data_hora', { ascending: true });

      if (error) throw error;
      setAgendamentos(data || []);
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
    } finally {
      setCarregando(false);
    }
  };

  // Calcular horários a exibir (compacto ou completo)
  const horariosExibir = useMemo(() => {
    if (!visualizacaoCompacta || agendamentos.length === 0) {
      return HORAS_DIA;
    }

    // Pegar primeira e última hora com agendamentos
    const horasComAgendamentos = agendamentos.map(ag => {
      const data = parseISO(ag.data_hora);
      return data.getHours();
    });

    const primeiraHora = Math.max(8, Math.min(...horasComAgendamentos) - 1);
    const ultimaHora = Math.min(19, Math.max(...horasComAgendamentos) + 1);

    return Array.from({ length: ultimaHora - primeiraHora + 1 }, (_, i) => primeiraHora + i);
  }, [agendamentos, visualizacaoCompacta]);

  // Calcular posição e altura do agendamento na grade
  const calcularPosicaoAgendamento = (dataHora: string, duracao: number) => {
    const data = parseISO(dataHora);
    const hora = data.getHours();
    const minutos = data.getMinutes();
    
    const horaInicial = visualizacaoCompacta && horariosExibir.length > 0 ? horariosExibir[0] : 8;
    const top = ((hora - horaInicial) * ALTURA_HORA) + ((minutos / 60) * ALTURA_HORA);
    const height = (duracao / 60) * ALTURA_HORA;
    
    return { top, height };
  };

  // Confirmar agendamento
  const confirmarAgendamento = async () => {
    if (!agendamentoSelecionado) return;
    
    try {
      const { error } = await supabase
        .from('agendamentos')
        .update({ status: 'confirmado' })
        .eq('id', agendamentoSelecionado.id);

      if (error) throw error;
      
      setModalDetalhesAberto(false);
      buscarAgendamentos();
    } catch (error) {
      console.error('Erro ao confirmar:', error);
    }
  };

  // Cancelar agendamento
  const cancelarAgendamento = async () => {
    if (!agendamentoSelecionado) return;
    
    try {
      const { error } = await supabase
        .from('agendamentos')
        .update({ status: 'cancelado' })
        .eq('id', agendamentoSelecionado.id);

      if (error) throw error;
      
      setModalDetalhesAberto(false);
      buscarAgendamentos();
    } catch (error) {
      console.error('Erro ao cancelar:', error);
    }
  };

  // Enviar WhatsApp
  const enviarWhatsApp = () => {
    if (!agendamentoSelecionado?.clientes?.telefone) return;
    
    const mensagem = `Olá ${agendamentoSelecionado.clientes.nome}! Confirmando seu agendamento para ${format(parseISO(agendamentoSelecionado.data_hora), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`;
    const telefone = agendamentoSelecionado.clientes.telefone.replace(/\D/g, '');
    window.open(`https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`, '_blank');
  };

  // Deletar agendamento
  const deletarAgendamento = async () => {
    if (!agendamentoSelecionado) return;
    
    if (!confirm('Tem certeza que deseja deletar este agendamento?')) return;
    
    try {
      const { error } = await supabase
        .from('agendamentos')
        .delete()
        .eq('id', agendamentoSelecionado.id);

      if (error) throw error;
      
      setModalDetalhesAberto(false);
      buscarAgendamentos();
    } catch (error) {
      console.error('Erro ao deletar:', error);
    }
  };

  return (
    <div className="space-y-4 w-full">
      {/* Navegação de Semana */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => setDiaSelecionado(subDays(diaSelecionado, 7))}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Semana Anterior
        </button>
        
        <button
          onClick={() => setDiaSelecionado(new Date())}
          className="px-6 py-2 text-sm font-bold bg-zinc-900 dark:bg-white text-white dark:text-black rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
        >
          HOJE
        </button>
        
        <button
          onClick={() => setDiaSelecionado(addDays(diaSelecionado, 7))}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
        >
          Próxima Semana
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Seletor de Dias da Semana */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-4">
          {diasSemana.map((dia, index) => {
            const isHoje = isSameDay(dia, new Date());
            const isSelecionado = isSameDay(dia, diaSelecionado);
            
            return (
              <button
                key={index}
                onClick={() => setDiaSelecionado(dia)}
                className={`p-2 sm:p-3 text-center rounded-lg transition-all ${
                  isSelecionado
                    ? 'bg-zinc-900 dark:bg-white'
                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <div className={`text-[10px] sm:text-xs font-semibold mb-1 ${
                  isSelecionado ? 'text-white dark:text-black' : 'text-zinc-500 dark:text-zinc-400'
                }`}>
                  {DIAS_SEMANA[index]}
                </div>
                <div className={`text-xl sm:text-2xl font-bold ${
                  isSelecionado
                    ? 'text-white dark:text-black'
                    : isHoje
                    ? 'bg-black dark:bg-white text-white dark:text-black rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center mx-auto'
                    : 'text-zinc-900 dark:text-white'
                }`}>
                  {format(dia, 'd')}
                </div>
              </button>
            );
          })}
        </div>

        {/* Grade de Horários - APENAS UM DIA */}
        <div className="relative border-t border-zinc-200 dark:border-zinc-800 pt-4">
          <div className="flex">
            {/* Coluna de horas */}
            <div className="w-20 flex-shrink-0 border-r border-zinc-200 dark:border-zinc-800">
              {horariosExibir.map((hora) => (
                <div
                  key={hora}
                  className="px-2 py-1 text-sm font-medium text-zinc-500 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800"
                  style={{ height: `${ALTURA_HORA}px` }}
                >
                  {String(hora).padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {/* Coluna do dia selecionado */}
            <div className="flex-1 relative">
              {/* Linhas de hora */}
              {horariosExibir.map((hora) => (
                <div
                  key={hora}
                  className="border-b border-zinc-100 dark:border-zinc-800"
                  style={{ height: `${ALTURA_HORA}px` }}
                />
              ))}

              {/* Agendamentos */}
              <div className="absolute inset-0 px-2">
                {agendamentos.map((agendamento) => {
                  const { top, height } = calcularPosicaoAgendamento(
                    agendamento.data_hora,
                    agendamento.servicos?.duracao || 40
                  );
                  const cor = CORES_STATUS[agendamento.status as keyof typeof CORES_STATUS] || CORES_STATUS.pendente;

                  return (
                    <motion.div
                      key={agendamento.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={() => {
                        setAgendamentoSelecionado(agendamento);
                        setModalDetalhesAberto(true);
                      }}
                      className={`absolute left-2 right-2 ${cor} rounded-lg p-3 text-white shadow-lg cursor-pointer overflow-hidden hover:scale-105 transition-transform`}
                      style={{
                        top: `${top}px`,
                        height: `${Math.max(height, 60)}px`,
                      }}
                    >
                      <div className="text-sm font-bold mb-1">
                        {format(parseISO(agendamento.data_hora), 'HH:mm')} - {format(new Date(new Date(agendamento.data_hora).getTime() + (agendamento.servicos?.duracao || 40) * 60000), 'HH:mm')}
                      </div>
                      <div className="text-base font-semibold truncate">
                        {agendamento.clientes?.nome}
                      </div>
                      <div className="text-sm opacity-90 truncate">
                        {agendamento.servicos?.nome}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Botão flutuante de adicionar */}
      <button
        onClick={() => setModalNovoAberto(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-black dark:bg-white text-white dark:text-black rounded-full shadow-lg hover:scale-110 transition-transform flex items-center justify-center z-50"
      >
        <Plus className="w-6 h-6" />
      </button>

      {carregando && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-zinc-900 dark:border-white"></div>
        </div>
      )}

      {/* Modal de Detalhes do Agendamento */}
      {modalDetalhesAberto && agendamentoSelecionado && (
        <div
          className="fixed inset-0 flex items-center justify-center z-[9999] p-4"
          style={{ top: 0, left: 0, right: 0, bottom: 0, position: 'fixed' }}
          onClick={() => setModalDetalhesAberto(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-zinc-900 rounded-xl p-6 w-full max-w-md border border-zinc-200 dark:border-zinc-800 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                Detalhes do Agendamento
              </h3>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                agendamentoSelecionado.status === 'concluido' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                agendamentoSelecionado.status === 'cancelado' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                agendamentoSelecionado.status === 'confirmado' ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400' :
                'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
              }`}>
                {agendamentoSelecionado.status}
              </span>
              <button
                onClick={() => setModalDetalhesAberto(false)}
                className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
              </button>
              </div>
            </div>

            <div className="space-y-4">
              {/* Data e Hora */}
              <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4">
                <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400 mb-2">
                  <Calendar className="w-5 h-5" />
                  <span className="text-sm font-medium">Data e Hora</span>
                </div>
                <p className="text-lg font-bold text-zinc-900 dark:text-white ml-8">
                  {format(parseISO(agendamentoSelecionado.data_hora), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>

              {/* Cliente */}
              <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4">
                <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400 mb-2">
                  <User className="w-5 h-5" />
                  <span className="text-sm font-medium">Cliente</span>
                </div>
                <p className="text-lg font-bold text-zinc-900 dark:text-white ml-8">
                  {agendamentoSelecionado.clientes?.nome}
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 ml-8">
                  {agendamentoSelecionado.clientes?.telefone || 'Sem telefone'}
                </p>
              </div>

              {/* Serviço */}
              <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4">
                <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400 mb-2">
                  <Scissors className="w-5 h-5" />
                  <span className="text-sm font-medium">Serviço</span>
                </div>
                <p className="text-lg font-bold text-zinc-900 dark:text-white ml-8">
                  {agendamentoSelecionado.servicos?.nome}
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 ml-8">
                  R$ {agendamentoSelecionado.servicos?.preco?.toFixed(2)} • {agendamentoSelecionado.servicos?.duracao}min
                </p>
              </div>

              {/* Barbeiro */}
              <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4">
                <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400 mb-2">
                  <User className="w-5 h-5" />
                  <span className="text-sm font-medium">Barbeiro</span>
                </div>
                <p className="text-lg font-bold text-zinc-900 dark:text-white ml-8">
                  {agendamentoSelecionado.barbeiros?.nome}
                </p>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="mt-6 space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={confirmarAgendamento}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                >
                  <CheckCircle className="w-5 h-5" />
                  Confirmar
                </button>
                <button
                  onClick={cancelarAgendamento}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                >
                  <XCircle className="w-5 h-5" />
                  Cancelar
                </button>
                <button
                  onClick={enviarWhatsApp}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium"
                >
                  <MessageCircle className="w-5 h-5" />
                  WhatsApp
                </button>
              </div>
              
              <button
                onClick={deletarAgendamento}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-700 hover:bg-red-800 text-white rounded-lg transition-colors font-medium"
              >
                <Trash2 className="w-5 h-5" />
                Deletar Agendamento
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal de Novo Agendamento */}
      <AnimatePresence>
        {modalNovoAberto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-[9999] p-4 overflow-hidden"
            style={{ top: 0, left: 0, right: 0, bottom: 0, position: 'fixed' }}
            onClick={() => !processando && setModalNovoAberto(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl p-6 sm:p-8 w-full max-w-md border border-zinc-200 dark:border-zinc-800 shadow-2xl max-h-[95vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-6">
                <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800">
                  <h3 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white">
                    Novo Agendamento
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                    Crie um novo agendamento para um cliente
                  </p>
                </div>

                <div className="space-y-4">
                  {mensagemErro && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-sm text-red-700 dark:text-red-400">{mensagemErro}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      Nome do Cliente
                    </label>
                    <TextField.Root
                      placeholder="Digite o nome do cliente"
                      value={novoAgendamento.clienteNome}
                      onChange={(e) => setNovoAgendamento({ ...novoAgendamento, clienteNome: e.target.value })}
                      size="3"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      Telefone (WhatsApp)
                    </label>
                    <TextField.Root
                      placeholder="(86) 98905-3279"
                      value={novoAgendamento.clienteTelefone}
                      onChange={(e) => setNovoAgendamento({ ...novoAgendamento, clienteTelefone: e.target.value })}
                      size="3"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      Data
                    </label>
                    <Button
                      onClick={() => setModalDataAberto(true)}
                      variant="soft"
                      className="w-full text-left justify-between"
                      size="3"
                    >
                      <span>{format(parseISO(`${novoAgendamento.data}T00:00:00`), "dd/MM/yyyy", { locale: ptBR })}</span>
                      <Calendar className="w-4 h-4" />
                    </Button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      Hora
                    </label>
                    <Button
                      onClick={() => setModalHoraAberto(true)}
                      variant="soft"
                      className="w-full text-left justify-between"
                      size="3"
                    >
                      <div className="flex items-center gap-2">
                        <span>{novoAgendamento.hora}</span>
                        {agendamentos.some(ag => {
                          const agDataHora = format(parseISO(ag.data_hora), 'yyyy-MM-dd HH:mm');
                          return agDataHora.startsWith(`${novoAgendamento.data} ${novoAgendamento.hora}`);
                        }) && (
                          <span className="text-xs text-red-600 dark:text-red-400">(Ocupado)</span>
                        )}
                      </div>
                      <Clock className="w-4 h-4" />
                    </Button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      Barbeiro
                    </label>
                    <Select.Root value={novoAgendamento.barbeiroId} onValueChange={(value) => setNovoAgendamento({ ...novoAgendamento, barbeiroId: value })}>
                      <Select.Trigger placeholder="Selecione um barbeiro" className="w-full" />
                      <Select.Content>
                        {barbeiros.map((barbeiro) => (
                          <Select.Item key={barbeiro.id} value={barbeiro.id}>
                            {barbeiro.nome}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Root>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      Serviço
                    </label>
                    <Select.Root value={novoAgendamento.servicoId} onValueChange={(value) => setNovoAgendamento({ ...novoAgendamento, servicoId: value })}>
                      <Select.Trigger placeholder="Selecione um serviço" className="w-full" />
                      <Select.Content>
                        {servicos.map((servico) => (
                          <Select.Item key={servico.id} value={servico.id}>
                            {servico.nome} - R$ {servico.preco.toFixed(2)}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Root>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <Button
                    onClick={() => setModalNovoAberto(false)}
                    variant="soft"
                    className="flex-1"
                    size="3"
                    disabled={processando}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={salvarNovoAgendamento}
                    className="flex-1 bg-zinc-900 dark:bg-white text-white dark:text-black cursor-pointer"
                    size="3"
                    disabled={processando}
                  >
                    {processando ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white dark:border-black mr-2"></div>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Criar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Seleção de Data */}
      <AnimatePresence>
        {modalDataAberto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-[9999] p-4"
            style={{ top: 0, left: 0, right: 0, bottom: 0, position: 'fixed' }}
            onClick={() => setModalDataAberto(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-zinc-900 rounded-xl p-6 w-full max-w-sm border border-zinc-200 dark:border-zinc-800 shadow-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                  Selecione a Data
                </h3>
                
                <input
                  type="date"
                  value={novoAgendamento.data}
                  onChange={(e) => {
                    setNovoAgendamento({ ...novoAgendamento, data: e.target.value });
                    setModalDataAberto(false);
                  }}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-500"
                />

                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 14 }, (_, i) => addDays(parseISO(`${novoAgendamento.data}T00:00:00`), i - 7)).map((dia) => (
                    <button
                      key={format(dia, 'yyyy-MM-dd')}
                      onClick={() => {
                        setNovoAgendamento({ ...novoAgendamento, data: format(dia, 'yyyy-MM-dd') });
                        setModalDataAberto(false);
                      }}
                      className={`p-2 rounded text-sm font-medium transition-all ${
                        format(dia, 'yyyy-MM-dd') === novoAgendamento.data
                          ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {format(dia, 'd')}
                    </button>
                  ))}
                </div>

                <Button
                  onClick={() => setModalDataAberto(false)}
                  variant="soft"
                  className="w-full"
                  size="2"
                >
                  Fechar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Seleção de Hora */}
      <AnimatePresence>
        {modalHoraAberto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-[9999] p-4"
            style={{ top: 0, left: 0, right: 0, bottom: 0, position: 'fixed' }}
            onClick={() => setModalHoraAberto(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-zinc-900 rounded-xl p-6 w-full max-w-sm border border-zinc-200 dark:border-zinc-800 shadow-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                  Selecione a Hora
                </h3>

                <div className="grid grid-cols-3 gap-2">
                  {Array.from({ length: 33 }, (_, i) => {
                    const horas = 8 + Math.floor((i * 20) / 60);
                    const minutos = (i * 20) % 60;
                    const hora = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
                    
                    // Verificar se o horário está ocupado
                    const horaOcupada = agendamentos.some(ag => {
                      const agData = parseISO(ag.data_hora);
                      const agDataStr = format(agData, 'yyyy-MM-dd');
                      const agHoraStr = format(agData, 'HH:mm');
                      
                      return agDataStr === novoAgendamento.data && agHoraStr === hora;
                    });

                    return (
                      <button
                        key={hora}
                        onClick={() => {
                          if (!horaOcupada) {
                            setNovoAgendamento({ ...novoAgendamento, hora });
                            setModalHoraAberto(false);
                          }
                        }}
                        disabled={horaOcupada}
                        className={`p-2 rounded text-sm font-medium transition-all ${
                          novoAgendamento.hora === hora
                            ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                            : horaOcupada
                            ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400 dark:text-zinc-500 cursor-not-allowed'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700'
                        }`}
                      >
                        {hora}
                      </button>
                    );
                  })}
                </div>

                <Button
                  onClick={() => setModalHoraAberto(false)}
                  variant="soft"
                  className="w-full"
                  size="2"
                >
                  Fechar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
