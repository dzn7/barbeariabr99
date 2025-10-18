# Sistema de Horários Dinâmicos

## Visão Geral
Sistema que permite configurar os horários de funcionamento da barbearia através do dashboard, com atualização automática em todo o site.

## Estrutura

### 1. Banco de Dados
**Tabela:** `configuracoes`
- `id`: UUID (chave primária)
- `chave`: TEXT (único) - Identificador da configuração
- `valor`: JSONB - Dados da configuração
- `descricao`: TEXT - Descrição da configuração
- `criado_em`: TIMESTAMP
- `atualizado_em`: TIMESTAMP

**Configuração de Horário:**
```json
{
  "segunda": {"aberto": true, "inicio": "09:00", "fim": "18:00"},
  "terca": {"aberto": true, "inicio": "09:00", "fim": "18:00"},
  "quarta": {"aberto": true, "inicio": "09:00", "fim": "18:00"},
  "quinta": {"aberto": true, "inicio": "09:00", "fim": "18:00"},
  "sexta": {"aberto": true, "inicio": "09:00", "fim": "18:00"},
  "sabado": {"aberto": true, "inicio": "09:00", "fim": "18:00"},
  "domingo": {"aberto": false, "inicio": "09:00", "fim": "18:00"}
}
```

### 2. Componentes

#### GestaoHorarios (`/components/dashboard/GestaoHorarios.tsx`)
Componente de administração no dashboard que permite:
- Visualizar horários de todos os dias da semana
- Ativar/desativar dias (aberto/fechado)
- Definir horário de início e fim para cada dia
- Aplicar horário padrão para todos os dias úteis
- Salvar alterações no banco de dados
- Feedback visual com modals responsivos

**Funcionalidades:**
- Switch para abrir/fechar cada dia
- Inputs de time para horário de início e fim
- Botão de ação rápida para aplicar horário padrão
- Modal de feedback (sucesso/erro)
- Loading states

#### useHorarioFuncionamento (`/hooks/useHorarioFuncionamento.ts`)
Hook customizado para buscar horários em qualquer parte do site.

**Retorna:**
- `horarios`: Objeto com horários da semana
- `carregando`: Estado de carregamento
- `formatarHorario(inicio, fim)`: Formata horário para exibição
- `getHorarioDia(dia)`: Retorna texto formatado do horário
- `estaAberto(dia)`: Verifica se está aberto no dia

**Exemplo de uso:**
```tsx
import { useHorarioFuncionamento } from '@/hooks/useHorarioFuncionamento';

function MeuComponente() {
  const { getHorarioDia, carregando } = useHorarioFuncionamento();
  
  return (
    <div>
      <p>Segunda: {getHorarioDia('segunda')}</p>
      <p>Domingo: {getHorarioDia('domingo')}</p>
    </div>
  );
}
```

### 3. Integração no Site

#### SecaoComoNosEncontrar
Atualizada para buscar horários dinamicamente do banco de dados.

**Antes:**
```tsx
<span>9h às 18h</span> // Hardcoded
```

**Depois:**
```tsx
<span>{getHorarioDia('segunda')}</span> // Dinâmico
```

## Como Usar

### 1. Executar Migração
Execute o script SQL no Supabase:
```bash
supabase-migration-configuracoes.sql
```

### 2. Acessar Dashboard
1. Faça login no dashboard
2. Navegue até a aba "Horários"
3. Configure os horários desejados
4. Clique em "Salvar Alterações"

### 3. Usar em Outros Componentes
Para exibir horários em qualquer componente:

```tsx
import { useHorarioFuncionamento } from '@/hooks/useHorarioFuncionamento';

export function MeuComponente() {
  const { getHorarioDia, horarios, estaAberto } = useHorarioFuncionamento();
  
  return (
    <div>
      {/* Exibir horário formatado */}
      <p>{getHorarioDia('segunda')}</p>
      
      {/* Verificar se está aberto */}
      {estaAberto('domingo') ? (
        <span>Aberto</span>
      ) : (
        <span>Fechado</span>
      )}
      
      {/* Acessar dados completos */}
      {horarios?.segunda.inicio} - {horarios?.segunda.fim}
    </div>
  );
}
```

## Segurança

### RLS (Row Level Security)
- **Leitura:** Pública (qualquer um pode ler)
- **Atualização:** Apenas usuários autenticados
- **Inserção/Exclusão:** Bloqueada (gerenciada por migração)

## Benefícios

1. **Centralizado:** Um único lugar para gerenciar horários
2. **Dinâmico:** Atualização em tempo real em todo o site
3. **Flexível:** Cada dia pode ter horário diferente
4. **Fácil de usar:** Interface intuitiva no dashboard
5. **Reutilizável:** Hook pode ser usado em qualquer componente
6. **Seguro:** Controle de acesso via RLS

## Locais que Usam Horários

Atualmente integrado em:
- ✅ Seção "Como nos Encontrar" (página inicial)
- 🔄 Pode ser adicionado em: Footer, Header, Página de Contato, etc.

## Próximas Melhorias

- [ ] Adicionar horários especiais (feriados)
- [ ] Histórico de alterações
- [ ] Notificação automática de mudanças
- [ ] Integração com sistema de agendamento
- [ ] Validação de horários (início < fim)
