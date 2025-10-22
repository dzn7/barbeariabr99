"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { 
  Calendar, DollarSign, Users, TrendingUp, TrendingDown, Package, Percent, LogOut, Scissors, Edit3, Clock, Menu, X, Settings
} from "lucide-react";
import { Tabs } from "@radix-ui/themes";
import { useRouter } from "next/navigation";
import { GestaoFinanceira } from "@/components/dashboard/GestaoFinanceira";
import { AtendimentosPresenciais } from "@/components/dashboard/AtendimentosPresenciais";
import { GestaoAgendamentos } from "@/components/dashboard/GestaoAgendamentos";
import { GestaoEstoque } from "@/components/dashboard/GestaoEstoque";
import { GestaoComissoes } from "@/components/dashboard/GestaoComissoes";
import { GestaoUsuarios } from "@/components/dashboard/GestaoUsuarios";
import { GestaoServicos } from "@/components/dashboard/GestaoServicos";
import { RemarcacaoAgendamento } from "@/components/dashboard/RemarcacaoAgendamento";
import { GestaoHorarios } from "@/components/dashboard/GestaoHorarios";
import { GestaoHorariosAvancada } from "@/components/dashboard/GestaoHorariosAvancada";
import { AlternadorTema } from "@/components/AlternadorTema";
import { NotificationPermission } from "@/components/NotificationPermission";
import { useAgendamentosRealtime } from "@/hooks/useAgendamentosRealtime";
import { supabase } from "@/lib/supabase";
import { startOfMonth, endOfMonth } from "date-fns";

/**
 * Dashboard Completo de Gestão
 * Sistema integrado para controle total da barbearia
 */
export default function DashboardCompleto() {
  const router = useRouter();
  const [abaAtiva, setAbaAtiva] = useState("visao-geral");
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);
  const [metricas, setMetricas] = useState({
    receitaMensal: 0,
    totalAtendimentos: 0,
    ticketMedio: 0,
    lucroLiquido: 0,
    totalDespesas: 0,
    margemLucro: 0,
    receitaPorDia: [] as { data: string; valor: number }[],
    atendimentosPorBarbeiro: [] as { nome: string; total: number }[],
  });
  const [carregando, setCarregando] = useState(true);
  const [autenticado, setAutenticado] = useState(false);

  // Hook de notificações em tempo real
  useAgendamentosRealtime({
    enabled: autenticado,
    onNewAgendamento: (agendamento) => {
      console.log("[Dashboard] 🎉 Novo agendamento:", agendamento);
      // Recarregar métricas
      buscarMetricas();
    },
    onCancelamento: (agendamento) => {
      console.log("[Dashboard] ❌ Cancelamento:", agendamento);
      // Recarregar métricas
      buscarMetricas();
    },
  });

  // Verificar autenticação ao carregar
  useEffect(() => {
    const adminAuth = localStorage.getItem("admin_autenticado");
    if (adminAuth !== "true") {
      router.push("/dashboard/login");
    } else {
      setAutenticado(true);
    }
  }, [router]);

  useEffect(() => {
    if (autenticado) {
      buscarMetricas();
    }
  }, [autenticado]);

  const handleLogout = () => {
    localStorage.removeItem("admin_autenticado");
    localStorage.removeItem("admin_email");
    // Limpar cookie também
    document.cookie = "admin_autenticado=; path=/; max-age=0";
    router.push("/dashboard/login");
  };

  const buscarMetricas = async () => {
    try {
      const inicioMes = startOfMonth(new Date()).toISOString();
      const fimMes = endOfMonth(new Date()).toISOString();

      // Buscar agendamentos concluídos do mês
      const { data: agendamentos, error: erroAgendamentos } = await supabase
        .from('agendamentos')
        .select(`
          *,
          servicos (preco),
          barbeiros (nome)
        `)
        .eq('status', 'concluido')
        .gte('data_hora', inicioMes)
        .lte('data_hora', fimMes);

      if (erroAgendamentos) throw erroAgendamentos;

      // Buscar atendimentos presenciais do mês
      const { data: atendimentos, error: erroAtendimentos } = await supabase
        .from('atendimentos_presenciais')
        .select(`
          valor,
          data,
          barbeiros (nome)
        `)
        .gte('data', inicioMes)
        .lte('data', fimMes);

      if (erroAtendimentos) throw erroAtendimentos;

      // Buscar despesas do mês
      const { data: despesas, error: erroDespesas } = await supabase
        .from('transacoes')
        .select('valor')
        .eq('tipo', 'despesa')
        .gte('data', inicioMes)
        .lte('data', fimMes);

      if (erroDespesas) throw erroDespesas;

      // Calcular métricas
      const receitaAgendamentos = agendamentos?.reduce((sum, a) => sum + (a.servicos?.preco || 0), 0) || 0;
      const receitaAtendimentos = atendimentos?.reduce((sum, a) => sum + a.valor, 0) || 0;
      const receitaTotal = receitaAgendamentos + receitaAtendimentos;
      const totalDespesas = despesas?.reduce((sum, d) => sum + d.valor, 0) || 0;
      const lucroLiquidoReal = receitaTotal - totalDespesas;
      const totalAtendimentos = (agendamentos?.length || 0) + (atendimentos?.length || 0);
      const ticketMedio = totalAtendimentos > 0 ? receitaTotal / totalAtendimentos : 0;

      // Dados para gráficos
      const receitaPorDia = calcularReceitaPorDia(agendamentos || [], atendimentos || []);
      const atendimentosPorBarbeiro = calcularAtendimentosPorBarbeiro(agendamentos || [], atendimentos || []);

      setMetricas({
        receitaMensal: receitaTotal,
        totalAtendimentos,
        ticketMedio,
        lucroLiquido: lucroLiquidoReal,
        totalDespesas,
        margemLucro: receitaTotal > 0 ? (lucroLiquidoReal / receitaTotal) * 100 : 0,
        receitaPorDia,
        atendimentosPorBarbeiro,
      });

      console.log('Métricas carregadas:', {
        receitaTotal,
        totalAtendimentos,
        ticketMedio,
        receitaPorDia,
        atendimentosPorBarbeiro,
      });
    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
    } finally {
      setCarregando(false);
    }
  };

  const calcularReceitaPorDia = (agendamentos: any[], atendimentos: any[]) => {
    const dados: { [key: string]: number } = {};
    
    // Últimos 7 dias
    for (let i = 6; i >= 0; i--) {
      const data = new Date();
      data.setDate(data.getDate() - i);
      const dataStr = data.toISOString().split('T')[0];
      dados[dataStr] = 0;
    }

    // Somar receitas dos agendamentos
    agendamentos.forEach(ag => {
      const dataStr = new Date(ag.data_hora).toISOString().split('T')[0];
      if (dados.hasOwnProperty(dataStr)) {
        dados[dataStr] += ag.servicos?.preco || 0;
      }
    });

    // Somar receitas dos atendimentos
    atendimentos.forEach(at => {
      const dataStr = new Date(at.data).toISOString().split('T')[0];
      if (dados.hasOwnProperty(dataStr)) {
        dados[dataStr] += at.valor;
      }
    });

    return Object.entries(dados).map(([data, valor]) => ({
      data: new Date(data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      valor
    }));
  };

  const calcularAtendimentosPorBarbeiro = (agendamentos: any[], atendimentos: any[]) => {
    const dados: { [key: string]: number } = {};

    // Contar agendamentos por barbeiro
    agendamentos.forEach(ag => {
      const nome = ag.barbeiros?.nome || 'Sem barbeiro';
      dados[nome] = (dados[nome] || 0) + 1;
    });

    // Contar atendimentos por barbeiro
    atendimentos.forEach(at => {
      const nome = at.barbeiros?.nome || 'Sem barbeiro';
      dados[nome] = (dados[nome] || 0) + 1;
    });

    return Object.entries(dados).map(([nome, total]) => ({ nome, total }));
  };

  // Verificar se não está autenticado (mostra tela vazia enquanto redireciona)
  if (!autenticado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-zinc-900 dark:border-white mb-4"></div>
          <p className="text-zinc-600 dark:text-zinc-400">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black overflow-x-hidden">
      {/* Componente de Notificações Push */}
      <NotificationPermission />
      
      {/* Navbar Exclusiva do Dashboard */}
      <header className="bg-white dark:bg-[#1a1a1a] border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-50 w-full">
        <div className="container mx-auto px-4 max-w-full">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <div className="relative w-36 h-12 md:w-44 md:h-14 flex items-center">
                {/* Logo para modo escuro - logo escuro */}
                <Image
                  src="/assets/logodark.webp"
                  alt="Barbearia BR99"
                  fill
                  sizes="(max-width: 768px) 144px, 176px"
                  className="object-contain object-left dark:block hidden"
                  priority
                />
                {/* Logo para modo claro - logo branco */}
                <Image
                  src="/assets/logowhite.webp"
                  alt="Barbearia BR99"
                  fill
                  sizes="(max-width: 768px) 144px, 176px"
                  className="object-contain object-left dark:hidden block"
                  priority
                />
              </div>
              <div className="hidden sm:flex items-center border-l border-zinc-300 dark:border-zinc-700 pl-4 h-10">
                <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium whitespace-nowrap">
                  Dashboard Administrativo
                </p>
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-3">
              <AlternadorTema />
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors text-sm font-medium"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <div className="container mx-auto px-4 py-8 max-w-full overflow-x-hidden">
        <Tabs.Root value={abaAtiva} onValueChange={(value) => {
          setAbaAtiva(value);
          setMenuMobileAberto(false); // Fechar menu ao selecionar
        }}>
          {/* Botão Menu Mobile */}
          <div className="lg:hidden mb-4">
            <button
              onClick={() => setMenuMobileAberto(!menuMobileAberto)}
              className="w-full flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800"
            >
              <span className="font-semibold text-zinc-900 dark:text-white">
                Menu
              </span>
              {menuMobileAberto ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Menu Desktop */}
          <Tabs.List className="mb-8 hidden lg:flex">
            <Tabs.Trigger value="visao-geral">
              <TrendingUp className="w-4 h-4 mr-2" />
              Visão Geral
            </Tabs.Trigger>
            <Tabs.Trigger value="agendamentos">
              <Calendar className="w-4 h-4 mr-2" />
              Agendamentos
            </Tabs.Trigger>
            <Tabs.Trigger value="financeiro">
              <DollarSign className="w-4 h-4 mr-2" />
              Financeiro
            </Tabs.Trigger>
            <Tabs.Trigger value="atendimentos">
              <Users className="w-4 h-4 mr-2" />
              Atendimentos
            </Tabs.Trigger>
            <Tabs.Trigger value="estoque">
              <Package className="w-4 h-4 mr-2" />
              Estoque
            </Tabs.Trigger>
            <Tabs.Trigger value="comissoes">
              <Percent className="w-4 h-4 mr-2" />
              Comissões
            </Tabs.Trigger>
            <Tabs.Trigger value="usuarios">
              <Users className="w-4 h-4 mr-2" />
              Usuários
            </Tabs.Trigger>
            <Tabs.Trigger value="servicos">
              <Edit3 className="w-4 h-4 mr-2" />
              Serviços
            </Tabs.Trigger>
            <Tabs.Trigger value="remarcacao">
              <Clock className="w-4 h-4 mr-2" />
              Remarcação
            </Tabs.Trigger>
            <Tabs.Trigger value="horarios">
              <Clock className="w-4 h-4 mr-2" />
              Horários
            </Tabs.Trigger>
            <Tabs.Trigger value="configuracoes">
              <Settings className="w-4 h-4 mr-2" />
              Configurações
            </Tabs.Trigger>
          </Tabs.List>

          {/* Menu Mobile */}
          {menuMobileAberto && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden mb-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden"
            >
              <div className="flex flex-col">
                {[
                  { value: "visao-geral", icon: TrendingUp, label: "Visão Geral" },
                  { value: "agendamentos", icon: Calendar, label: "Agendamentos" },
                  { value: "financeiro", icon: DollarSign, label: "Financeiro" },
                  { value: "atendimentos", icon: Users, label: "Atendimentos" },
                  { value: "estoque", icon: Package, label: "Estoque" },
                  { value: "comissoes", icon: Percent, label: "Comissões" },
                  { value: "usuarios", icon: Users, label: "Usuários" },
                  { value: "servicos", icon: Edit3, label: "Serviços" },
                  { value: "remarcacao", icon: Clock, label: "Remarcação" },
                  { value: "horarios", icon: Clock, label: "Horários" },
                  { value: "configuracoes", icon: Settings, label: "Configurações" },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.value}
                      onClick={() => {
                        setAbaAtiva(item.value);
                        setMenuMobileAberto(false);
                      }}
                      className={`flex items-center gap-3 p-4 text-left transition-colors ${
                        abaAtiva === item.value
                          ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                          : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Visão Geral */}
          <Tabs.Content value="visao-geral">
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                Visão Geral do Negócio
              </h2>
              
              {/* Cards de Métricas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <MetricCard
                  titulo="Receita Mensal"
                  valor={`R$ ${metricas.receitaMensal.toFixed(2)}`}
                  icone={DollarSign}
                  tendencia={{ valor: 0, positiva: true }}
                  carregando={carregando}
                />
                <MetricCard
                  titulo="Atendimentos"
                  valor={metricas.totalAtendimentos.toString()}
                  icone={Users}
                  tendencia={{ valor: 0, positiva: true }}
                  carregando={carregando}
                />
                <MetricCard
                  titulo="Ticket Médio"
                  valor={`R$ ${metricas.ticketMedio.toFixed(2)}`}
                  icone={TrendingUp}
                  carregando={carregando}
                />
                <MetricCard
                  titulo="Despesas Mensais"
                  valor={`R$ ${metricas.totalDespesas.toFixed(2)}`}
                  icone={TrendingDown}
                  carregando={carregando}
                />
                <MetricCard
                  titulo="Lucro Líquido"
                  valor={`R$ ${metricas.lucroLiquido.toFixed(2)}`}
                  icone={metricas.lucroLiquido >= 0 ? TrendingUp : TrendingDown}
                  tendencia={{ 
                    valor: Math.abs(metricas.margemLucro), 
                    positiva: metricas.lucroLiquido >= 0 
                  }}
                  carregando={carregando}
                />
              </div>

              {/* Gráficos e Relatórios */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
                    Receita dos Últimos 7 Dias
                  </h3>
                  <GraficoReceita dados={metricas.receitaPorDia} carregando={carregando} />
                </div>

                <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
                    Atendimentos por Barbeiro
                  </h3>
                  <GraficoBarbeiros dados={metricas.atendimentosPorBarbeiro} carregando={carregando} />
                </div>
              </div>
            </div>
          </Tabs.Content>

          {/* Agendamentos */}
          <Tabs.Content value="agendamentos">
            <GestaoAgendamentos />
          </Tabs.Content>

          {/* Financeiro */}
          <Tabs.Content value="financeiro">
            <GestaoFinanceira />
          </Tabs.Content>

          {/* Atendimentos Presenciais */}
          <Tabs.Content value="atendimentos">
            <AtendimentosPresenciais />
          </Tabs.Content>

          {/* Estoque */}
          <Tabs.Content value="estoque">
            <GestaoEstoque />
          </Tabs.Content>

          {/* Comissões */}
          <Tabs.Content value="comissoes">
            <GestaoComissoes />
          </Tabs.Content>

          {/* Usuários */}
          <Tabs.Content value="usuarios">
            <GestaoUsuarios />
          </Tabs.Content>

          {/* Serviços */}
          <Tabs.Content value="servicos">
            <GestaoServicos />
          </Tabs.Content>

          {/* Remarcação */}
          <Tabs.Content value="remarcacao">
            <RemarcacaoAgendamento />
          </Tabs.Content>

          {/* Horários */}
          <Tabs.Content value="horarios">
            <GestaoHorarios />
          </Tabs.Content>

          {/* Configurações */}
          <Tabs.Content value="configuracoes">
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <Settings className="w-8 h-8 text-zinc-700 dark:text-zinc-300" />
                <div>
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    Configurações da Barbearia
                  </h2>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    Gerencie horários, bloqueios e funcionamento da barbearia
                  </p>
                </div>
              </div>
              
              <GestaoHorariosAvancada />
            </div>
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </div>
  );
}

// Componente auxiliar para cards de métrica
function MetricCard({ 
  titulo, 
  valor, 
  icone: Icone, 
  tendencia,
  carregando = false
}: { 
  titulo: string; 
  valor: string; 
  icone: any; 
  tendencia?: { valor: number; positiva: boolean };
  carregando?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800">
          <Icone className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
        </div>
        {tendencia && !carregando && (
          <div className={`text-sm font-medium ${tendencia.positiva ? 'text-green-600' : 'text-red-600'}`}>
            {tendencia.positiva ? '+' : ''}{tendencia.valor}%
          </div>
        )}
      </div>
      
      <div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">{titulo}</p>
        {carregando ? (
          <div className="h-8 w-24 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" />
        ) : (
          <p className="text-2xl font-bold text-zinc-900 dark:text-white">{valor}</p>
        )}
      </div>
    </motion.div>
  );
}

// Componente de gráfico de receita
function GraficoReceita({ 
  dados, 
  carregando 
}: { 
  dados: { data: string; valor: number }[]; 
  carregando: boolean;
}) {
  if (carregando) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-pulse text-zinc-500 dark:text-zinc-400">
          Carregando dados...
        </div>
      </div>
    );
  }

  if (dados.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
        Nenhum dado disponível
      </div>
    );
  }

  const maxValor = Math.max(...dados.map(d => d.valor));

  return (
    <div className="h-64">
      <div className="flex items-end justify-between h-48 gap-2">
        {dados.map((item, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div 
              className="w-full bg-blue-500 rounded-t transition-all duration-500 hover:bg-blue-600"
              style={{ 
                height: maxValor > 0 ? `${(item.valor / maxValor) * 100}%` : '2px',
                minHeight: '2px'
              }}
            />
            <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 text-center">
              {item.data}
            </div>
            <div className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
              R$ {item.valor.toFixed(0)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Componente de gráfico de barbeiros
function GraficoBarbeiros({ 
  dados, 
  carregando 
}: { 
  dados: { nome: string; total: number }[]; 
  carregando: boolean;
}) {
  if (carregando) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-pulse text-zinc-500 dark:text-zinc-400">
          Carregando dados...
        </div>
      </div>
    );
  }

  if (dados.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
        Nenhum dado disponível
      </div>
    );
  }

  const cores = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500'];

  return (
    <div className="h-64 space-y-4">
      {dados.map((item, index) => (
        <div key={index} className="flex items-center gap-3">
          <div className="w-24 text-sm text-zinc-900 dark:text-zinc-100 truncate">
            {item.nome}
          </div>
          <div className="flex-1 bg-zinc-200 dark:bg-zinc-800 rounded-full h-6 relative overflow-hidden">
            <div 
              className={`h-full ${cores[index % cores.length]} rounded-full transition-all duration-500`}
              style={{ 
                width: dados.length > 0 ? `${(item.total / Math.max(...dados.map(d => d.total))) * 100}%` : '0%'
              }}
            />
          </div>
          <div className="w-8 text-sm font-medium text-zinc-900 dark:text-zinc-100 text-right">
            {item.total}
          </div>
        </div>
      ))}
    </div>
  );
}
