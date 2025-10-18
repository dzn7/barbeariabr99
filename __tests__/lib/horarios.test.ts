/**
 * Testes para utilitários de horários
 * Valida cálculo dinâmico de horários e validação de datas
 */

import {
  gerarHorariosDisponiveis,
  validarDataPermitida,
  gerarDatasDisponiveis,
  calcularHorarioTermino,
  HORARIO_FUNCIONAMENTO,
} from '@/lib/horarios';
import { format, addDays } from 'date-fns';

describe('Utilitários de Horários', () => {
  describe('gerarHorariosDisponiveis', () => {
    it('deve gerar horários corretos para serviço de 25 minutos', () => {
      const horarios = gerarHorariosDisponiveis(25, []);
      
      // Deve começar às 09:00
      expect(horarios[0]).toBe('09:00');
      
      // Próximo horário deve ser 09:25 (não 09:30)
      expect(horarios[1]).toBe('09:25');
      
      // Terceiro horário deve ser 09:50
      expect(horarios[2]).toBe('09:50');
      
      // Deve ter múltiplos horários
      expect(horarios.length).toBeGreaterThan(10);
    });

    it('deve gerar horários corretos para serviço de 30 minutos', () => {
      const horarios = gerarHorariosDisponiveis(30, []);
      
      expect(horarios[0]).toBe('09:00');
      expect(horarios[1]).toBe('09:30');
      expect(horarios[2]).toBe('10:00');
    });

    it('deve gerar horários corretos para serviço de 40 minutos', () => {
      const horarios = gerarHorariosDisponiveis(40, []);
      
      expect(horarios[0]).toBe('09:00');
      expect(horarios[1]).toBe('09:40');
      expect(horarios[2]).toBe('10:20');
    });

    it('deve gerar horários corretos para serviço de 60 minutos', () => {
      const horarios = gerarHorariosDisponiveis(60, []);
      
      expect(horarios[0]).toBe('09:00');
      expect(horarios[1]).toBe('10:00');
      expect(horarios[2]).toBe('11:00');
    });

    it('deve excluir horários ocupados', () => {
      const horariosOcupados = ['09:00', '10:30'];
      const horarios = gerarHorariosDisponiveis(30, horariosOcupados);
      
      // Não deve incluir horários ocupados
      expect(horarios).not.toContain('09:00');
      expect(horarios).not.toContain('10:30');
      
      // Deve incluir outros horários
      expect(horarios).toContain('09:30');
      expect(horarios).toContain('10:00');
    });

    it('deve evitar conflitos com horários ocupados', () => {
      // Se 09:00 está ocupado com serviço de 40 min, 09:20 não deve estar disponível
      const horariosOcupados = ['09:00'];
      const horarios = gerarHorariosDisponiveis(40, horariosOcupados);
      
      // 09:00 está ocupado até 09:40, então próximo disponível é 09:40
      expect(horarios[0]).toBe('09:40');
    });

    it('não deve ultrapassar horário de fechamento', () => {
      const horarios = gerarHorariosDisponiveis(60, []);
      
      // Último horário deve permitir término até 18:00
      const ultimoHorario = horarios[horarios.length - 1];
      expect(ultimoHorario).toBe('17:00'); // 17:00 + 60min = 18:00
    });

    it('deve retornar array vazio se não houver horários disponíveis', () => {
      // Ocupar todos os horários
      const horariosOcupados = [
        '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
        '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
      ];
      const horarios = gerarHorariosDisponiveis(30, horariosOcupados);
      
      expect(horarios.length).toBe(0);
    });
  });

  describe('validarDataPermitida', () => {
    it('deve aceitar data de hoje', () => {
      const hoje = format(new Date(), 'yyyy-MM-dd');
      expect(validarDataPermitida(hoje)).toBe(true);
    });

    it('deve aceitar data dentro de 15 dias', () => {
      const dataFutura = format(addDays(new Date(), 10), 'yyyy-MM-dd');
      expect(validarDataPermitida(dataFutura)).toBe(true);
    });

    it('deve aceitar exatamente 15 dias no futuro', () => {
      const dataLimite = format(addDays(new Date(), 15), 'yyyy-MM-dd');
      expect(validarDataPermitida(dataLimite)).toBe(true);
    });

    it('deve rejeitar data no passado', () => {
      const dataPassada = format(addDays(new Date(), -1), 'yyyy-MM-dd');
      expect(validarDataPermitida(dataPassada)).toBe(false);
    });

    it('deve rejeitar data além de 15 dias', () => {
      const dataAlemLimite = format(addDays(new Date(), 16), 'yyyy-MM-dd');
      expect(validarDataPermitida(dataAlemLimite)).toBe(false);
    });

    it('deve rejeitar data muito no futuro', () => {
      const dataDistante = format(addDays(new Date(), 30), 'yyyy-MM-dd');
      expect(validarDataPermitida(dataDistante)).toBe(false);
    });
  });

  describe('gerarDatasDisponiveis', () => {
    it('deve gerar 16 datas (hoje + 15 dias)', () => {
      const datas = gerarDatasDisponiveis();
      expect(datas.length).toBe(16);
    });

    it('primeira data deve ser hoje', () => {
      const datas = gerarDatasDisponiveis();
      const hoje = format(new Date(), 'yyyy-MM-dd');
      expect(datas[0].valor).toBe(hoje);
    });

    it('última data deve ser 15 dias no futuro', () => {
      const datas = gerarDatasDisponiveis();
      const dataLimite = format(addDays(new Date(), 15), 'yyyy-MM-dd');
      expect(datas[15].valor).toBe(dataLimite);
    });

    it('cada data deve ter valor e label', () => {
      const datas = gerarDatasDisponiveis();
      
      datas.forEach(data => {
        expect(data).toHaveProperty('valor');
        expect(data).toHaveProperty('label');
        expect(typeof data.valor).toBe('string');
        expect(typeof data.label).toBe('string');
      });
    });
  });

  describe('calcularHorarioTermino', () => {
    it('deve calcular término correto para 25 minutos', () => {
      expect(calcularHorarioTermino('09:00', 25)).toBe('09:25');
      expect(calcularHorarioTermino('10:30', 25)).toBe('10:55');
    });

    it('deve calcular término correto para 30 minutos', () => {
      expect(calcularHorarioTermino('09:00', 30)).toBe('09:30');
      expect(calcularHorarioTermino('14:30', 30)).toBe('15:00');
    });

    it('deve calcular término correto para 40 minutos', () => {
      expect(calcularHorarioTermino('09:00', 40)).toBe('09:40');
      expect(calcularHorarioTermino('11:20', 40)).toBe('12:00');
    });

    it('deve calcular término correto para 60 minutos', () => {
      expect(calcularHorarioTermino('09:00', 60)).toBe('10:00');
      expect(calcularHorarioTermino('16:00', 60)).toBe('17:00');
    });

    it('deve lidar com mudança de hora', () => {
      expect(calcularHorarioTermino('09:45', 30)).toBe('10:15');
      expect(calcularHorarioTermino('11:50', 25)).toBe('12:15');
    });
  });

  describe('HORARIO_FUNCIONAMENTO', () => {
    it('deve ter configuração correta', () => {
      expect(HORARIO_FUNCIONAMENTO.inicio).toBe('09:00');
      expect(HORARIO_FUNCIONAMENTO.fim).toBe('18:00');
      expect(HORARIO_FUNCIONAMENTO.intervaloMinimo).toBe(5);
    });
  });

  describe('Cenários Reais de Uso', () => {
    it('cenário: corte degradê (40min) com horários parcialmente ocupados', () => {
      const horariosOcupados = ['09:00', '11:20', '15:00'];
      const horarios = gerarHorariosDisponiveis(40, horariosOcupados);
      
      // Deve pular 09:00 (ocupado)
      expect(horarios[0]).toBe('09:40');
      
      // Deve pular 11:20 (ocupado)
      expect(horarios).not.toContain('11:20');
      
      // Deve pular 15:00 (ocupado)
      expect(horarios).not.toContain('15:00');
      
      // Deve ter horários disponíveis
      expect(horarios.length).toBeGreaterThan(5);
    });

    it('cenário: barba (20min) - muitos horários disponíveis', () => {
      const horarios = gerarHorariosDisponiveis(20, []);
      
      // Serviço curto deve gerar muitos horários
      expect(horarios.length).toBeGreaterThan(20);
      
      // Intervalos de 20 minutos
      expect(horarios[0]).toBe('09:00');
      expect(horarios[1]).toBe('09:20');
      expect(horarios[2]).toBe('09:40');
    });

    it('cenário: pacote completo (60min) - menos horários', () => {
      const horarios = gerarHorariosDisponiveis(60, []);
      
      // Serviço longo gera menos horários
      expect(horarios.length).toBeLessThan(15);
      
      // Intervalos de 60 minutos
      expect(horarios[0]).toBe('09:00');
      expect(horarios[1]).toBe('10:00');
      expect(horarios[2]).toBe('11:00');
    });
  });
});
