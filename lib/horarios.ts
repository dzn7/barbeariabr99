/**
 * Utilitários para cálculo de horários dinâmicos
 * Gera horários disponíveis baseados na duração dos serviços
 */

import { addMinutes, format, parse, isAfter, isBefore, isEqual } from 'date-fns';

/**
 * Configuração de horário de funcionamento
 */
export const HORARIO_FUNCIONAMENTO = {
  inicio: '09:00',
  fim: '18:00',
  intervaloMinimo: 5, // Intervalo mínimo entre agendamentos em minutos
};

/**
 * Gera todos os horários possíveis em intervalos fixos de 30 minutos
 * Bloqueia horários que conflitam com agendamentos existentes
 * 
 * @param duracaoServico - Duração do serviço em minutos (usado para calcular conflitos)
 * @param agendamentosOcupados - Array de objetos com horário e duração dos agendamentos
 * @returns Array de horários disponíveis
 * 
 * @example
 * // Alguém marcou às 09:00 um serviço de 40 minutos
 * gerarHorariosDisponiveis(30, [{horario: '09:00', duracao: 40}])
 * // Retorna: ['09:40', '10:00', '10:30', ...] (09:00 e 09:30 bloqueados)
 */
export function gerarHorariosDisponiveis(
  duracaoServico: number,
  agendamentosOcupados: Array<{horario: string, duracao: number}> = []
): string[] {
  const horarios: string[] = [];
  const dataBase = new Date(2000, 0, 1);
  
  const horaInicio = parse(HORARIO_FUNCIONAMENTO.inicio, 'HH:mm', dataBase);
  const horaFim = parse(HORARIO_FUNCIONAMENTO.fim, 'HH:mm', dataBase);
  
  let horarioAtual = horaInicio;
  
  // Gerar todos os horários em intervalos de 30 minutos
  while (isBefore(horarioAtual, horaFim)) {
    const horarioFormatado = format(horarioAtual, 'HH:mm');
    const horarioTermino = addMinutes(horarioAtual, duracaoServico);
    
    // Verificar se o término não ultrapassa o horário de fechamento
    if (isBefore(horarioTermino, horaFim) || isEqual(horarioTermino, horaFim)) {
      // Verificar se não conflita com agendamentos ocupados
      const temConflito = agendamentosOcupados.some(agendamento => {
        const inicioOcupado = parse(agendamento.horario, 'HH:mm', dataBase);
        const fimOcupado = addMinutes(inicioOcupado, agendamento.duracao);
        
        // Conflito se:
        // 1. Novo agendamento começa durante um ocupado
        // 2. Novo agendamento termina durante um ocupado  
        // 3. Novo agendamento engloba um ocupado
        return (
          // Início do novo está dentro do ocupado
          (isAfter(horarioAtual, inicioOcupado) || isEqual(horarioAtual, inicioOcupado)) && isBefore(horarioAtual, fimOcupado) ||
          // Fim do novo está dentro do ocupado
          isAfter(horarioTermino, inicioOcupado) && (isBefore(horarioTermino, fimOcupado) || isEqual(horarioTermino, fimOcupado)) ||
          // Novo engloba o ocupado
          isBefore(horarioAtual, inicioOcupado) && isAfter(horarioTermino, fimOcupado)
        );
      });
      
      if (!temConflito) {
        horarios.push(horarioFormatado);
      }
    }
    
    // Avançar 30 minutos (intervalo fixo)
    horarioAtual = addMinutes(horarioAtual, 30);
  }
  
  return horarios;
}

/**
 * Valida se uma data está dentro do período permitido
 * (hoje até 15 dias no futuro)
 * 
 * @param data - Data a ser validada no formato 'yyyy-MM-dd'
 * @returns true se a data é válida, false caso contrário
 */
export function validarDataPermitida(data: string): boolean {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  const dataLimite = new Date(hoje);
  dataLimite.setDate(dataLimite.getDate() + 15);
  
  const dataSelecionada = parse(data, 'yyyy-MM-dd', new Date());
  dataSelecionada.setHours(0, 0, 0, 0);
  
  return (
    (isAfter(dataSelecionada, hoje) || isEqual(dataSelecionada, hoje)) &&
    (isBefore(dataSelecionada, dataLimite) || isEqual(dataSelecionada, dataLimite))
  );
}

/**
 * Gera array de datas disponíveis (hoje + 15 dias)
 * 
 * @returns Array de objetos com valor e label das datas
 */
export function gerarDatasDisponiveis(): Array<{ valor: string; label: string }> {
  const datas: Array<{ valor: string; label: string }> = [];
  const hoje = new Date();
  
  for (let i = 0; i <= 15; i++) {
    const data = new Date(hoje);
    data.setDate(data.getDate() + i);
    
    datas.push({
      valor: format(data, 'yyyy-MM-dd'),
      label: format(data, "EEEE, dd 'de' MMMM", { locale: require('date-fns/locale/pt-BR').ptBR }),
    });
  }
  
  return datas;
}

/**
 * Calcula o horário de término de um agendamento
 * 
 * @param horarioInicio - Horário de início no formato 'HH:mm'
 * @param duracaoMinutos - Duração em minutos
 * @returns Horário de término no formato 'HH:mm'
 */
export function calcularHorarioTermino(horarioInicio: string, duracaoMinutos: number): string {
  const dataBase = new Date(2000, 0, 1);
  const inicio = parse(horarioInicio, 'HH:mm', dataBase);
  const termino = addMinutes(inicio, duracaoMinutos);
  return format(termino, 'HH:mm');
}
