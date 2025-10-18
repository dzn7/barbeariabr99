"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  DollarSign, TrendingUp, TrendingDown, Calendar, Plus, Filter, Trash2, Download, CheckCircle, XCircle, AlertCircle 
} from "lucide-react";
import { Button, Select, TextField, TextArea, Dialog } from "@radix-ui/themes";
import { supabase } from "@/lib/supabase";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Transacao, CategoriaDespesa, FormaPagamento } from "@/types";

interface ModalFeedback {
  aberto: boolean;
  tipo: 'sucesso' | 'erro' | 'confirmacao';
  titulo: string;
  mensagem: string;
  onConfirmar?: () => void;
}

/**
 * Componente de Gestão Financeira
 * Controle completo de receitas e despesas
 */
export function GestaoFinanceira() {
  const [modalAberto, setModalAberto] = useState(false);
  const [tipoTransacao, setTipoTransacao] = useState<"receita" | "despesa">("despesa");
  const [categoria, setCategoria] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("");
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [transacoes, setTransacoes] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [modalFeedback, setModalFeedback] = useState<ModalFeedback>({
    aberto: false,
    tipo: 'sucesso',
    titulo: '',
    mensagem: '',
  });
  const [metricas, setMetricas] = useState({
    receitas: 0,
    despesas: 0,
    lucroLiquido: 0,
    margemLucro: 0
  });

  useEffect(() => {
    buscarTransacoes();
  }, []);

  const categoriasDespesa: { valor: CategoriaDespesa; label: string }[] = [
    { valor: "luz", label: "Luz" },
    { valor: "agua", label: "Água" },
    { valor: "aluguel", label: "Aluguel" },
    { valor: "internet", label: "Internet" },
    { valor: "marketing", label: "Marketing" },
    { valor: "produtos", label: "Produtos" },
    { valor: "manutencao", label: "Manutenção" },
    { valor: "salarios", label: "Salários" },
    { valor: "impostos", label: "Impostos" },
    { valor: "outros", label: "Outros" },
  ];

  const formasPagamento: { valor: FormaPagamento; label: string }[] = [
    { valor: "dinheiro", label: "Dinheiro" },
    { valor: "pix", label: "PIX" },
    { valor: "debito", label: "Débito" },
    { valor: "credito", label: "Crédito" },
    { valor: "transferencia", label: "Transferência" },
  ];

  const buscarTransacoes = async () => {
    try {
      const inicioMes = startOfMonth(new Date()).toISOString();
      const fimMes = endOfMonth(new Date()).toISOString();

      const { data, error } = await supabase
        .from('transacoes')
        .select('*')
        .gte('data', inicioMes)
        .lte('data', fimMes)
        .order('data', { ascending: false });

      if (error) throw error;

      console.log('Transações carregadas:', data);
      setTransacoes(data || []);
      calcularMetricas(data || []);
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
    } finally {
      setCarregando(false);
    }
  };

  const calcularMetricas = (transacoesList: any[]) => {
    const receitas = transacoesList
      .filter(t => t.tipo === 'receita')
      .reduce((sum, t) => sum + t.valor, 0);
    
    const despesas = transacoesList
      .filter(t => t.tipo === 'despesa')
      .reduce((sum, t) => sum + t.valor, 0);
    
    const lucroLiquido = receitas - despesas;
    const margemLucro = receitas > 0 ? (lucroLiquido / receitas) * 100 : 0;

    setMetricas({
      receitas,
      despesas,
      lucroLiquido,
      margemLucro
    });
  };

  const mostrarFeedback = (tipo: 'sucesso' | 'erro', titulo: string, mensagem: string) => {
    setModalFeedback({
      aberto: true,
      tipo,
      titulo,
      mensagem,
    });
  };

  const salvarTransacao = async () => {
    setSalvando(true);
    try {
      const { data: novaTransacao, error } = await supabase
        .from('transacoes')
        .insert([{
          tipo: tipoTransacao,
          categoria: tipoTransacao === 'despesa' ? categoria : 'servico',
          descricao,
          valor: parseFloat(valor),
          forma_pagamento: formaPagamento,
          data: new Date(data).toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;

      console.log('Transação salva:', novaTransacao);
      
      // Limpar formulário
      setCategoria('');
      setDescricao('');
      setValor('');
      setFormaPagamento('');
      setData(new Date().toISOString().split('T')[0]);
      setModalAberto(false);

      // Recarregar transações
      await buscarTransacoes();
      mostrarFeedback('sucesso', 'Transação registrada', 'Transação salva com sucesso!');
    } catch (error: any) {
      console.error('Erro ao salvar transação:', error);
      mostrarFeedback('erro', 'Erro ao salvar', error.message || 'Erro desconhecido');
    } finally {
      setSalvando(false);
    }
  };

  const confirmarDelecao = (transacaoId: string, descricao: string) => {
    setModalFeedback({
      aberto: true,
      tipo: 'confirmacao',
      titulo: 'Confirmar exclusão',
      mensagem: `Tem certeza que deseja excluir a transação "${descricao}"?`,
      onConfirmar: () => deletarTransacao(transacaoId),
    });
  };

  const deletarTransacao = async (transacaoId: string) => {
    setSalvando(true);
    try {
      const { error } = await supabase
        .from('transacoes')
        .delete()
        .eq('id', transacaoId);

      if (error) throw error;

      await buscarTransacoes();
      setModalFeedback({ aberto: false, tipo: 'sucesso', titulo: '', mensagem: '' });
      mostrarFeedback('sucesso', 'Transação removida', 'Transação excluída com sucesso!');
    } catch (error: any) {
      console.error('Erro ao deletar transação:', error);
      mostrarFeedback('erro', 'Erro ao excluir', error.message || 'Erro desconhecido');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Gestão Financeira
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            Controle de receitas e despesas
          </p>
        </div>
        <Button
          onClick={() => setModalAberto(true)}
          className="bg-zinc-900 dark:bg-white text-white dark:text-black cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Transação
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Receitas</span>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white">
            R$ {metricas.receitas.toFixed(2)}
          </p>
          <p className="text-xs text-green-600 mt-1">Este mês</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Despesas</span>
            <TrendingDown className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white">
            R$ {metricas.despesas.toFixed(2)}
          </p>
          <p className="text-xs text-red-600 mt-1">Este mês</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Lucro Líquido</span>
            <DollarSign className={`w-5 h-5 ${metricas.lucroLiquido >= 0 ? 'text-green-600' : 'text-red-600'}`} />
          </div>
          <p className={`text-2xl font-bold ${metricas.lucroLiquido >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            R$ {metricas.lucroLiquido.toFixed(2)}
          </p>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
            Margem: {metricas.margemLucro.toFixed(1)}%
          </p>
        </motion.div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-wrap gap-4">
          <Select.Root defaultValue="todos">
            <Select.Trigger className="w-40" />
            <Select.Content>
              <Select.Item value="todos">Todos</Select.Item>
              <Select.Item value="receita">Receitas</Select.Item>
              <Select.Item value="despesa">Despesas</Select.Item>
            </Select.Content>
          </Select.Root>

          <TextField.Root
            type="date"
            className="w-40"
            placeholder="Data início"
          />

          <TextField.Root
            type="date"
            className="w-40"
            placeholder="Data fim"
          />

          <Button variant="outline" className="cursor-pointer">
            <Filter className="w-4 h-4 mr-2" />
            Filtrar
          </Button>

          <Button variant="outline" className="cursor-pointer ml-auto">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Lista de Transações */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50 dark:bg-zinc-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">
                  Descrição
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">
                  Pagamento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {transacoes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-zinc-500 dark:text-zinc-400">
                    Nenhuma transação registrada
                  </td>
                </tr>
              ) : (
                transacoes.map((transacao) => (
                  <tr key={transacao.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900 dark:text-zinc-100">
                      {new Date(transacao.data).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        transacao.tipo === 'receita'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {transacao.tipo === 'receita' ? 'Receita' : 'Despesa'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900 dark:text-zinc-100">
                      {transacao.categoria}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-900 dark:text-zinc-100">
                      {transacao.descricao}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      R$ {transacao.valor.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
                      {transacao.forma_pagamento}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Button 
                        size="1" 
                        variant="soft" 
                        color="red" 
                        className="cursor-pointer"
                        onClick={() => confirmarDelecao(transacao.id, transacao.descricao)}
                        title="Excluir transação"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Nova Transação */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">
              Nova Transação
            </h3>

            <div className="space-y-4">
              {/* Tipo */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Tipo
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTipoTransacao("receita")}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      tipoTransacao === "receita"
                        ? "bg-green-600 text-white"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                    }`}
                  >
                    Receita
                  </button>
                  <button
                    onClick={() => setTipoTransacao("despesa")}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      tipoTransacao === "despesa"
                        ? "bg-red-600 text-white"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                    }`}
                  >
                    Despesa
                  </button>
                </div>
              </div>

              {/* Categoria */}
              {tipoTransacao === "despesa" && (
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Categoria
                  </label>
                  <Select.Root value={categoria} onValueChange={setCategoria}>
                    <Select.Trigger className="w-full" />
                    <Select.Content>
                      {categoriasDespesa.map((cat) => (
                        <Select.Item key={cat.valor} value={cat.valor}>
                          {cat.label}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                </div>
              )}

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Descrição
                </label>
                <TextField.Root
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Ex: Conta de luz"
                />
              </div>

              {/* Valor */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Valor
                </label>
                <TextField.Root
                  type="number"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder="0,00"
                />
              </div>

              {/* Forma de Pagamento */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Forma de Pagamento
                </label>
                <Select.Root value={formaPagamento} onValueChange={setFormaPagamento}>
                  <Select.Trigger className="w-full" />
                  <Select.Content>
                    {formasPagamento.map((forma) => (
                      <Select.Item key={forma.valor} value={forma.valor}>
                        {forma.label}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </div>

              {/* Data */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Data
                </label>
                <TextField.Root
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => setModalAberto(false)}
                variant="outline"
                className="flex-1 cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                onClick={salvarTransacao}
                className="flex-1 bg-zinc-900 dark:bg-white text-white dark:text-black cursor-pointer"
              >
                Salvar
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal de Feedback */}
      <Dialog.Root open={modalFeedback.aberto} onOpenChange={(aberto) => setModalFeedback({ ...modalFeedback, aberto })}>
        <Dialog.Content style={{ maxWidth: 450 }} className="p-0 overflow-hidden">
          <div className={`p-6 ${
            modalFeedback.tipo === 'sucesso' 
              ? 'bg-green-50 dark:bg-green-900/10' 
              : modalFeedback.tipo === 'erro'
              ? 'bg-red-50 dark:bg-red-900/10'
              : 'bg-orange-50 dark:bg-orange-900/10'
          }`}>
            <div className="flex items-start gap-4">
              <div className={`p-2 rounded-full ${
                modalFeedback.tipo === 'sucesso' 
                  ? 'bg-green-100 dark:bg-green-900/30' 
                  : modalFeedback.tipo === 'erro'
                  ? 'bg-red-100 dark:bg-red-900/30'
                  : 'bg-orange-100 dark:bg-orange-900/30'
              }`}>
                {modalFeedback.tipo === 'sucesso' && (
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                )}
                {modalFeedback.tipo === 'erro' && (
                  <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                )}
                {modalFeedback.tipo === 'confirmacao' && (
                  <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                )}
              </div>
              
              <div className="flex-1">
                <Dialog.Title className={`text-lg font-semibold mb-2 ${
                  modalFeedback.tipo === 'sucesso' 
                    ? 'text-green-900 dark:text-green-100' 
                    : modalFeedback.tipo === 'erro'
                    ? 'text-red-900 dark:text-red-100'
                    : 'text-orange-900 dark:text-orange-100'
                }`}>
                  {modalFeedback.titulo}
                </Dialog.Title>
                <Dialog.Description className={`${
                  modalFeedback.tipo === 'sucesso' 
                    ? 'text-green-700 dark:text-green-300' 
                    : modalFeedback.tipo === 'erro'
                    ? 'text-red-700 dark:text-red-300'
                    : 'text-orange-700 dark:text-orange-300'
                }`}>
                  {modalFeedback.mensagem}
                </Dialog.Description>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-zinc-900 flex gap-3 justify-end">
            {modalFeedback.tipo === 'confirmacao' ? (
              <>
                <Dialog.Close>
                  <Button variant="soft" className="cursor-pointer">
                    Cancelar
                  </Button>
                </Dialog.Close>
                <Button
                  onClick={() => {
                    modalFeedback.onConfirmar?.();
                  }}
                  disabled={salvando}
                  className="bg-red-600 text-white hover:bg-red-700 cursor-pointer"
                >
                  {salvando ? 'Excluindo...' : 'Confirmar Exclusão'}
                </Button>
              </>
            ) : (
              <Dialog.Close>
                <Button 
                  className={`cursor-pointer ${
                    modalFeedback.tipo === 'sucesso'
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  Entendi
                </Button>
              </Dialog.Close>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Root>
    </div>
  );
}
