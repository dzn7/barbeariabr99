# Sistema de Comissões - Barbearia BR99

## Visão Geral

O sistema de comissões da Barbearia BR99 foi desenvolvido para automatizar o cálculo e controle dos pagamentos aos barbeiros. O sistema registra automaticamente as comissões de cada atendimento realizado, seja por agendamento online ou atendimento presencial (walk-in).

## Estrutura do Sistema

### Tabela de Comissões

A tabela `comissoes` armazena todos os registros de comissões geradas no sistema:

```sql
CREATE TABLE comissoes (
  id UUID PRIMARY KEY,
  barbeiro_id UUID NOT NULL,
  agendamento_id UUID,
  atendimento_presencial_id UUID,
  valor_servico DECIMAL(10, 2) NOT NULL,
  percentual_comissao DECIMAL(5, 2) NOT NULL,
  valor_comissao DECIMAL(10, 2) NOT NULL,
  data_pagamento DATE,
  pago BOOLEAN DEFAULT FALSE,
  mes INTEGER NOT NULL,
  ano INTEGER NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Campos Principais

- **barbeiro_id**: Referência ao barbeiro que realizou o atendimento
- **agendamento_id**: ID do agendamento (se aplicável)
- **atendimento_presencial_id**: ID do atendimento presencial (se aplicável)
- **valor_servico**: Valor total do serviço prestado
- **percentual_comissao**: Percentual aplicado (configurado por barbeiro)
- **valor_comissao**: Valor calculado da comissão
- **pago**: Status do pagamento (false = pendente, true = pago)
- **mes/ano**: Período de referência para relatórios

## Funcionamento Automático

### 1. Geração Automática de Comissões

O sistema utiliza triggers do PostgreSQL para criar comissões automaticamente:

#### Para Agendamentos

Quando um agendamento é marcado como "concluído" e possui valor pago:

```sql
CREATE TRIGGER trigger_comissao_agendamento
AFTER UPDATE ON agendamentos
FOR EACH ROW
EXECUTE FUNCTION criar_comissao_automatica();
```

A função `criar_comissao_automatica()`:
1. Verifica se o status mudou para "concluído"
2. Busca o percentual de comissão do barbeiro
3. Calcula o valor da comissão
4. Insere registro na tabela comissoes
5. Marca como não pago por padrão

#### Para Atendimentos Presenciais

Quando um atendimento presencial é registrado:

```sql
CREATE TRIGGER trigger_processar_atendimento_presencial
AFTER INSERT ON atendimentos_presenciais
FOR EACH ROW
EXECUTE FUNCTION processar_atendimento_presencial();
```

A função cria automaticamente:
- Transação financeira (receita)
- Registro de comissão

### 2. Cálculo de Comissões

O cálculo é realizado pela fórmula:

```
valor_comissao = valor_servico × (percentual_comissao / 100)
```

Exemplo:
- Serviço: R$ 40,00
- Percentual: 40%
- Comissão: R$ 40,00 × 0,40 = R$ 16,00

### 3. Configuração de Percentuais

Cada barbeiro possui um percentual de comissão configurável na tabela `barbeiros`:

```sql
ALTER TABLE barbeiros 
ADD COLUMN comissao_percentual DECIMAL(5, 2) DEFAULT 40.00;
```

O percentual padrão é 40%, mas pode ser ajustado individualmente.

## Interface de Gestão

### Componente GestaoComissoes

O componente `GestaoComissoes.tsx` fornece interface completa para:

#### Visualização

- Lista de comissões por período
- Filtros por barbeiro, mês e ano
- Status de pagamento (pago/pendente)
- Totalizadores por barbeiro

#### Funcionalidades

1. **Filtrar Comissões**
   - Por barbeiro
   - Por período (mês/ano)
   - Por status de pagamento

2. **Marcar como Pago**
   - Registra data de pagamento
   - Atualiza status para pago
   - Gera histórico de pagamentos

3. **Relatórios**
   - Total de comissões no período
   - Comissões pendentes
   - Comissões pagas
   - Detalhamento por barbeiro

### Exemplo de Uso

```typescript
// Buscar comissões pendentes de um barbeiro
const { data: comissoesPendentes } = await supabase
  .from('comissoes')
  .select(`
    *,
    barbeiros (nome),
    agendamentos (data_hora),
    atendimentos_presenciais (data)
  `)
  .eq('barbeiro_id', barbeiroId)
  .eq('pago', false)
  .order('criado_em', { ascending: false });

// Marcar comissão como paga
const { error } = await supabase
  .from('comissoes')
  .update({
    pago: true,
    data_pagamento: new Date().toISOString()
  })
  .eq('id', comissaoId);
```

## Integração com Outros Módulos

### 1. Agendamentos

Quando um agendamento é concluído:
1. Sistema verifica se há valor pago
2. Cria transação financeira (receita)
3. Gera comissão automaticamente
4. Atualiza totalizadores do barbeiro

### 2. Atendimentos Presenciais

Ao registrar atendimento presencial:
1. Cria registro de atendimento
2. Gera transação financeira
3. Calcula e registra comissão
4. Tudo em uma única operação

### 3. Dashboard Financeiro

O dashboard exibe:
- Total de comissões pendentes
- Comissões pagas no período
- Gráficos de comissões por barbeiro
- Projeções de pagamento

## Consultas Úteis

### Total de Comissões Pendentes

```sql
SELECT 
  b.nome,
  COUNT(*) as total_pendentes,
  SUM(c.valor_comissao) as valor_total
FROM comissoes c
JOIN barbeiros b ON b.id = c.barbeiro_id
WHERE c.pago = FALSE
GROUP BY b.id, b.nome
ORDER BY valor_total DESC;
```

### Comissões por Período

```sql
SELECT 
  b.nome,
  c.mes,
  c.ano,
  COUNT(*) as quantidade,
  SUM(c.valor_comissao) as total
FROM comissoes c
JOIN barbeiros b ON b.id = c.barbeiro_id
WHERE c.ano = 2025 AND c.mes = 10
GROUP BY b.id, b.nome, c.mes, c.ano;
```

### Histórico de Pagamentos

```sql
SELECT 
  b.nome,
  c.data_pagamento,
  SUM(c.valor_comissao) as valor_pago
FROM comissoes c
JOIN barbeiros b ON b.id = c.barbeiro_id
WHERE c.pago = TRUE
GROUP BY b.id, b.nome, c.data_pagamento
ORDER BY c.data_pagamento DESC;
```

## Fluxo de Trabalho Recomendado

### Processo Mensal

1. **Início do Mês**
   - Revisar comissões do mês anterior
   - Gerar relatório consolidado
   - Validar valores com registros

2. **Durante o Mês**
   - Monitorar comissões geradas automaticamente
   - Verificar inconsistências
   - Ajustar percentuais se necessário

3. **Fim do Mês**
   - Gerar relatório final
   - Processar pagamentos
   - Marcar comissões como pagas
   - Arquivar documentação

### Processo de Pagamento

1. Acessar Dashboard > Comissões
2. Filtrar por barbeiro e período
3. Revisar lista de comissões pendentes
4. Confirmar valores com barbeiro
5. Realizar pagamento
6. Marcar comissões como pagas no sistema
7. Registrar data de pagamento

## Segurança e Auditoria

### Logs Automáticos

Todas as operações são registradas com:
- Timestamp de criação
- Valores originais
- Alterações realizadas

### Integridade de Dados

- Comissões não podem ser deletadas
- Apenas status de pagamento pode ser alterado
- Valores são calculados automaticamente
- Referências mantêm integridade relacional

### Permissões

- Apenas administradores podem marcar como pago
- Barbeiros podem visualizar suas próprias comissões
- Histórico completo mantido no banco

## Troubleshooting

### Comissão não foi gerada

Verificar:
1. Agendamento está marcado como "concluído"
2. Campo valor_pago está preenchido
3. Barbeiro possui percentual configurado
4. Triggers estão ativos no banco

### Valor incorreto

Verificar:
1. Percentual do barbeiro
2. Valor do serviço registrado
3. Cálculo: valor_servico × (percentual / 100)

### Não consegue marcar como pago

Verificar:
1. Permissões de usuário
2. Comissão existe e está pendente
3. Conexão com banco de dados

## Manutenção

### Backup Regular

Recomenda-se backup diário da tabela comissoes:

```sql
-- Exportar comissões do mês
COPY (
  SELECT * FROM comissoes 
  WHERE mes = 10 AND ano = 2025
) TO '/backup/comissoes_2025_10.csv' CSV HEADER;
```

### Limpeza de Dados

Não é recomendado deletar registros de comissões. Para arquivamento:

```sql
-- Criar tabela de arquivo
CREATE TABLE comissoes_arquivo (LIKE comissoes INCLUDING ALL);

-- Mover comissões antigas (opcional, após 2 anos)
INSERT INTO comissoes_arquivo 
SELECT * FROM comissoes 
WHERE ano < 2023;
```

## Suporte e Documentação Adicional

Para dúvidas ou problemas:
1. Consulte os logs do sistema
2. Verifique a documentação do Supabase
3. Revise os triggers no banco de dados
4. Entre em contato com o suporte técnico

## Atualizações Futuras

Melhorias planejadas:
- Exportação de relatórios em PDF
- Notificações automáticas de pagamento
- Integração com sistemas de pagamento
- Dashboard personalizado por barbeiro
- Histórico detalhado de alterações
