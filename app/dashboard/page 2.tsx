"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Calendar, Clock, User, Scissors, CheckCircle, XCircle, AlertCircle, TrendingUp,
  DollarSign, Users, BarChart3, LogOut, Filter, Search, Download, RefreshCw, Phone
} from "lucide-react";
import { Card, Badge, Tabs, Button, TextField } from "@radix-ui/themes";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useRouter } from "next/navigation";
import Link from "next/link";

/**
 * Dashboard profissional para gerenciamento da barbearia
 * Acesso restrito apenas para funcionários autenticados
 */
export default function PaginaDashboard() {
  const router = useRouter();
  const [abaAtiva, setAbaAtiva] = useState("hoje");
  const [termoBusca, setTermoBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");

  // Dados de exemplo - em produção viriam do Supabase
  const agendamentosExemplo = [
    {
      id: "1",
      clienteNome: "João Silva",
      clienteTelefone: "(86) 98765-1234",
      barbeiroNome: "Carlos Silva",
      servicoNome: "Corte de Cabelo",
      servicoPreco: 50,
      dataHora: new Date(2025, 9, 11, 10, 0),
      status: "confirmado" as const,
      observacoes: null,
    },
    {
      id: "2",
      clienteNome: "Pedro Santos",
      clienteTelefone: "(86) 98765-5678",
      barbeiroNome: "Roberto Santos",
      servicoNome: "Corte + Barba",
      servicoPreco: 75,
      dataHora: new Date(2025, 9, 11, 14, 30),
      status: "pendente" as const,
      observacoes: "Cliente prefere degradê baixo",
    },
    {
      id: "3",
      clienteNome: "Lucas Oliveira",
      clienteTelefone: "(86) 98765-9012",
      barbeiroNome: "Carlos Silva",
      servicoNome: "Barba",
      servicoPreco: 35,
      dataHora: new Date(2025, 9, 10, 9, 0),
      status: "concluido" as const,
      observacoes: null,
    },
    {
      id: "4",
      clienteNome: "Rafael Costa",
      clienteTelefone: "(86) 98765-3456",
      barbeiroNome: "Roberto Santos",
      servicoNome: "Corte de Cabelo",
      servicoPreco: 50,
      dataHora: new Date(2025, 9, 10, 16, 0),
      status: "cancelado" as const,
      observacoes: "Cliente cancelou por motivos pessoais",
    },
  ];

  /**
   * Filtra agendamentos por aba e busca
   */
  const agendamentosFiltrados = agendamentosExemplo.filter((agendamento) => {
    // Filtro por aba
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataAgendamento = new Date(agendamento.dataHora);
    dataAgendamento.setHours(0, 0, 0, 0);

    let passaFiltroAba = true;
    if (abaAtiva === "hoje") {
      passaFiltroAba = dataAgendamento.getTime() === hoje.getTime();
    } else if (abaAtiva === "pendentes") {
      passaFiltroAba = agendamento.status === "pendente";
    }

    // Filtro por busca
    const passaBusca = termoBusca === "" || 
      agendamento.clienteNome.toLowerCase().includes(termoBusca.toLowerCase()) ||
      agendamento.clienteTelefone.includes(termoBusca);

    // Filtro por status
    const passaStatus = filtroStatus === "todos" || agendamento.status === filtroStatus;

    return passaFiltroAba && passaBusca && passaStatus;
  });

  /**
   * Calcula estatísticas
   */
  const estatisticas = {
    hoje: agendamentosExemplo.filter(a => {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const dataAgendamento = new Date(a.dataHora);
      dataAgendamento.setHours(0, 0, 0, 0);
      return dataAgendamento.getTime() === hoje.getTime();
    }).length,
    pendentes: agendamentosExemplo.filter(a => a.status === "pendente").length,
    confirmados: agendamentosExemplo.filter(a => a.status === "confirmado").length,
    receitaDia: agendamentosExemplo
      .filter(a => {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const dataAgendamento = new Date(a.dataHora);
        dataAgendamento.setHours(0, 0, 0, 0);
        return dataAgendamento.getTime() === hoje.getTime() && a.status === "concluido";
      })
      .reduce((acc, a) => acc + a.servicoPreco, 0),
    receitaMes: agendamentosExemplo
      .filter(a => a.status === "concluido")
      .reduce((acc, a) => acc + a.servicoPreco, 0),
    totalClientes: new Set(agendamentosExemplo.map(a => a.clienteNome)).size,
  };

  /**
   * Retorna cor do badge por status
   */
  const corStatus = (status: string) => {
    switch (status) {
      case "confirmado": return "blue";
      case "pendente": return "yellow";
      case "concluido": return "green";
      case "cancelado": return "red";
      default: return "gray";
    }
  };

  /**
   * Retorna texto do status
   */
  const textoStatus = (status: string) => {
    switch (status) {
      case "confirmado": return "Confirmado";
      case "pendente": return "Pendente";
      case "concluido": return "Concluído";
      case "cancelado": return "Cancelado";
      default: return status;
    }
  };

  /**
   * Faz logout do sistema
   */
  const fazerLogout = () => {
    document.cookie = "sb-access-token=; path=/; max-age=0";
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900">
      {/* Cabeçalho do Dashboard */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Scissors className="h-8 w-8 text-zinc-900 dark:text-zinc-100" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  Dashboard
                </h1>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Painel de controle administrativo
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/configuracoes">
                <Button
                  size="2"
                  variant="outline"
                  className="cursor-pointer"
                >
                  Configurações
                </Button>
              </Link>
              <Button
                size="2"
                variant="outline"
                onClick={fazerLogout}
                className="cursor-pointer text-red-600 dark:text-red-400 border-red-600 dark:border-red-400"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                </div>
                <Badge color="blue" size="2">Hoje</Badge>
              </div>
              <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                {estatisticas.hoje}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Agendamentos hoje
              </p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-300" />
                </div>
                <Badge color="yellow" size="2">Atenção</Badge>
              </div>
              <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                {estatisticas.pendentes}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Aguardando confirmação
              </p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600 dark:text-green-300" />
                </div>
                <Badge color="green" size="2">Receita</Badge>
              </div>
              <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                R$ {estatisticas.receitaMes.toFixed(2)}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Faturamento do mês
              </p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Users className="h-6 w-6 text-purple-600 dark:text-purple-300" />
                </div>
                <Badge color="purple" size="2">Clientes</Badge>
              </div>
              <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                {estatisticas.totalClientes}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Clientes atendidos
              </p>
            </Card>
          </motion.div>
        </div>

        {/* Filtros e Busca */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-6"
        >
          <Card className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                  <TextField.Root
                    placeholder="Buscar por nome ou telefone..."
                    value={termoBusca}
                    onChange={(e) => setTermoBusca(e.target.value)}
                    size="3"
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="3"
                  variant="outline"
                  className="cursor-pointer"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                </Button>
                <Button
                  size="3"
                  variant="outline"
                  className="cursor-pointer"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
                <Button
                  size="3"
                  variant="outline"
                  className="cursor-pointer"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Lista de Agendamentos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <Tabs.Root value={abaAtiva} onValueChange={setAbaAtiva}>
              <Tabs.List>
                <Tabs.Trigger value="hoje">Hoje</Tabs.Trigger>
                <Tabs.Trigger value="pendentes">Pendentes</Tabs.Trigger>
                <Tabs.Trigger value="todos">Todos</Tabs.Trigger>
              </Tabs.List>

              <div className="mt-6 space-y-4">
                {agendamentosFiltrados.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-zinc-400 dark:text-zinc-600 mx-auto mb-4" />
                    <p className="text-lg text-zinc-600 dark:text-zinc-400">
                      Nenhum agendamento encontrado
                    </p>
                  </div>
                ) : (
                  agendamentosFiltrados.map((agendamento, index) => (
                    <motion.div
                      key={agendamento.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-2">
                            <Badge color={corStatus(agendamento.status)}>
                              {textoStatus(agendamento.status)}
                            </Badge>
                            <span className="text-sm text-zinc-600 dark:text-zinc-400">
                              {format(agendamento.dataHora, "dd/MM/yyyy 'às' HH:mm")}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                              <div>
                                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                  {agendamento.clienteNome}
                                </p>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {agendamento.clienteTelefone}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Scissors className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                              <div>
                                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                  {agendamento.servicoNome}
                                </p>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                                  com {agendamento.barbeiroNome} • R$ {agendamento.servicoPreco.toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </div>

                          {agendamento.observacoes && (
                            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700">
                              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                                <span className="font-medium">Obs:</span> {agendamento.observacoes}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex lg:flex-col gap-2">
                          {agendamento.status === "pendente" && (
                            <>
                              <Button
                                size="2"
                                className="flex-1 lg:flex-none bg-green-600 dark:bg-green-500 text-white hover:bg-green-700 dark:hover:bg-green-600 cursor-pointer"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Confirmar
                              </Button>
                              <Button
                                size="2"
                                variant="outline"
                                className="flex-1 lg:flex-none border-red-600 dark:border-red-500 text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 cursor-pointer"
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Cancelar
                              </Button>
                            </>
                          )}
                          {agendamento.status === "confirmado" && (
                            <Button
                              size="2"
                              className="bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 cursor-pointer"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Concluir
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </Tabs.Root>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
