/**
 * Tipos do banco de dados Supabase
 * Este arquivo define a estrutura das tabelas do banco
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      agendamentos: {
        Row: {
          id: string
          cliente_id: string
          barbeiro_id: string
          servico_id: string
          data_hora: string
          status: string
          observacoes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          cliente_id: string
          barbeiro_id: string
          servico_id: string
          data_hora: string
          status?: string
          observacoes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          cliente_id?: string
          barbeiro_id?: string
          servico_id?: string
          data_hora?: string
          status?: string
          observacoes?: string | null
          created_at?: string
        }
      }
      barbeiros: {
        Row: {
          id: string
          nome: string
          email: string
          telefone: string
          especialidades: string[]
          foto_url: string | null
          ativo: boolean
          data_cadastro: string
        }
        Insert: {
          id?: string
          nome: string
          email: string
          telefone: string
          especialidades?: string[]
          foto_url?: string | null
          ativo?: boolean
          data_cadastro?: string
        }
        Update: {
          id?: string
          nome?: string
          email?: string
          telefone?: string
          especialidades?: string[]
          foto_url?: string | null
          ativo?: boolean
          data_cadastro?: string
        }
      }
      clientes: {
        Row: {
          id: string
          nome: string
          email: string | null
          telefone: string
          user_id: string | null
          data_cadastro: string
        }
        Insert: {
          id?: string
          nome: string
          email?: string | null
          telefone: string
          user_id?: string | null
          data_cadastro?: string
        }
        Update: {
          id?: string
          nome?: string
          email?: string | null
          telefone?: string
          user_id?: string | null
          data_cadastro?: string
        }
      }
      servicos: {
        Row: {
          id: string
          nome: string
          descricao: string | null
          duracao: number
          preco: number
          ativo: boolean
          ordem_exibicao: number
        }
        Insert: {
          id?: string
          nome: string
          descricao?: string | null
          duracao: number
          preco: number
          ativo?: boolean
          ordem_exibicao?: number
        }
        Update: {
          id?: string
          nome?: string
          descricao?: string | null
          duracao?: number
          preco?: number
          ativo?: boolean
          ordem_exibicao?: number
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
