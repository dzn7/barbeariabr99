"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Plus, AlertTriangle, TrendingDown, TrendingUp, Trash2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Button, TextField, TextArea, Dialog } from "@radix-ui/themes";
import { supabase } from "@/lib/supabase";
import type { Produto } from "@/types";

interface NovoProdutoForm {
  nome: string;
  descricao: string;
  categoria: string;
  quantidadeEstoque: number;
  quantidadeMinima: number;
  precoCompra: number;
  precoVenda: number;
  fornecedor: string;
}

interface ModalFeedback {
  aberto: boolean;
  tipo: 'sucesso' | 'erro' | 'confirmacao';
  titulo: string;
  mensagem: string;
  onConfirmar?: () => void;
}

/**
 * Componente de Gestão de Estoque
 * Controle completo de produtos e movimentações
 */
export function GestaoEstoque() {
  const [modalAberto, setModalAberto] = useState(false);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [produtoParaDeletar, setProdutoParaDeletar] = useState<string | null>(null);
  const [modalFeedback, setModalFeedback] = useState<ModalFeedback>({
    aberto: false,
    tipo: 'sucesso',
    titulo: '',
    mensagem: '',
  });
  const [novoProduto, setNovoProduto] = useState<NovoProdutoForm>({
    nome: "",
    descricao: "",
    categoria: "pomada",
    quantidadeEstoque: 0,
    quantidadeMinima: 5,
    precoCompra: 0,
    precoVenda: 0,
    fornecedor: "",
  });

  useEffect(() => {
    buscarProdutos();
  }, []);

  const buscarProdutos = async () => {
    try {
      const { data, error } = await supabase
        .from("produtos")
        .select("*")
        .eq("ativo", true)
        .order("nome");

      if (error) throw error;
      
      // Mapear snake_case do banco para camelCase do TypeScript
      const produtosMapeados = (data || []).map((p: any) => ({
        id: p.id,
        nome: p.nome,
        descricao: p.descricao,
        categoria: p.categoria,
        quantidadeEstoque: p.quantidade_estoque,
        quantidadeMinima: p.quantidade_minima,
        precoCompra: p.preco_compra,
        precoVenda: p.preco_venda,
        fornecedor: p.fornecedor,
        ativo: p.ativo,
        criadoEm: p.criado_em,
        atualizadoEm: p.atualizado_em,
      }));
      
      setProdutos(produtosMapeados);
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
    } finally {
      setCarregando(false);
    }
  };

  const mostrarFeedback = (tipo: 'sucesso' | 'erro', titulo: string, mensagem: string) => {
    setModalFeedback({
      aberto: true,
      tipo,
      titulo,
      mensagem,
    });
  };

  const criarProduto = async () => {
    if (!novoProduto.nome.trim()) {
      mostrarFeedback('erro', 'Campo obrigatório', 'Nome do produto é obrigatório');
      return;
    }

    if (novoProduto.precoCompra <= 0 || novoProduto.precoVenda <= 0) {
      mostrarFeedback('erro', 'Valores inválidos', 'Preços devem ser maiores que zero');
      return;
    }

    if (novoProduto.precoVenda <= novoProduto.precoCompra) {
      mostrarFeedback('erro', 'Margem inválida', 'Preço de venda deve ser maior que o preço de compra');
      return;
    }

    setSalvando(true);
    try {
      const { data, error } = await supabase
        .from("produtos")
        .insert([{
          nome: novoProduto.nome.trim(),
          descricao: novoProduto.descricao.trim() || null,
          categoria: novoProduto.categoria,
          quantidade_estoque: novoProduto.quantidadeEstoque,
          quantidade_minima: novoProduto.quantidadeMinima,
          preco_compra: novoProduto.precoCompra,
          preco_venda: novoProduto.precoVenda,
          fornecedor: novoProduto.fornecedor.trim() || null,
          ativo: true,
        }])
        .select()
        .single();

      if (error) throw error;

      await buscarProdutos();
      
      setNovoProduto({
        nome: "",
        descricao: "",
        categoria: "pomada",
        quantidadeEstoque: 0,
        quantidadeMinima: 5,
        precoCompra: 0,
        precoVenda: 0,
        fornecedor: "",
      });
      
      setModalAberto(false);
      mostrarFeedback('sucesso', 'Produto cadastrado', 'Produto criado com sucesso!');
    } catch (error: any) {
      console.error("Erro ao criar produto:", error);
      mostrarFeedback('erro', 'Erro ao criar produto', error.message || 'Erro desconhecido');
    } finally {
      setSalvando(false);
    }
  };

  const confirmarDelecao = (produtoId: string, produtoNome: string) => {
    setModalFeedback({
      aberto: true,
      tipo: 'confirmacao',
      titulo: 'Confirmar exclusão',
      mensagem: `Tem certeza que deseja excluir o produto "${produtoNome}"?`,
      onConfirmar: () => deletarProduto(produtoId),
    });
  };

  const deletarProduto = async (produtoId: string) => {
    setSalvando(true);
    try {
      const { error } = await supabase
        .from("produtos")
        .update({ ativo: false })
        .eq("id", produtoId);

      if (error) throw error;

      await buscarProdutos();
      setModalFeedback({ aberto: false, tipo: 'sucesso', titulo: '', mensagem: '' });
      mostrarFeedback('sucesso', 'Produto removido', 'Produto excluído com sucesso!');
    } catch (error: any) {
      console.error("Erro ao deletar produto:", error);
      mostrarFeedback('erro', 'Erro ao excluir', error.message || 'Erro desconhecido');
    } finally {
      setSalvando(false);
    }
  };

  const produtosEstoqueBaixo = produtos.filter(
    p => (p.quantidadeEstoque || 0) <= (p.quantidadeMinima || 0)
  );

  const valorTotalEstoque = produtos.reduce(
    (total, p) => total + ((p.precoVenda || 0) * (p.quantidadeEstoque || 0)), 
    0
  );

  if (carregando) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 dark:border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Gestão de Estoque
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            Controle de produtos e movimentações
          </p>
        </div>
        <Button
          onClick={() => setModalAberto(true)}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      {/* Modal de Novo Produto */}
      <Dialog.Root open={modalAberto} onOpenChange={setModalAberto}>
        <Dialog.Content style={{ maxWidth: 600 }}>
          <Dialog.Title>Cadastrar Novo Produto</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            Preencha as informações do produto para estoque
          </Dialog.Description>

          <div className="space-y-4">
            {/* Nome e Categoria */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Nome do Produto <span className="text-red-500">*</span>
                </label>
                <TextField.Root
                  value={novoProduto.nome}
                  onChange={(e) => setNovoProduto({ ...novoProduto, nome: e.target.value })}
                  placeholder="Ex: Pomada Modeladora"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Categoria <span className="text-red-500">*</span>
                </label>
                <select
                  value={novoProduto.categoria}
                  onChange={(e) => setNovoProduto({ ...novoProduto, categoria: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                >
                  <option value="pomada">Pomada</option>
                  <option value="shampoo">Shampoo</option>
                  <option value="condicionador">Condicionador</option>
                  <option value="cera">Cera</option>
                  <option value="gel">Gel</option>
                  <option value="oleo">Óleo</option>
                  <option value="navalhete">Navalhete</option>
                  <option value="tesoura">Tesoura</option>
                  <option value="maquina">Máquina</option>
                  <option value="outros">Outros</option>
                </select>
              </div>
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Descrição
              </label>
              <TextArea
                value={novoProduto.descricao}
                onChange={(e) => setNovoProduto({ ...novoProduto, descricao: e.target.value })}
                placeholder="Descreva o produto..."
                rows={2}
              />
            </div>

            {/* Fornecedor */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Fornecedor
              </label>
              <TextField.Root
                value={novoProduto.fornecedor}
                onChange={(e) => setNovoProduto({ ...novoProduto, fornecedor: e.target.value })}
                placeholder="Nome do fornecedor"
              />
            </div>

            {/* Preços */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Preço de Compra (R$) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={novoProduto.precoCompra || ''}
                  onChange={(e) => setNovoProduto({ ...novoProduto, precoCompra: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Preço de Venda (R$) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={novoProduto.precoVenda || ''}
                  onChange={(e) => setNovoProduto({ ...novoProduto, precoVenda: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                />
              </div>
            </div>

            {/* Quantidades */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Quantidade Inicial
                </label>
                <input
                  type="number"
                  min="0"
                  value={novoProduto.quantidadeEstoque || ''}
                  onChange={(e) => setNovoProduto({ ...novoProduto, quantidadeEstoque: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Quantidade Mínima
                </label>
                <input
                  type="number"
                  min="1"
                  value={novoProduto.quantidadeMinima || ''}
                  onChange={(e) => setNovoProduto({ ...novoProduto, quantidadeMinima: parseInt(e.target.value) || 5 })}
                  placeholder="5"
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                />
              </div>
            </div>

            {/* Margem de Lucro */}
            {novoProduto.precoCompra > 0 && novoProduto.precoVenda > 0 && (
              <div className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-lg">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Margem de Lucro: {' '}
                  <span className={`font-semibold ${
                    novoProduto.precoVenda > novoProduto.precoCompra 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {(((novoProduto.precoVenda - novoProduto.precoCompra) / novoProduto.precoCompra) * 100).toFixed(1)}%
                  </span>
                  {' '}(R$ {(novoProduto.precoVenda - novoProduto.precoCompra).toFixed(2)})
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6 justify-end">
            <Dialog.Close>
              <Button variant="soft" className="cursor-pointer">
                Cancelar
              </Button>
            </Dialog.Close>
            <Button
              onClick={criarProduto}
              disabled={salvando}
              className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 cursor-pointer"
            >
              {salvando ? "Cadastrando..." : "Cadastrar Produto"}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Root>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Total de Produtos</span>
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white">
            {produtos.length}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Estoque Baixo</span>
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white">
            {produtosEstoqueBaixo.length}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Valor em Estoque</span>
            <Package className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white">
            R$ {valorTotalEstoque.toFixed(2)}
          </p>
        </motion.div>
      </div>

      {/* Lista de Produtos */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50 dark:bg-zinc-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">
                  Produto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">
                  Estoque
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">
                  Preço Compra
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">
                  Preço Venda
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {produtos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-zinc-500 dark:text-zinc-400">
                    Nenhum produto cadastrado
                  </td>
                </tr>
              ) : (
                produtos.map((produto) => (
                  <tr key={produto.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800">
                    <td className="px-6 py-4 text-sm text-zinc-900 dark:text-zinc-100">
                      <div>
                        <div className="font-medium">{produto.nome}</div>
                        {produto.descricao && (
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">
                            {produto.descricao}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900 dark:text-zinc-100">
                      {produto.categoria}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${
                          (produto.quantidadeEstoque || 0) <= (produto.quantidadeMinima || 0)
                            ? 'text-red-600'
                            : 'text-zinc-900 dark:text-zinc-100'
                        }`}>
                          {produto.quantidadeEstoque || 0}
                        </span>
                        {(produto.quantidadeEstoque || 0) <= (produto.quantidadeMinima || 0) && (
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900 dark:text-zinc-100">
                      R$ {(produto.precoCompra || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      R$ {(produto.precoVenda || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <Button 
                          size="1" 
                          variant="soft" 
                          className="cursor-pointer"
                          title="Entrada de estoque"
                        >
                          <TrendingUp className="w-3 h-3" />
                        </Button>
                        <Button 
                          size="1" 
                          variant="soft" 
                          color="orange" 
                          className="cursor-pointer"
                          title="Saída de estoque"
                        >
                          <TrendingDown className="w-3 h-3" />
                        </Button>
                        <Button 
                          size="1" 
                          variant="soft" 
                          color="red" 
                          className="cursor-pointer"
                          onClick={() => confirmarDelecao(produto.id, produto.nome)}
                          title="Excluir produto"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
