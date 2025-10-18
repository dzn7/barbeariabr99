"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Settings, User, Clock, DollarSign, Save, Plus, Trash2 } from "lucide-react";
import { Card, Tabs, Button, TextField, TextArea, Switch } from "@radix-ui/themes";
import type { Barbeiro, Servico, HorarioDisponivel } from "@/types";

/**
 * Página de configurações
 * Permite gerenciar barbeiros, serviços e horários
 */
export default function PaginaConfiguracoes() {
  const [abaAtiva, setAbaAtiva] = useState("barbeiros");

  // Estados para barbeiros
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([
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
      nome: "Derick Mackenizie",
      email: "derick@barbearia.com",
      telefone: "(86) 98765-4322",
      especialidades: ["Corte Moderno", "Barba", "Pigmentação"],
      fotoUrl: null,
      ativo: true,
      dataCadastro: new Date(),
    },
  ]);

  // Estados para serviços
  const [servicos, setServicos] = useState<Servico[]>([
    {
      id: "1",
      nome: "Corte de Cabelo",
      descricao: "Corte tradicional ou moderno",
      duracao: 30,
      preco: 50,
      ativo: true,
    },
    {
      id: "2",
      nome: "Barba",
      descricao: "Aparar e modelar a barba",
      duracao: 20,
      preco: 35,
      ativo: true,
    },
    {
      id: "3",
      nome: "Corte + Barba",
      descricao: "Pacote completo",
      duracao: 45,
      preco: 75,
      ativo: true,
    },
  ]);

  // Estados para formulário de novo barbeiro
  const [novoBarbeiro, setNovoBarbeiro] = useState({
    nome: "",
    email: "",
    telefone: "",
    especialidades: "",
  });

  // Estados para formulário de novo serviço
  const [novoServico, setNovoServico] = useState({
    nome: "",
    descricao: "",
    duracao: "",
    preco: "",
  });

  /**
   * Adiciona um novo barbeiro
   */
  const adicionarBarbeiro = () => {
    if (!novoBarbeiro.nome || !novoBarbeiro.email || !novoBarbeiro.telefone) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }

    const barbeiro: Barbeiro = {
      id: Date.now().toString(),
      nome: novoBarbeiro.nome,
      email: novoBarbeiro.email,
      telefone: novoBarbeiro.telefone,
      especialidades: novoBarbeiro.especialidades.split(",").map(e => e.trim()),
      fotoUrl: null,
      ativo: true,
      dataCadastro: new Date(),
    };

    setBarbeiros([...barbeiros, barbeiro]);
    setNovoBarbeiro({ nome: "", email: "", telefone: "", especialidades: "" });
  };

  /**
   * Remove um barbeiro
   */
  const removerBarbeiro = (id: string) => {
    if (confirm("Tem certeza que deseja remover este barbeiro?")) {
      setBarbeiros(barbeiros.filter(b => b.id !== id));
    }
  };

  /**
   * Adiciona um novo serviço
   */
  const adicionarServico = () => {
    if (!novoServico.nome || !novoServico.descricao || !novoServico.duracao || !novoServico.preco) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }

    const servico: Servico = {
      id: Date.now().toString(),
      nome: novoServico.nome,
      descricao: novoServico.descricao,
      duracao: parseInt(novoServico.duracao),
      preco: parseFloat(novoServico.preco),
      ativo: true,
    };

    setServicos([...servicos, servico]);
    setNovoServico({ nome: "", descricao: "", duracao: "", preco: "" });
  };

  /**
   * Remove um serviço
   */
  const removerServico = (id: string) => {
    if (confirm("Tem certeza que deseja remover este serviço?")) {
      setServicos(servicos.filter(s => s.id !== id));
    }
  };

  /**
   * Alterna o status ativo de um barbeiro
   */
  const alternarStatusBarbeiro = (id: string) => {
    setBarbeiros(barbeiros.map(b => 
      b.id === id ? { ...b, ativo: !b.ativo } : b
    ));
  };

  /**
   * Alterna o status ativo de um serviço
   */
  const alternarStatusServico = (id: string) => {
    setServicos(servicos.map(s => 
      s.id === id ? { ...s, ativo: !s.ativo } : s
    ));
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900 py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Cabeçalho */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <Settings className="h-8 w-8 text-zinc-900 dark:text-zinc-100" />
            <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">
              Configurações
            </h1>
          </div>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Gerencie barbeiros, serviços e horários da barbearia
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <Tabs.Root value={abaAtiva} onValueChange={setAbaAtiva}>
              <Tabs.List>
                <Tabs.Trigger value="barbeiros">
                  <User className="h-4 w-4 mr-2" />
                  Barbeiros
                </Tabs.Trigger>
                <Tabs.Trigger value="servicos">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Serviços
                </Tabs.Trigger>
                <Tabs.Trigger value="horarios">
                  <Clock className="h-4 w-4 mr-2" />
                  Horários
                </Tabs.Trigger>
              </Tabs.List>

              {/* Aba de Barbeiros */}
              <Tabs.Content value="barbeiros">
                <div className="mt-6 space-y-6">
                  {/* Formulário de novo barbeiro */}
                  <div className="p-6 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                      Adicionar Novo Barbeiro
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                          Nome Completo *
                        </label>
                        <TextField.Root
                          placeholder="Nome do barbeiro"
                          value={novoBarbeiro.nome}
                          onChange={(e) => setNovoBarbeiro({ ...novoBarbeiro, nome: e.target.value })}
                          size="3"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                          Email *
                        </label>
                        <TextField.Root
                          type="email"
                          placeholder="email@exemplo.com"
                          value={novoBarbeiro.email}
                          onChange={(e) => setNovoBarbeiro({ ...novoBarbeiro, email: e.target.value })}
                          size="3"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                          Telefone *
                        </label>
                        <TextField.Root
                          type="tel"
                          placeholder="(86) 99953-3738"
                          value={novoBarbeiro.telefone}
                          onChange={(e) => setNovoBarbeiro({ ...novoBarbeiro, telefone: e.target.value })}
                          size="3"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                          Especialidades (separadas por vírgula)
                        </label>
                        <TextField.Root
                          placeholder="Corte, Barba, Degradê"
                          value={novoBarbeiro.especialidades}
                          onChange={(e) => setNovoBarbeiro({ ...novoBarbeiro, especialidades: e.target.value })}
                          size="3"
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <Button
                        size="3"
                        onClick={adicionarBarbeiro}
                        className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 cursor-pointer"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Barbeiro
                      </Button>
                    </div>
                  </div>

                  {/* Lista de barbeiros */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                      Barbeiros Cadastrados ({barbeiros.length})
                    </h3>
                    {barbeiros.map((barbeiro) => (
                      <motion.div
                        key={barbeiro.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                                {barbeiro.nome}
                              </h4>
                              <Switch
                                checked={barbeiro.ativo}
                                onCheckedChange={() => alternarStatusBarbeiro(barbeiro.id)}
                              />
                              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                                {barbeiro.ativo ? "Ativo" : "Inativo"}
                              </span>
                            </div>
                            <div className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                              <p>Email: {barbeiro.email}</p>
                              <p>Telefone: {barbeiro.telefone}</p>
                              <p>Especialidades: {barbeiro.especialidades.join(", ")}</p>
                            </div>
                          </div>
                          <Button
                            size="2"
                            variant="outline"
                            onClick={() => removerBarbeiro(barbeiro.id)}
                            className="border-red-600 dark:border-red-500 text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </Tabs.Content>

              {/* Aba de Serviços */}
              <Tabs.Content value="servicos">
                <div className="mt-6 space-y-6">
                  {/* Formulário de novo serviço */}
                  <div className="p-6 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                      Adicionar Novo Serviço
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                          Nome do Serviço *
                        </label>
                        <TextField.Root
                          placeholder="Ex: Corte de Cabelo"
                          value={novoServico.nome}
                          onChange={(e) => setNovoServico({ ...novoServico, nome: e.target.value })}
                          size="3"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                          Duração (minutos) *
                        </label>
                        <TextField.Root
                          type="number"
                          placeholder="30"
                          value={novoServico.duracao}
                          onChange={(e) => setNovoServico({ ...novoServico, duracao: e.target.value })}
                          size="3"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                          Preço (R$) *
                        </label>
                        <TextField.Root
                          type="number"
                          step="0.01"
                          placeholder="50.00"
                          value={novoServico.preco}
                          onChange={(e) => setNovoServico({ ...novoServico, preco: e.target.value })}
                          size="3"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                          Descrição *
                        </label>
                        <TextArea
                          placeholder="Descrição do serviço"
                          value={novoServico.descricao}
                          onChange={(e) => setNovoServico({ ...novoServico, descricao: e.target.value })}
                          rows={3}
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <Button
                        size="3"
                        onClick={adicionarServico}
                        className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 cursor-pointer"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Serviço
                      </Button>
                    </div>
                  </div>

                  {/* Lista de serviços */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                      Serviços Cadastrados ({servicos.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {servicos.map((servico) => (
                        <motion.div
                          key={servico.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                              {servico.nome}
                            </h4>
                            <Button
                              size="1"
                              variant="outline"
                              onClick={() => removerServico(servico.id)}
                              className="border-red-600 dark:border-red-500 text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 cursor-pointer"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                            {servico.descricao}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="space-y-1 text-sm">
                              <p className="text-zinc-600 dark:text-zinc-400">
                                Duração: <span className="font-medium text-zinc-900 dark:text-zinc-100">{servico.duracao} min</span>
                              </p>
                              <p className="text-zinc-600 dark:text-zinc-400">
                                Preço: <span className="font-bold text-zinc-900 dark:text-zinc-100">R$ {servico.preco.toFixed(2)}</span>
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={servico.ativo}
                                onCheckedChange={() => alternarStatusServico(servico.id)}
                              />
                              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                                {servico.ativo ? "Ativo" : "Inativo"}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </Tabs.Content>

              {/* Aba de Horários */}
              <Tabs.Content value="horarios">
                <div className="mt-6 space-y-6">
                  <div className="p-6 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                      Configurar Horários de Funcionamento
                    </h3>
                    <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                      Configure os horários de funcionamento da barbearia para cada dia da semana.
                    </p>
                    
                    <div className="space-y-4">
                      {[
                        { dia: "Segunda-feira", valor: 1 },
                        { dia: "Terça-feira", valor: 2 },
                        { dia: "Quarta-feira", valor: 3 },
                        { dia: "Quinta-feira", valor: 4 },
                        { dia: "Sexta-feira", valor: 5 },
                        { dia: "Sábado", valor: 6 },
                        { dia: "Domingo", valor: 0 },
                      ].map((item) => (
                        <div
                          key={item.valor}
                          className="flex items-center gap-4 p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">
                              {item.dia}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <TextField.Root
                              type="time"
                              defaultValue="09:00"
                              size="2"
                              className="w-32"
                            />
                            <span className="text-zinc-600 dark:text-zinc-400">até</span>
                            <TextField.Root
                              type="time"
                              defaultValue="18:00"
                              size="2"
                              className="w-32"
                            />
                          </div>
                          <Switch defaultChecked={item.valor !== 0} />
                        </div>
                      ))}
                    </div>

                    <div className="mt-6">
                      <Button
                        size="3"
                        className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 cursor-pointer"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Salvar Horários
                      </Button>
                    </div>
                  </div>
                </div>
              </Tabs.Content>
            </Tabs.Root>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
