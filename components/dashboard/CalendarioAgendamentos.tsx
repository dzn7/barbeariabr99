"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  ChevronLeft, 
  ChevronRight,
  Search,
  CheckCircle,
  XCircle,
  Scissors,
  DollarSign,
  Filter,
  Trash2,
  Plus
} from "lucide-react";
import { format, addDays, isSameDay, parseISO, startOfDay, isToday, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/lib/supabase";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { Badge, Button, TextField, Select } from "@radix-ui/themes";

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

const STATUS_CONFIG = {
  pendente: { 
    bg: "bg-yellow-50 dark:bg-yellow-950/20", 
    border: "border-l-4 border-l-yellow-500", 
    badge: "yellow" as const,
    textColor: "text-yellow-700 dark:text-yellow-400"
  },
  confirmado: { 
    bg: "bg-blue-50 dark:bg-blue-950/20", 
    border: "border-l-4 border-l-blue-500", 
    badge: "blue" as const,
    textColor: "text-blue-700 dark:text-blue-400"
  },
  concluido: { 
    bg: "bg-green-50 dark:bg-green-950/20", 
    border: "border-l-4 border-l-green-500", 
    badge: "green" as const,
    textColor: "text-green-700 dark:text-green-400"
  },
  cancelado: { 
    bg: "bg-red-50 dark:bg-red-950/20", 
    border: "border-l-4 border-l-red-500", 
    badge: "red" as const,
    textColor: "text-red-700 dark:text-red-400"
  },
};

export function CalendarioAgendamentos() {
  const [dataInicio, setDataInicio] = useState(new Date());
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [termoBusca, setTermoBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<Agendamento | null>(null);
  const [modalConfirmacao, setModalConfirmacao] = useState(false);
  const [processando, setProcessando] = useState(false);
  
  // Estados para novo agendamento
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [modalDataAberto, setModalDataAberto] = useState(false);
  const [modalHoraAberto, setModalHoraAberto] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState("");
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

  // Calcular próximos 7 dias
  const diasExibicao = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(startOfDay(dataInicio), i));
  }, [dataInicio]);

  // Buscar agendamentos
  useEffect(() => {
    buscarAgendamentos();
  }, [dataInicio]);

  // Bloquear scroll quando modal está aberto
  useEffect(() => {
    if (modalNovoAberto || modalDataAberto || modalHoraAberto) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.position = 'unset';
      document.body.style.width = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.position = 'unset';
      document.body.style.width = 'unset';
    };
  }, [modalNovoAberto, modalDataAberto, modalHoraAberto]);

  // Carregar barbeiros, serviços e clientes
  useEffect(() => {
    carregarDadosFormulario();
  }, []);

  const carregarDadosFormulario = async () => {
    try {
      const [barbeirosRes, servicosRes, clientesRes] = await Promise.all([
        supabase.from('barbeiros').select('id, nome').eq('ativo', true),
        supabase.from('servicos').select('id, nome, preco').eq('ativo', true),
        supabase.from('clientes').select('id, nome').order('nome')
      ]);

      if (barbeirosRes.data) {
        setBarbeiros(barbeirosRes.data);
        if (barbeirosRes.data.length > 0 && !novoAgendamento.barbeiroId) {
          setNovoAgendamento(prev => ({ ...prev, barbeiroId: barbeirosRes.data[0].id }));
        }
      }
      if (servicosRes.data) {
        setServicos(servicosRes.data);
        if (servicosRes.data.length > 0 && !novoAgendamento.servicoId) {
          setNovoAgendamento(prev => ({ ...prev, servicoId: servicosRes.data[0].id }));
        }
      }
      if (clientesRes.data) setClientes(clientesRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const buscarAgendamentos = async () => {
    try {
      setCarregando(true);
      const inicio = startOfDay(dataInicio);
      const fim = addDays(inicio, 7);

      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          *,
          clientes (nome, telefone),
          barbeiros (nome),
          servicos (nome, preco, duracao)
        `)
        .gte('data_hora', inicio.toISOString())
        .lt('data_hora', fim.toISOString())
        .order('data_hora', { ascending: true });

      if (error) throw error;
      setAgendamentos(data || []);
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
    } finally {
      setCarregando(false);
    }
  };

  // Filtrar agendamentos
  const agendamentosFiltrados = useMemo(() => {
    return agendamentos.filter(ag => {
      const matchBusca = !termoBusca || 
        ag.clientes?.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
        ag.clientes?.telefone.includes(termoBusca);
      
      const matchStatus = filtroStatus === "todos" || ag.status === filtroStatus;
      
      return matchBusca && matchStatus;
    });
  }, [agendamentos, termoBusca, filtroStatus]);

  // Agrupar agendamentos por dia
  const agendamentosPorDia = useMemo(() => {
    const grupos: { [key: string]: Agendamento[] } = {};
    
    diasExibicao.forEach(dia => {
      const dataKey = format(dia, 'yyyy-MM-dd');
      grupos[dataKey] = [];
    });

    agendamentosFiltrados.forEach(ag => {
      const data = format(parseISO(ag.data_hora), 'yyyy-MM-dd');
      if (grupos[data]) {
        grupos[data].push(ag);
      }
    });
    
    return grupos;
  }, [agendamentosFiltrados, diasExibicao]);

  // Estatísticas
  const estatisticas = useMemo(() => {
    const total = agendamentosFiltrados.length;
    const confirmados = agendamentosFiltrados.filter(a => a.status === 'confirmado').length;
    const pendentes = agendamentosFiltrados.filter(a => a.status === 'pendente').length;
    const receita = agendamentosFiltrados
      .filter(a => a.status === 'confirmado' || a.status === 'concluido')
      .reduce((sum, a) => sum + (a.servicos?.preco || 0), 0);
    
    return { total, confirmados, pendentes, receita };
  }, [agendamentosFiltrados]);

  // Atualizar status
  const atualizarStatus = async (id: string, novoStatus: string) => {
    try {
      const { error } = await supabase
        .from('agendamentos')
        .update({ status: novoStatus })
        .eq('id', id);

      if (error) throw error;
      buscarAgendamentos();
      setAgendamentoSelecionado(null);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  // Enviar mensagem WhatsApp
  const enviarMensagemWhatsApp = async (telefone: string, mensagem: string) => {
    try {
      await fetch('/api/whatsapp/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefone, mensagem })
      });
    } catch (error) {
      console.error('Erro ao enviar WhatsApp:', error);
    }
  };

  // Salvar novo agendamento
  const salvarNovoAgendamento = async () => {
    // Validações
    setMensagemErro("");
    
    if (!novoAgendamento.clienteNome.trim()) {
      setMensagemErro("Por favor, digite o nome do cliente");
      return;
    }
    if (!novoAgendamento.clienteTelefone.trim()) {
      setMensagemErro("Por favor, digite o número de telefone");
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

    setProcessando(true);
    try {
      // Criar ou buscar cliente
      let clienteId: string;
      const clienteExistente = clientes.find(c => c.nome.toLowerCase() === novoAgendamento.clienteNome.toLowerCase());
      
      if (clienteExistente) {
        clienteId = clienteExistente.id;
      } else {
        // Criar novo cliente
        const { data: novoCliente, error: erroCliente } = await supabase
          .from('clientes')
          .insert([{ nome: novoAgendamento.clienteNome, telefone: novoAgendamento.clienteTelefone, ativo: true }])
          .select()
          .single();
        
        if (erroCliente) throw erroCliente;
        clienteId = novoCliente.id;
      }

      // Combinar data e hora
      const dataHora = new Date(`${novoAgendamento.data}T${novoAgendamento.hora}:00`).toISOString();

      // Buscar dados do barbeiro e serviço
      const barbeiro = barbeiros.find(b => b.id === novoAgendamento.barbeiroId);
      const servico = servicos.find(s => s.id === novoAgendamento.servicoId);

      // Criar agendamento
      const { error: erroAgendamento } = await supabase
        .from('agendamentos')
        .insert([{
          cliente_id: clienteId,
          barbeiro_id: novoAgendamento.barbeiroId,
          servico_id: novoAgendamento.servicoId,
          data_hora: dataHora,
          status: 'pendente'
        }]);

      if (erroAgendamento) throw erroAgendamento;

      // Enviar mensagem de confirmação via WhatsApp
      const dataFormatada = format(parseISO(dataHora), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
      const mensagemConfirmacao = `Olá ${novoAgendamento.clienteNome}! 👋\n\nSeu agendamento foi confirmado:\n📅 ${dataFormatada}\n✂️ ${servico?.nome}\n💈 Barbeiro: ${barbeiro?.nome}\n\nAguardamos você!`;
      
      await enviarMensagemWhatsApp(novoAgendamento.clienteTelefone, mensagemConfirmacao);

      // Fechar modal e recarregar
      setModalNovoAberto(false);
      setMensagemSucesso("Agendamento criado com sucesso!");
      setTimeout(() => setMensagemSucesso(""), 3000);
      
      setNovoAgendamento({
        clienteNome: "",
        clienteTelefone: "",
        data: format(new Date(), "yyyy-MM-dd"),
        hora: "09:00",
        barbeiroId: barbeiros.length > 0 ? barbeiros[0].id : "",
        servicoId: servicos.length > 0 ? servicos[0].id : "",
      });
      buscarAgendamentos();
    } catch (error: any) {
      console.error('Erro ao salvar agendamento:', error);
      setMensagemErro(`Erro ao criar agendamento: ${error.message}`);
    } finally {
      setProcessando(false);
    }
  };

  // Deletar agendamento
  const deletarAgendamento = async () => {
    if (!agendamentoSelecionado) return;
    
    setProcessando(true);
    try {
      const { error } = await supabase
        .from('agendamentos')
        .delete()
        .eq('id', agendamentoSelecionado.id);

      if (error) throw error;
      
      setModalConfirmacao(false);
      setAgendamentoSelecionado(null);
      buscarAgendamentos();
    } catch (error) {
      console.error('Erro ao deletar agendamento:', error);
      alert('Erro ao deletar agendamento. Verifique as permissões no Supabase.');
    } finally {
      setProcessando(false);
    }
  };

  const formatarDataHeader = (dia: Date) => {
    if (isToday(dia)) return 'Hoje';
    if (isSameDay(dia, addDays(new Date(), 1))) return 'Amanhã';
    return format(dia, "EEEE, dd 'de' MMMM", { locale: ptBR });
  };

  return (
    <div className="space-y-6 w-full overflow-x-hidden">
      {/* Header com Estatísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-8 h-8 text-zinc-400" />
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Total</p>
          <p className="text-3xl font-bold text-zinc-900 dark:text-white">{estatisticas.total}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Confirmados</p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">{estatisticas.confirmados}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Pendentes</p>
          <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{estatisticas.pendentes}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-8 h-8 text-blue-500" />
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Receita Prevista</p>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            R$ {estatisticas.receita.toFixed(2)}
          </p>
        </motion.div>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <TextField.Root
              placeholder="Buscar por nome ou telefone..."
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              size="3"
            >
              <TextField.Slot>
                <Search className="w-4 h-4" />
              </TextField.Slot>
            </TextField.Root>
          </div>
          
          <Select.Root value={filtroStatus} onValueChange={setFiltroStatus}>
            <Select.Trigger placeholder="Status" className="w-full sm:w-48" />
            <Select.Content>
              <Select.Item value="todos">Todos os Status</Select.Item>
              <Select.Item value="pendente">Pendentes</Select.Item>
              <Select.Item value="confirmado">Confirmados</Select.Item>
              <Select.Item value="concluido">Concluídos</Select.Item>
              <Select.Item value="cancelado">Cancelados</Select.Item>
            </Select.Content>
          </Select.Root>

          <Button
            onClick={() => setModalNovoAberto(true)}
            className="bg-zinc-900 dark:bg-white text-white dark:text-black cursor-pointer whitespace-nowrap"
            size="3"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Agendamento
          </Button>
        </div>
      </div>

      {/* Navegação de Período */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center justify-between">
          <Button
            variant="soft"
            onClick={() => setDataInicio(addDays(dataInicio, -7))}
          >
            <ChevronLeft className="w-5 h-5" />
            Anterior
          </Button>
          
          <div className="text-center">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
              {format(diasExibicao[0], "d 'de' MMMM", { locale: ptBR })} - {format(diasExibicao[6], "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </h3>
            <Button
              variant="soft"
              size="2"
              onClick={() => setDataInicio(new Date())}
              className="mt-2"
            >
              Hoje
            </Button>
          </div>
          
          <Button
            variant="soft"
            onClick={() => setDataInicio(addDays(dataInicio, 7))}
          >
            Próximo
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Lista de Agendamentos por Dia */}
      <div className="space-y-6">
        {diasExibicao.map((dia) => {
          const dataKey = format(dia, 'yyyy-MM-dd');
          const agendamentosDia = agendamentosPorDia[dataKey] || [];
          const diaPassado = isPast(dia) && !isToday(dia);

          return (
            <motion.div
              key={dataKey}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden"
            >
              {/* Header do Dia */}
              <div className={`p-4 border-b border-zinc-200 dark:border-zinc-800 ${
                isToday(dia) ? 'bg-blue-50 dark:bg-blue-950/20' : 
                diaPassado ? 'bg-zinc-50 dark:bg-zinc-900/50' : ''
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`text-lg font-bold capitalize ${
                      isToday(dia) ? 'text-blue-600 dark:text-blue-400' : 
                      'text-zinc-900 dark:text-white'
                    }`}>
                      {formatarDataHeader(dia)}
                    </h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {agendamentosDia.length} {agendamentosDia.length === 1 ? 'agendamento' : 'agendamentos'}
                    </p>
                  </div>
                  {isToday(dia) && (
                    <Badge color="blue" size="2">Hoje</Badge>
                  )}
                </div>
              </div>

              {/* Lista de Agendamentos */}
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {agendamentosDia.length === 0 ? (
                  <div className="p-8 text-center">
                    <Calendar className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-700 mb-3" />
                    <p className="text-zinc-500 dark:text-zinc-400">Nenhum agendamento para este dia</p>
                  </div>
                ) : (
                  agendamentosDia.map((agendamento) => {
                    const config = STATUS_CONFIG[agendamento.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pendente;
                    
                    return (
                      <motion.div
                        key={agendamento.id}
                        whileHover={{ scale: 1.01 }}
                        className={`p-6 cursor-pointer transition-all ${config.bg} ${config.border} hover:shadow-md`}
                        onClick={() => setAgendamentoSelecionado(agendamento)}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          {/* Informações Principais */}
                          <div className="flex-1 space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <Clock className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                                  <span className="text-xl font-bold text-zinc-900 dark:text-white">
                                    {format(parseISO(agendamento.data_hora), 'HH:mm')}
                                  </span>
                                  <Badge color={config.badge} size="2">
                                    {agendamento.status}
                                  </Badge>
                                </div>
                                
                                <div className="flex items-center gap-2 mb-2">
                                  <User className="w-4 h-4 text-zinc-500" />
                                  <span className="font-semibold text-lg text-zinc-900 dark:text-white">
                                    {agendamento.clientes?.nome}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                                  <Phone className="w-4 h-4" />
                                  <span className="text-sm">{agendamento.clientes?.telefone}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <Scissors className="w-4 h-4 text-zinc-500" />
                                <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                                  {agendamento.servicos?.nome}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-zinc-500" />
                                <span className="text-zinc-600 dark:text-zinc-400">
                                  {agendamento.barbeiros?.nome}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-zinc-500" />
                                <span className="text-zinc-600 dark:text-zinc-400">
                                  {agendamento.servicos?.duracao}min
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-zinc-500" />
                                <span className="text-zinc-700 dark:text-zinc-300 font-semibold">
                                  R$ {agendamento.servicos?.preco.toFixed(2)}
                                </span>
                              </div>
                            </div>

                            {agendamento.observacoes && (
                              <div className="mt-2 p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                                <p className="text-sm text-zinc-700 dark:text-zinc-300">
                                  <strong>Obs:</strong> {agendamento.observacoes}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Ações Rápidas */}
                          <div className="flex sm:flex-col gap-2">
                            {agendamento.status === 'pendente' && (
                              <Button
                                size="2"
                                color="green"
                                variant="soft"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  atualizarStatus(agendamento.id, 'confirmado');
                                }}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}
                            
                            <a
                              href={`https://wa.me/55${agendamento.clientes?.telefone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button size="2" color="green" variant="soft">
                                <WhatsAppIcon className="w-4 h-4" />
                              </Button>
                            </a>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Modal de Detalhes */}
      <AnimatePresence>
        {agendamentoSelecionado && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            onClick={() => setAgendamentoSelecionado(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 rounded-xl p-6 max-w-lg w-full border border-zinc-200 dark:border-zinc-800 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
                  <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">
                    Detalhes do Agendamento
                  </h3>
                  <Badge 
                    color={STATUS_CONFIG[agendamentoSelecionado.status as keyof typeof STATUS_CONFIG]?.badge || 'gray'}
                    size="2"
                  >
                    {agendamentoSelecionado.status}
                  </Badge>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                    <Calendar className="w-5 h-5 text-zinc-500 mt-1" />
                    <div className="flex-1">
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Data e Hora</p>
                      <p className="font-semibold text-lg text-zinc-900 dark:text-white">
                        {format(parseISO(agendamentoSelecionado.data_hora), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                    <User className="w-5 h-5 text-zinc-500 mt-1" />
                    <div className="flex-1">
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Cliente</p>
                      <p className="font-semibold text-lg text-zinc-900 dark:text-white">
                        {agendamentoSelecionado.clientes?.nome}
                      </p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                        {agendamentoSelecionado.clientes?.telefone}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                    <Scissors className="w-5 h-5 text-zinc-500 mt-1" />
                    <div className="flex-1">
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Serviço</p>
                      <p className="font-semibold text-lg text-zinc-900 dark:text-white">
                        {agendamentoSelecionado.servicos?.nome}
                      </p>
                      <div className="flex gap-4 mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                        <span>R$ {agendamentoSelecionado.servicos?.preco.toFixed(2)}</span>
                        <span>•</span>
                        <span>{agendamentoSelecionado.servicos?.duracao}min</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                    <User className="w-5 h-5 text-zinc-500 mt-1" />
                    <div className="flex-1">
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Barbeiro</p>
                      <p className="font-semibold text-lg text-zinc-900 dark:text-white">
                        {agendamentoSelecionado.barbeiros?.nome}
                      </p>
                    </div>
                  </div>

                  {agendamentoSelecionado.observacoes && (
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">Observações</p>
                      <p className="text-zinc-900 dark:text-white">
                        {agendamentoSelecionado.observacoes}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="flex flex-col sm:flex-row gap-3">
                    {agendamentoSelecionado.status === 'pendente' && (
                      <Button
                        onClick={() => atualizarStatus(agendamentoSelecionado.id, 'confirmado')}
                        className="flex-1"
                        color="green"
                        size="3"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Confirmar
                      </Button>
                    )}
                    
                    {agendamentoSelecionado.status !== 'cancelado' && (
                      <Button
                        onClick={() => atualizarStatus(agendamentoSelecionado.id, 'cancelado')}
                        variant="soft"
                        color="red"
                        className="flex-1"
                        size="3"
                      >
                        <XCircle className="w-4 h-4" />
                        Cancelar
                      </Button>
                    )}

                    <a
                      href={`https://wa.me/55${agendamentoSelecionado.clientes?.telefone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button variant="soft" className="w-full" color="green" size="3">
                        <WhatsAppIcon className="w-4 h-4" />
                        WhatsApp
                      </Button>
                    </a>
                  </div>

                  <Button
                    onClick={() => setModalConfirmacao(true)}
                    variant="soft"
                    color="red"
                    className="w-full"
                    size="3"
                  >
                    <Trash2 className="w-4 h-4" />
                    Deletar Agendamento
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Confirmação de Exclusão */}
      <AnimatePresence>
        {modalConfirmacao && agendamentoSelecionado && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-[60] p-4"
            onClick={() => !processando && setModalConfirmacao(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 rounded-xl p-6 max-w-md w-full border border-zinc-200 dark:border-zinc-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                    <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                    Confirmar Exclusão
                  </h3>
                </div>

                <p className="text-zinc-600 dark:text-zinc-400">
                  Tem certeza que deseja deletar permanentemente o agendamento de{' '}
                  <strong className="text-zinc-900 dark:text-white">
                    {agendamentoSelecionado.clientes?.nome}
                  </strong>?
                </p>

                <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-800 dark:text-red-300">
                    ⚠️ Esta ação não pode ser desfeita. O agendamento será removido permanentemente do sistema.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={() => setModalConfirmacao(false)}
                    variant="soft"
                    className="flex-1"
                    size="3"
                    disabled={processando}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={deletarAgendamento}
                    color="red"
                    className="flex-1"
                    size="3"
                    disabled={processando}
                  >
                    {processando ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                        Deletando...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Deletar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                  {/* Mensagem de Erro */}
                  {mensagemErro && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-sm text-red-700 dark:text-red-400">{mensagemErro}</p>
                    </div>
                  )}

                  {/* Nome do Cliente */}
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

                  {/* Telefone */}
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

                  {/* Data com Modal */}
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

                  {/* Hora com Modal */}
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
                      <span>{novoAgendamento.hora}</span>
                      <Clock className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Barbeiro */}
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

                  {/* Serviço */}
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
                    
                    // Verificar se horário está ocupado
                    const dataHora = `${novoAgendamento.data}T${hora}:00`;
                    const horaOcupada = agendamentos.some(ag => {
                      const agDataHora = format(parseISO(ag.data_hora), 'yyyy-MM-dd HH:mm');
                      return agDataHora.startsWith(`${novoAgendamento.data} ${hora}`);
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

      {carregando && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-zinc-900 dark:border-white"></div>
        </div>
      )}

      {/* Mensagem de Sucesso */}
      <AnimatePresence>
        {mensagemSucesso && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 max-w-sm"
          >
            <p className="text-sm text-green-700 dark:text-green-400">{mensagemSucesso}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
