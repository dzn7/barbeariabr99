"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, User, Scissors, Check, Lock } from "lucide-react";
import { Button, Card, Select, TextField, TextArea } from "@radix-ui/themes";
import { format, addDays, setHours, setMinutes, startOfDay, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Barbeiro, Servico } from "@/types";
import { useAutenticacao } from "@/contexts/AutenticacaoContext";
import { supabase } from "@/lib/supabase";
import { ModalCalendario } from "@/components/ModalCalendario";
import { 
  gerarHorariosDisponiveis,
  gerarTodosHorarios,
  HorarioComStatus,
  gerarDatasDisponiveis, 
  validarDataPermitida,
  calcularHorarioTermino 
} from "@/lib/horarios";

/**
 * Página de agendamento
 * Permite ao cliente agendar um horário na barbearia
 */
export default function PaginaAgendamento() {
  const { usuario } = useAutenticacao();
  const [etapa, setEtapa] = useState(1);
  const [barbeiroSelecionado, setBarbeiroSelecionado] = useState("");
  const [servicoSelecionado, setServicoSelecionado] = useState("");
  const [dataSelecionada, setDataSelecionada] = useState("");
  const [horarioSelecionado, setHorarioSelecionado] = useState("");
  const [nomeCliente, setNomeCliente] = useState("");
  const [telefoneCliente, setTelefoneCliente] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [erroTelefone, setErroTelefone] = useState(false);
  const [agendamentoConcluido, setAgendamentoConcluido] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [campoTelefoneTocado, setCampoTelefoneTocado] = useState(false);
  const [horariosOcupados, setHorariosOcupados] = useState<Array<{horario: string, duracao: number}>>([]);
  const [modalCalendarioAberto, setModalCalendarioAberto] = useState(false);
  const [barbeariaAberta, setBarbeariaAberta] = useState(true);
  const [mensagemFechamento, setMensagemFechamento] = useState("");
  const [horariosBloqueados, setHorariosBloqueados] = useState<string[]>([]);
  const [configuracaoHorario, setConfiguracaoHorario] = useState({
    inicio: '09:00',
    fim: '19:00',
    intervaloAlmocoInicio: null as string | null,
    intervaloAlmocoFim: null as string | null,
    diasFuncionamento: ['seg', 'ter', 'qua', 'qui', 'sex', 'sab'] as string[],
    intervaloHorarios: 20
  });

  // Buscar barbeiros e serviços do Supabase
  useEffect(() => {
    buscarDados();
    verificarStatusBarbearia();
  }, []);
  
  // Realtime para status da barbearia
  useEffect(() => {
    const channel = supabase
      .channel('status-barbearia')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'configuracoes_barbearia'
      }, () => {
        verificarStatusBarbearia();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Carregar dados do localStorage
  useEffect(() => {
    const dadosSalvos = localStorage.getItem('dadosCliente');
    if (dadosSalvos) {
      try {
        const dados = JSON.parse(dadosSalvos);
        setNomeCliente(dados.nome || "");
        setTelefoneCliente(dados.telefone || "");
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }
    } else if (usuario) {
      // Fallback para usuário autenticado
      setNomeCliente(usuario.user_metadata?.nome || "");
      setTelefoneCliente(usuario.user_metadata?.telefone || "");
    }
  }, [usuario]);

  const verificarStatusBarbearia = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracoes_barbearia')
        .select('*')
        .single();

      if (error) throw error;
      
      setBarbeariaAberta(data?.aberta ?? true);
      setMensagemFechamento(data?.mensagem_fechamento || "");
      
      // Atualizar configurações de horário
      if (data) {
        // Converter formato HH:mm:ss para HH:mm (remover segundos)
        const formatarHorario = (horario: string | null) => {
          if (!horario) return null;
          return horario.substring(0, 5); // "08:00:00" -> "08:00"
        };
        
        setConfiguracaoHorario({
          inicio: formatarHorario(data.horario_abertura) || '09:00',
          fim: formatarHorario(data.horario_fechamento) || '19:00',
          intervaloAlmocoInicio: formatarHorario(data.intervalo_almoco_inicio),
          intervaloAlmocoFim: formatarHorario(data.intervalo_almoco_fim),
          diasFuncionamento: data.dias_funcionamento || ['seg', 'ter', 'qua', 'qui', 'sex', 'sab'],
          intervaloHorarios: data.intervalo_horarios || 20
        });
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    }
  };

  const buscarDados = async () => {
    try {
      // Buscar barbeiros
      const { data: barbeirosData, error: erroBarbeiros } = await supabase
        .from('barbeiros')
        .select('*')
        .eq('ativo', true);

      if (erroBarbeiros) throw erroBarbeiros;

      // Buscar serviços
      const { data: servicosData, error: erroServicos } = await supabase
        .from('servicos')
        .select('*')
        .eq('ativo', true)
        .order('ordem_exibicao');

      if (erroServicos) throw erroServicos;

      setBarbeiros(barbeirosData || []);
      setServicos(servicosData || []);
      
      // Selecionar automaticamente Matheus Viveiros se houver apenas 1 barbeiro ou se for ele
      if (barbeirosData && barbeirosData.length > 0) {
        const matheus = barbeirosData.find((b: any) => b.nome.includes('Matheus'));
        if (matheus) {
          setBarbeiroSelecionado(matheus.id);
          console.log('🎯 Barbeiro padrão selecionado:', matheus.nome);
        } else {
          // Se não achar Matheus, seleciona o primeiro
          setBarbeiroSelecionado(barbeirosData[0].id);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      // Usar dados de exemplo se falhar
      usarDadosExemplo();
    }
  };

  const usarDadosExemplo = () => {
    setBarbeiros([
      {
        id: "1",
        nome: "Carlos Silva",
        email: "carlos@barbearia.com",
        telefone: "(86) 98765-4321",
        especialidades: ["Corte Clássico", "Barba", "Degradê"],
        fotoUrl: null,
        ativo: true,
        dataCadastro: new Date(),
      },
      {
        id: "2",
        nome: "Roberto Santos",
        email: "roberto@barbearia.com",
        telefone: "(86) 98765-4322",
        especialidades: ["Corte Moderno", "Barba", "Pigmentação"],
        fotoUrl: null,
        ativo: true,
        dataCadastro: new Date(),
      },
    ]);

    // Serviços reais do Booksy
    setServicos([
    {
      id: "1",
      nome: "Corte Degradê",
      descricao: "Corte degradê moderno",
      duracao: 40,
      preco: 25,
      ativo: true,
    },
    {
      id: "2",
      nome: "Corte Social na Máquina",
      descricao: "Corte social com máquina",
      duracao: 30,
      preco: 20,
      ativo: true,
    },
    {
      id: "3",
      nome: "Corte Social na Tesoura",
      descricao: "Corte social com tesoura",
      duracao: 40,
      preco: 25,
      ativo: true,
    },
    {
      id: "4",
      nome: "Corte Degradê + Sobrancelha",
      descricao: "Corte degradê com design de sobrancelha",
      duracao: 40,
      preco: 30,
      ativo: true,
    },
    {
      id: "5",
      nome: "Corte Degradê + Barba",
      descricao: "Corte degradê com barba completa",
      duracao: 60,
      preco: 40,
      ativo: true,
    },
    {
      id: "6",
      nome: "Corte Degradê + Barba + Sobrancelha",
      descricao: "Pacote completo premium",
      duracao: 60,
      preco: 45,
      ativo: true,
    },
    {
      id: "7",
      nome: "Corte Social na Máquina + Barba",
      descricao: "Corte social com barba",
      duracao: 50,
      preco: 35,
      ativo: true,
    },
    {
      id: "8",
      nome: "Corte Social na Máquina + Sobrancelha",
      descricao: "Corte social com sobrancelha",
      duracao: 40,
      preco: 25,
      ativo: true,
    },
    {
      id: "9",
      nome: "Corte Social na Tesoura + Barba",
      descricao: "Corte social na tesoura com barba",
      duracao: 60,
      preco: 40,
      ativo: true,
    },
    {
      id: "10",
      nome: "Corte Social na Máquina + Barba + Sobrancelha",
      descricao: "Pacote completo social",
      duracao: 60,
      preco: 40,
      ativo: true,
    },
    {
      id: "11",
      nome: "Corte Social na Tesoura + Barba + Sobrancelha",
      descricao: "Pacote completo premium na tesoura",
      duracao: 60,
      preco: 45,
      ativo: true,
    },
    {
      id: "12",
      nome: "Fazer a Barba",
      descricao: "Apenas barba",
      duracao: 20,
      preco: 15,
      ativo: true,
    },
    ]);
  };

  // Buscar horários ocupados quando data e barbeiro são selecionados
  useEffect(() => {
    const buscarHorariosOcupados = async () => {
      if (!dataSelecionada || !barbeiroSelecionado) {
        setHorariosOcupados([]);
        return;
      }

      try {
        // Criar datas em UTC para evitar problemas de timezone
        const [ano, mes, dia] = dataSelecionada.split('-').map(Number);
        const inicioDia = new Date(Date.UTC(ano, mes - 1, dia, 0, 0, 0, 0));
        const fimDia = new Date(Date.UTC(ano, mes - 1, dia, 23, 59, 59, 999));

        // Buscar nome do barbeiro para logs
        const barbeiroObj = barbeiros.find(b => b.id === barbeiroSelecionado);
        
        console.log('🔍 [CLIENTE] Buscando horários ocupados:', {
          barbeiro_id: barbeiroSelecionado,
          barbeiro_nome: barbeiroObj?.nome || 'NÃO ENCONTRADO',
          data: dataSelecionada,
          inicioDia: inicioDia.toISOString(),
          fimDia: fimDia.toISOString()
        });

        const { data, error } = await supabase
          .from('agendamentos')
          .select(`
            id, 
            data_hora, 
            status,
            servicos (duracao)
          `)
          .eq('barbeiro_id', barbeiroSelecionado)
          .gte('data_hora', inicioDia.toISOString())
          .lte('data_hora', fimDia.toISOString())
          .neq('status', 'cancelado');

        if (error) {
          console.error('❌ Erro ao buscar horários:', error);
          throw error;
        }

        console.log('✅ [CLIENTE] Agendamentos encontrados:', data?.length || 0);
        console.log('📋 [CLIENTE] Dados completos:', data);
        
        // Converter para o novo formato: {horario, duracao}
        const ocupados = (data || []).map((ag: any) => {
          const horario = format(new Date(ag.data_hora), 'HH:mm');
          const duracao = ag.servicos?.duracao || 30; // Padrão 30 minutos
          console.log(`🔴 Horário ocupado: ${horario} (${duracao} min)`, ag);
          return { horario, duracao };
        });
        
        setHorariosOcupados(ocupados as any);
        console.log('📊 [CLIENTE] Total de horários ocupados:', ocupados.length, ocupados);
      } catch (error) {
        console.error('❌ Erro ao buscar horários ocupados:', error);
      }
    };

    buscarHorariosOcupados();

    // 🔥 REALTIME: Escutar mudanças em agendamentos e recarregar
    if (dataSelecionada && barbeiroSelecionado) {
      const channel = supabase
        .channel(`horarios-${barbeiroSelecionado}-${dataSelecionada}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'agendamentos',
            filter: `barbeiro_id=eq.${barbeiroSelecionado}`
          },
          (payload) => {
            console.log('🔄 [REALTIME] Mudança detectada, recarregando horários...', payload);
            // Recarregar horários ao invés de tentar manipular o array
            buscarHorariosOcupados();
          }
        )
        .subscribe((status) => {
          console.log('📡 [REALTIME] Status:', status);
        });

      return () => {
        console.log('🔌 [REALTIME] Desconectando...');
        supabase.removeChannel(channel);
      };
    }
  }, [dataSelecionada, barbeiroSelecionado]);

  // Gera datas disponíveis (hoje + 15 dias) filtrando por dias de funcionamento
  const todasDatas = gerarDatasDisponiveis();
  const datasDisponiveis = todasDatas.filter(data => {
    const dataObj = parse(data.valor, 'yyyy-MM-dd', new Date());
    const diaSemanaNum = dataObj.getDay(); // 0=dom, 1=seg, 2=ter, 3=qua, 4=qui, 5=sex, 6=sab
    
    const mapa = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
    const diaAbreviado = mapa[diaSemanaNum];
    
    return configuracaoHorario.diasFuncionamento.includes(diaAbreviado);
  });

  // Gera horários disponíveis baseado na duração do serviço selecionado
  const servicoObj = servicos.find(s => s.id === servicoSelecionado);
  const duracaoServico = servicoObj?.duracao || 30; // Padrão 30 minutos
  
  // Passar configurações de horário do Supabase
  console.log('⏰ Configuração de horários:', configuracaoHorario);
  console.log('🕐 Duração do serviço:', duracaoServico, 'minutos');
  console.log('🔴 Horários ocupados:', horariosOcupados);
  
  const todosHorarios = gerarTodosHorarios(duracaoServico, horariosOcupados, configuracaoHorario);
  console.log('📋 Todos os horários gerados:', todosHorarios.length, todosHorarios);
  
  const horariosDisponiveis = todosHorarios.filter(h => h.disponivel).map(h => h.horario);
  console.log('✅ Horários disponíveis:', horariosDisponiveis.length, horariosDisponiveis);

  /**
   * Finaliza o agendamento
   * Salva os dados no Supabase
   */
  const finalizarAgendamento = async () => {
    setCarregando(true);
    try {
      console.log('Iniciando agendamento...', {
        barbeiro: barbeiroSelecionado,
        servico: servicoSelecionado,
        data: dataSelecionada,
        horario: horarioSelecionado,
      });

      // 1. Buscar ou criar cliente
      let clienteId = null;
      
      // Se usuário está autenticado, buscar cliente existente
      if (usuario?.id) {
        console.log('Buscando cliente existente para usuário autenticado...');
        
        const { data: clienteExistente, error: erroBusca } = await supabase
          .from('clientes')
          .select('id')
          .eq('user_id', usuario.id)
          .limit(1);

        if (erroBusca) {
          console.error('Erro ao buscar cliente:', erroBusca);
          throw erroBusca;
        }

        if (clienteExistente && clienteExistente.length > 0) {
          clienteId = clienteExistente[0].id;
          console.log('Cliente existente encontrado:', clienteId);
        }
      }

      // Se não encontrou cliente existente, criar novo
      if (!clienteId) {
        console.log('Criando novo cliente...');
        
        const { data: novoCliente, error: erroCliente } = await supabase
          .from('clientes')
          .insert([{
            nome: nomeCliente,
            email: null,
            telefone: telefoneCliente,
            user_id: usuario?.id || null,
          }])
          .select('id')
          .single();

        if (erroCliente) {
          console.error('Erro ao criar cliente:', erroCliente);
          console.error('Erro completo:', erroCliente);
          throw erroCliente;
        }
        
        clienteId = novoCliente.id;
        console.log('Novo cliente criado:', clienteId);
      }

      // 2. Criar data/hora combinada no timezone local (Brasil)
      // O usuário seleciona 10h → salvamos como 10h local → banco salva como 13h UTC
      // Ao exibir, o JavaScript converte 13h UTC → 10h local (correto!)
      const [hora, minuto] = horarioSelecionado.split(':');
      const [ano, mes, dia] = dataSelecionada.split('-').map(Number);
      
      // Criar data no timezone local (não usar Date.UTC)
      const dataHora = new Date(
        ano,
        mes - 1,
        dia,
        parseInt(hora),
        parseInt(minuto),
        0,
        0
      );

      console.log('📅 Horário selecionado:', `${hora}:${minuto}`);
      console.log('💾 Salvo no banco (UTC):', dataHora.toISOString());
      console.log('🇧🇷 Exibido como:', format(dataHora, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }));

      // 3. Verificar se horário está disponível
      const { data: horarioExistente, error: erroVerificacao } = await supabase
        .from('agendamentos')
        .select('id')
        .eq('barbeiro_id', barbeiroSelecionado)
        .eq('data_hora', dataHora.toISOString())
        .in('status', ['pendente', 'confirmado'])
        .maybeSingle();

      if (erroVerificacao) {
        console.error('Erro ao verificar disponibilidade:', erroVerificacao);
        throw erroVerificacao;
      }

      if (horarioExistente) {
        alert('❌ Este horário acabou de ser reservado por outro cliente. Por favor, escolha outro horário.');
        setCarregando(false);
        setEtapa(2); // Voltar para seleção de data/hora
        return;
      }

      console.log('Horário verificado e disponível');

      // 4. Criar agendamento
      console.log('Criando agendamento...');
      const { data: agendamento, error: erroAgendamento } = await supabase
        .from('agendamentos')
        .insert([{
          cliente_id: clienteId,
          barbeiro_id: barbeiroSelecionado,
          servico_id: servicoSelecionado,
          data_hora: dataHora.toISOString(),
          status: 'pendente',
          observacoes: observacoes || null,
        }])
        .select()
        .single();

      if (erroAgendamento) {
        console.error('Erro ao criar agendamento:', erroAgendamento);
        throw erroAgendamento;
      }

      console.log('Agendamento criado com sucesso:', agendamento);
      
      // Salvar dados do cliente no localStorage para próximos agendamentos
      localStorage.setItem('dadosCliente', JSON.stringify({
        nome: nomeCliente,
        telefone: telefoneCliente,
      }));
      
      setAgendamentoConcluido(true);
      
    } catch (error: any) {
      console.error('Erro completo:', error);
      alert(`Erro ao criar agendamento: ${error.message || 'Erro desconhecido'}. Verifique o console para mais detalhes.`);
    } finally {
      setCarregando(false);
    }
  };

  /**
   * Verifica se a etapa atual está completa
   */
  const etapaCompleta = () => {
    switch (etapa) {
      case 1:
        return barbeiroSelecionado !== "" && servicoSelecionado !== "";
      case 2:
        return dataSelecionada !== "" && horarioSelecionado !== "";
      case 3:
        return nomeCliente !== "" && telefoneCliente !== "" && telefoneCliente.replace(/\D/g, '').length >= 10;
      default:
        return false;
    }
  };

  /**
   * Avançar para próxima etapa com validação
   */
  const avancarEtapa = () => {
    if (etapa === 3 && !telefoneCliente) {
      setCampoTelefoneTocado(true);
      return;
    }
    if (etapaCompleta()) {
      setEtapa(etapa + 1);
      // Scroll suave para o topo
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  /**
   * Voltar para etapa anterior
   */
  const etapaAnterior = () => {
    if (etapa > 1) {
      setEtapa(etapa - 1);
      // Scroll suave para o topo
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Aviso se barbearia estiver fechada
  if (!barbeariaAberta) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-8 text-center border-2 border-red-200 dark:border-red-800"
        >
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
              <Lock className="h-16 w-16 text-red-600 dark:text-red-400" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
            Barbearia Fechada
          </h2>
          
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">
            {mensagemFechamento || "No momento não estamos aceitando agendamentos. Volte mais tarde!"}
          </p>
          
          <Button
            onClick={() => window.location.href = '/'}
            size="3"
          >
            Voltar para Início
          </Button>
        </motion.div>
      </div>
    );
  }

  if (agendamentoConcluido) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-6 max-w-md"
        >
          <div className="flex justify-center">
            <div className="p-4 bg-green-100 dark:bg-green-900 rounded-full">
              <Check className="h-16 w-16 text-green-600 dark:text-green-300" />
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            Agendamento Confirmado!
          </h2>
          
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Seu horário foi agendado com sucesso. Você receberá um email de confirmação em breve.
          </p>

          <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-3 text-left">
            <div className="flex justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">Barbeiro:</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {barbeiros.find(b => b.id === barbeiroSelecionado)?.nome}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">Serviço:</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {servicos.find(s => s.id === servicoSelecionado)?.nome}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">Data:</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {datasDisponiveis.find(d => d.valor === dataSelecionada)?.label}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">Horário:</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {horarioSelecionado}
              </span>
            </div>
          </div>

          <Button
            size="3"
            onClick={() => window.location.href = "/"}
            className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 px-8 py-4 rounded-lg cursor-pointer"
          >
            Voltar para Início
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900 py-6 sm:py-12 px-3 sm:px-4 overflow-x-hidden w-full">
      <div className="container mx-auto max-w-4xl w-full">
        {/* Indicador de etapas */}
        <div className="mb-6 sm:mb-12">
          <div className="flex justify-between items-center">
            {[1, 2, 3, 4].map((numero) => (
              <div key={numero} className="flex items-center flex-1">
                <div
                  className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full border-2 transition-all text-sm sm:text-base ${
                    etapa >= numero
                      ? "bg-zinc-900 dark:bg-zinc-100 border-zinc-900 dark:border-zinc-100 text-white dark:text-zinc-900"
                      : "bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-400 dark:text-zinc-600"
                  }`}
                >
                  {numero}
                </div>
                {numero < 4 && (
                  <div
                    className={`flex-1 h-0.5 sm:h-1 mx-1 sm:mx-2 transition-all ${
                      etapa > numero
                        ? "bg-zinc-900 dark:bg-zinc-100"
                        : "bg-zinc-300 dark:bg-zinc-700"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          
          <div className="flex justify-between mt-4 text-sm">
            <span className={etapa >= 1 ? "text-zinc-900 dark:text-zinc-100 font-medium" : "text-zinc-400 dark:text-zinc-600"}>
              Serviço
            </span>
            <span className={etapa >= 2 ? "text-zinc-900 dark:text-zinc-100 font-medium" : "text-zinc-400 dark:text-zinc-600"}>
              Data/Hora
            </span>
            <span className={etapa >= 3 ? "text-zinc-900 dark:text-zinc-100 font-medium" : "text-zinc-400 dark:text-zinc-600"}>
              Seus Dados
            </span>
            <span className={etapa >= 4 ? "text-zinc-900 dark:text-zinc-100 font-medium" : "text-zinc-400 dark:text-zinc-600"}>
              Confirmar
            </span>
          </div>
        </div>

        {/* Conteúdo das etapas */}
        <motion.div
          key={etapa}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-4 sm:p-6 md:p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            {/* Etapa 1: Selecionar Barbeiro e Serviço */}
            {etapa === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                    Escolha o Barbeiro e o Serviço
                  </h2>
                  <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
                    Selecione o profissional e o serviço desejado
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                      Barbeiro
                    </label>
                    <Select.Root value={barbeiroSelecionado} onValueChange={setBarbeiroSelecionado}>
                      <Select.Trigger className="w-full" placeholder="Selecione um barbeiro" />
                      <Select.Content>
                        {barbeiros.map((barbeiro) => (
                          <Select.Item key={barbeiro.id} value={barbeiro.id}>
                            {barbeiro.nome} - {barbeiro.especialidades.join(", ")}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Root>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                      Serviço
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {servicos.map((servico) => (
                        <motion.div
                          key={servico.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setServicoSelecionado(servico.id);
                            // Auto-avançar para data/hora após selecionar
                            setTimeout(() => {
                              setEtapa(2);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }, 300);
                          }}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            servicoSelecionado === servico.id
                              ? "border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-800"
                              : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                          }`}
                        >
                          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                            {servico.nome}
                          </h3>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                            {servico.descricao}
                          </p>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-zinc-600 dark:text-zinc-400">
                              {servico.duracao} min
                            </span>
                            <span className="font-bold text-zinc-900 dark:text-zinc-100">
                              R$ {servico.preco.toFixed(2)}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Etapa 2: Selecionar Data e Horário */}
            {etapa === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                    Escolha a Data e o Horário
                  </h2>
                  <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
                    Selecione o melhor dia e horário para você
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                      Data
                    </label>
                    <Select.Root value={dataSelecionada} onValueChange={setDataSelecionada}>
                      <Select.Trigger className="w-full" placeholder="Selecione uma data" />
                      <Select.Content>
                        {datasDisponiveis.map((data) => (
                          <Select.Item key={data.valor} value={data.valor}>
                            {data.label}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Root>
                    
                    <Button
                      onClick={() => setModalCalendarioAberto(true)}
                      variant="ghost"
                      className="w-full mt-2 cursor-pointer text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                    >
                      📅 Escolher data no calendário
                    </Button>
                  </div>

                  {dataSelecionada && (
                    <div>
                      <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                        Horário
                        {horariosOcupados.length > 0 && (
                          <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">
                            ({horariosOcupados.length} horários ocupados)
                          </span>
                        )}
                      </label>
                      
                      {todosHorarios.length === 0 ? (
                        <div className="p-8 text-center bg-zinc-50 dark:bg-zinc-800 rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-700">
                          <p className="text-zinc-600 dark:text-zinc-400 mb-2">
                            😔 Nenhum horário disponível
                          </p>
                          <p className="text-sm text-zinc-500 dark:text-zinc-500">
                            Por favor, escolha outra data
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                          {todosHorarios.map((item: HorarioComStatus) => {
                            const selecionado = horarioSelecionado === item.horario;
                            const ocupado = !item.disponivel;
                            
                            return (
                              <motion.button
                                key={item.horario}
                                whileHover={item.disponivel ? { scale: 1.05 } : {}}
                                whileTap={item.disponivel ? { scale: 0.95 } : {}}
                                onClick={() => item.disponivel && setHorarioSelecionado(item.horario)}
                                disabled={ocupado}
                                className={`relative p-2.5 sm:p-3 rounded-lg border-2 transition-all text-sm sm:text-base font-medium ${
                                  ocupado
                                    ? "border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 cursor-not-allowed opacity-75"
                                    : selecionado
                                    ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold"
                                    : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 text-zinc-900 dark:text-zinc-100 cursor-pointer"
                                }`}
                              >
                                {item.horario}
                                {ocupado && (
                                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-500 rounded-full border-2 border-white dark:border-zinc-900"></span>
                                )}
                              </motion.button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Etapa 3: Dados do Cliente */}
            {etapa === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                    Seus Dados
                  </h2>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    Preencha suas informações para confirmar o agendamento
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                      Nome Completo
                    </label>
                    <TextField.Root
                      placeholder="Digite seu nome"
                      value={nomeCliente}
                      onChange={(e) => setNomeCliente(e.target.value)}
                      size="3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                      WhatsApp <span className="text-red-500">*</span>
                    </label>
                    <div className={`relative ${erroTelefone ? 'animate-pulse' : ''}`}>
                      <TextField.Root
                        type="tel"
                        placeholder="(86) 99953-3738"
                        value={telefoneCliente}
                        onChange={(e) => {
                          setTelefoneCliente(e.target.value);
                          setErroTelefone(false);
                        }}
                        onBlur={() => {
                          setCampoTelefoneTocado(true);
                          const telefone = telefoneCliente.replace(/\D/g, '');
                          if (!telefoneCliente || telefone.length < 10) {
                            setErroTelefone(true);
                          }
                        }}
                        className={
                          erroTelefone || (campoTelefoneTocado && !telefoneCliente)
                            ? "border-2 border-red-500 focus:border-red-500 ring-red-500"
                            : ""
                        }
                        size="3"
                        required
                      />
                      {erroTelefone && (
                        <p className="text-xs text-red-500 mt-1">
                          ⚠️ WhatsApp é obrigatório (mínimo 10 dígitos)
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                      Observações (opcional)
                    </label>
                    <TextArea
                      placeholder="Alguma observação sobre o serviço?"
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      rows={4}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Etapa 4: Confirmação */}
            {etapa === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                    Confirme seu Agendamento
                  </h2>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    Revise as informações antes de confirmar
                  </p>
                </div>

                <div className="space-y-4 bg-zinc-50 dark:bg-zinc-800 p-6 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <User className="h-5 w-5 text-zinc-600 dark:text-zinc-400 mt-1" />
                    <div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">Barbeiro</p>
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {barbeiros.find(b => b.id === barbeiroSelecionado)?.nome}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Scissors className="h-5 w-5 text-zinc-600 dark:text-zinc-400 mt-1" />
                    <div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">Serviço</p>
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {servicos.find(s => s.id === servicoSelecionado)?.nome}
                      </p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        R$ {servicos.find(s => s.id === servicoSelecionado)?.preco.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Calendar className="h-5 w-5 text-zinc-600 dark:text-zinc-400 mt-1" />
                    <div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">Data</p>
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {datasDisponiveis.find(d => d.valor === dataSelecionada)?.label}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Clock className="h-5 w-5 text-zinc-600 dark:text-zinc-400 mt-1" />
                    <div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">Horário</p>
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {horarioSelecionado}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Cliente</p>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">{nomeCliente}</p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">📱 {telefoneCliente}</p>
                  </div>

                  {observacoes && (
                    <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700">
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">Observações</p>
                      <p className="text-zinc-900 dark:text-zinc-100">{observacoes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Botões de navegação */}
            <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-zinc-200 dark:border-zinc-800">
              <Button
                size="3"
                variant="outline"
                className="w-full sm:w-auto px-6 cursor-pointer"
                onClick={etapaAnterior}
                disabled={etapa === 1}
              >
                Voltar
              </Button>

              {etapa < 4 ? (
                <Button
                  size="3"
                  onClick={avancarEtapa}
                  disabled={!etapaCompleta()}
                  className="w-full sm:w-auto bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 px-6 cursor-pointer"
                >
                  Próximo
                </Button>
              ) : (
                <Button
                  size="3"
                  onClick={finalizarAgendamento}
                  disabled={carregando}
                  className="w-full sm:w-auto bg-green-600 dark:bg-green-500 text-white hover:bg-green-700 dark:hover:bg-green-600 px-4 sm:px-6 cursor-pointer text-sm sm:text-base"
                >
                  {carregando ? "Confirmando..." : "Confirmar Agendamento"}
                </Button>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Modal de Calendário */}
      <ModalCalendario
        aberto={modalCalendarioAberto}
        onFechar={() => setModalCalendarioAberto(false)}
        dataSelecionada={dataSelecionada}
        onSelecionarData={(data) => {
          setDataSelecionada(data);
          setHorarioSelecionado(""); // Resetar horário ao mudar data
        }}
      />
    </div>
  );
}
