import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * URL da API do Supabase
 * Deve ser configurada nas variáveis de ambiente
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

/**
 * Chave pública (anon key) do Supabase
 * Deve ser configurada nas variáveis de ambiente
 */
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

/**
 * Cliente do Supabase configurado com tipagem TypeScript
 * Utilizado para todas as operações de banco de dados
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/**
 * Verifica se o Supabase está configurado corretamente
 * 
 * @returns Boolean indicando se as variáveis de ambiente estão configuradas
 */
export function verificarConfiguracao(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}
