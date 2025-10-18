/**
 * Tipos TypeScript para a aplicação
 * Define as interfaces e tipos usados em todo o projeto
 */

/**
 * Representa um barbeiro da barbearia
 */
export interface Barbeiro {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  especialidades: string[];
  fotoUrl: string | null;
  ativo: boolean;
  dataCadastro: Date;
  comissaoPercentual?: number;
  totalAtendimentos?: number;
  avaliacaoMedia?: number;
}

/**
 * Representa um serviço oferecido pela barbearia
 */
export interface Servico {
  id: string;
  nome: string;
  descricao: string;
  duracao: number; // em minutos
  preco: number;
  ativo: boolean;
  categoria?: string;
  ordemExibicao?: number;
}

/**
 * Status possíveis de um agendamento
 */
export type StatusAgendamento = 
  | "pendente" 
  | "confirmado" 
  | "concluido" 
  | "cancelado" 
  | "nao_compareceu";

/**
 * Representa um agendamento
 */
export interface Agendamento {
  id: string;
  clienteId: string;
  barbeiroId: string;
  servicoId: string;
  dataHora: Date;
  status: StatusAgendamento;
  observacoes?: string;
  valorPago?: number;
  formaPagamento?: string;
  avaliacao?: number;
  comentarioAvaliacao?: string;
  criadoEm: Date;
  atualizadoEm: Date;
}

/**
 * Representa um cliente
 */
export interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  dataCadastro: Date;
  ativo: boolean;
  observacoes?: string;
  totalAgendamentos?: number;
  ultimaVisita?: Date;
}

/**
 * Tipos de transação financeira
 */
export type TipoTransacao = "receita" | "despesa";

/**
 * Categorias de despesas
 */
export type CategoriaDespesa = 
  | "luz"
  | "agua"
  | "aluguel"
  | "internet"
  | "marketing"
  | "produtos"
  | "manutencao"
  | "salarios"
  | "impostos"
  | "outros";

/**
 * Formas de pagamento
 */
export type FormaPagamento = 
  | "dinheiro"
  | "pix"
  | "debito"
  | "credito"
  | "transferencia";

/**
 * Representa uma transação financeira
 */
export interface Transacao {
  id: string;
  tipo: TipoTransacao;
  categoria: CategoriaDespesa | "servico";
  descricao: string;
  valor: number;
  data: Date;
  formaPagamento?: FormaPagamento;
  agendamentoId?: string;
  barbeiroId?: string;
  observacoes?: string;
  criadoEm: Date;
  atualizadoEm: Date;
}

/**
 * Representa um atendimento presencial (walk-in)
 */
export interface AtendimentoPresencial {
  id: string;
  clienteNome: string;
  clienteTelefone?: string;
  clienteTelefone: string;
  barbeiroId: string;
  servicoId: string;
  dataHora: Date;
  observacoes?: string;
}

export interface ConfiguracaoTema {
  modo: "light" | "dark";
  corPrimaria: string;
  corSecundaria: string;
}
