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
 * Gera todos os horários possíveis baseado na duração do serviço
 * 
 * @param duracaoServico - Duração do serviço em minutos
 * @param horariosOcupados - Array de horários já ocupados no formato 'HH:mm'
 * @returns Array de horários disponíveis
 * 
 * @example
 * // Serviço de 25 minutos
 * gerarHorariosDisponiveis(25, ['09:00', '10:30'])
 * // Retorna: ['09:25', '09:50', '10:15', '10:55', ...]
 */
export function gerarHorariosDisponiveis(
  duracaoServico: number,
  horariosOcupados: string[] = []
): string[] {
  const horarios: string[] = [];
  const dataBase = new Date(2000, 0, 1); // Data fictícia para cálculos
  
  // Converter horários de início e fim para Date
  const horaInicio = parse(HORARIO_FUNCIONAMENTO.inicio, 'HH:mm', dataBase);
  const horaFim = parse(HORARIO_FUNCIONAMENTO.fim, 'HH:mm', dataBase);
  
  let horarioAtual = horaInicio;
  
  // Gerar horários de início possíveis
  while (isBefore(horarioAtual, horaFim)) {
    const horarioFormatado = format(horarioAtual, 'HH:mm');
    
    // Calcular horário de término deste agendamento
    const horarioTermino = addMinutes(horarioAtual, duracaoServico);
    
    // Verificar se o término não ultrapassa o horário de fechamento
    if (isBefore(horarioTermino, horaFim) || isEqual(horarioTermino, horaFim)) {
      // Verificar se não conflita com horários ocupados
      const temConflito = horariosOcupados.some(ocupado => {
        const horarioOcupadoDate = parse(ocupado, 'HH:mm', dataBase);
        const terminoOcupado = addMinutes(horarioOcupadoDate, duracaoServico);
        
        // Conflito se:
        // 1. Horário atual está dentro de um agendamento ocupado
        // 2. Horário de término está dentro de um agendamento ocupado
        // 3. Horário atual começa antes e termina depois de um ocupado
        return (
          (isAfter(horarioAtual, horarioOcupadoDate) && isBefore(horarioAtual, terminoOcupado)) ||
          (isAfter(horarioTermino, horarioOcupadoDate) && isBefore(horarioTermino, terminoOcupado)) ||
          (isBefore(horarioAtual, horarioOcupadoDate) && isAfter(horarioTermino, terminoOcupado)) ||
          isEqual(horarioAtual, horarioOcupadoDate)
        );
      });
      
      if (!temConflito) {
        horarios.push(horarioFormatado);
      }
    }
    
    // Avançar para o próximo horário possível
    // Usa a duração do serviço como intervalo
    horarioAtual = addMinutes(horarioAtual, duracaoServico);
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
