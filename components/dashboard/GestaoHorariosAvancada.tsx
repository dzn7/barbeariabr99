"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Clock, Calendar, Lock, Unlock, AlertCircle, 
  Plus, Trash2, Save, X, History, Settings 
} from "lucide-react";
import { Button, TextField, Select, Switch, Badge, Dialog, TextArea } from "@radix-ui/themes";
import { format, parse, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/lib/supabase";
import { Modal } from "@/components/Modal";

interface ConfiguracaoBarbearia {
  id: string;
  aberta: boolean;
  mensagem_fechamento: string | null;
  horario_abertura: string;
  horario_fechamento: string;
  dias_funcionamento: string[];
  intervalo_almoco_inicio: string | null;
  intervalo_almoco_fim: string | null;
}

interface HorarioBloqueado {
  id: string;
  barbeiro_id: string | null;
  data: string;
  horario_inicio: string;
  horario_fim: string;
  motivo: string | null;
  tipo: string;
  barbeiros?: { nome: string };
}

export function GestaoHorariosAvancada() {
  const [config, setConfig] = useState<ConfiguracaoBarbearia | null>(null);
  const [bloqueios, setBloqueios] = useState<HorarioBloqueado[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  
  // Modal de novo bloqueio
  const [modalBloqueio, setModalBloqueio] = useState(false);
  const [novoBloqueio, setNovoBloqueio] = useState({
    barbeiro_id: "",
    data: format(new Date(), "yyyy-MM-dd"),
    horario_inicio: "09:00",
    horario_fim: "18:00",
    motivo: "",
    tipo: "bloqueio_manual"
  });
  
  const [barbeiros, setBarbeiros] = useState<any[]>([]);
  const [modalConfig, setModalConfig] = useState<any>(null);
  const [modalAberto, setModalAberto] = useState(false);

  useEffect(() => {
    carregarDados();
    carregarBarbeiros();
    
    // Realtime para configurações
    const channelConfig = supabase
      .channel('config-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'configuracoes_barbearia'
      }, () => {
        carregarDados();
      })
      .subscribe();

    // Realtime para bloqueios
    const channelBloqueios = supabase
      .channel('bloqueios-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'horarios_bloqueados'
      }, () => {
        carregarBloqueios();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channelConfig);
      supabase.removeChannel(channelBloqueios);
    };
  }, []);

  const carregarDados = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracoes_barbearia')
        .select('*')
        .single();

      if (error) throw error;
      setConfig(data);
      
      await carregarBloqueios();
    } catch (error) {
      console.error('Erro ao carregar:', error);
    } finally {
      setCarregando(false);
    }
  };

  const carregarBloqueios = async () => {
    try {
      const { data, error } = await supabase
        .from('horarios_bloqueados')
        .select(`
          *,
          barbeiros (nome)
        `)
        .gte('data', format(new Date(), 'yyyy-MM-dd'))
        .order('data', { ascending: true });

      if (error) throw error;
      setBloqueios(data || []);
    } catch (error) {
      console.error('Erro ao carregar bloqueios:', error);
    }
  };

  const carregarBarbeiros = async () => {
    try {
      const { data, error } = await supabase
        .from('barbeiros')
        .select('id, nome')
        .eq('ativo', true);

      if (error) throw error;
      setBarbeiros(data || []);
    } catch (error) {
      console.error('Erro ao carregar barbeiros:', error);
    }
  };

  const alternarStatus = async () => {
    if (!config) return;
    
    setSalvando(true);
    try {
      const novoStatus = !config.aberta;
      
      const { error } = await supabase
        .from('configuracoes_barbearia')
        .update({ 
          aberta: novoStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', config.id);

      if (error) throw error;

      setModalConfig({
        title: novoStatus ? "Barbearia Aberta" : "Barbearia Fechada",
        message: novoStatus 
          ? "A barbearia está aberta para agendamentos"
          : "A barbearia foi fechada. Clientes não poderão agendar.",
        type: "success"
      });
      setModalAberto(true);
      
      setConfig({ ...config, aberta: novoStatus });
    } catch (error: any) {
      setModalConfig({
        title: "Erro",
        message: `Erro ao alterar status: ${error.message}`,
        type: "error"
      });
      setModalAberto(true);
    } finally {
      setSalvando(false);
    }
  };

  const salvarConfiguracao = async () => {
    if (!config) return;
    
    setSalvando(true);
    try {
      const { error } = await supabase
        .from('configuracoes_barbearia')
        .update({
          horario_abertura: config.horario_abertura,
          horario_fechamento: config.horario_fechamento,
          dias_funcionamento: config.dias_funcionamento,
          intervalo_almoco_inicio: config.intervalo_almoco_inicio,
          intervalo_almoco_fim: config.intervalo_almoco_fim,
          mensagem_fechamento: config.mensagem_fechamento,
          updated_at: new Date().toISOString()
        })
        .eq('id', config.id);

      if (error) throw error;

      setModalConfig({
        title: "Sucesso",
        message: "Configurações salvas com sucesso!",
        type: "success"
      });
      setModalAberto(true);
    } catch (error: any) {
      setModalConfig({
        title: "Erro",
        message: `Erro ao salvar: ${error.message}`,
        type: "error"
      });
      setModalAberto(true);
    } finally {
      setSalvando(false);
    }
  };

  const criarBloqueio = async () => {
    setSalvando(true);
    try {
      const { error } = await supabase
        .from('horarios_bloqueados')
        .insert([{
          barbeiro_id: novoBloqueio.barbeiro_id || null,
          data: novoBloqueio.data,
          horario_inicio: novoBloqueio.horario_inicio,
          horario_fim: novoBloqueio.horario_fim,
          motivo: novoBloqueio.motivo,
          tipo: novoBloqueio.tipo
        }]);

      if (error) throw error;

      setModalBloqueio(false);
      setNovoBloqueio({
        barbeiro_id: "",
        data: format(new Date(), "yyyy-MM-dd"),
        horario_inicio: "09:00",
        horario_fim: "18:00",
        motivo: "",
        tipo: "bloqueio_manual"
      });

      setModalConfig({
        title: "Sucesso",
        message: "Horário bloqueado com sucesso!",
        type: "success"
      });
      setModalAberto(true);
    } catch (error: any) {
      setModalConfig({
        title: "Erro",
        message: `Erro ao criar bloqueio: ${error.message}`,
        type: "error"
      });
      setModalAberto(true);
    } finally {
      setSalvando(false);
    }
  };

  const removerBloqueio = async (id: string) => {
    if (!confirm("Deseja remover este bloqueio?")) return;

    try {
      const { error } = await supabase
        .from('horarios_bloqueados')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setModalConfig({
        title: "Sucesso",
        message: "Bloqueio removido com sucesso!",
        type: "success"
      });
      setModalAberto(true);
    } catch (error: any) {
      setModalConfig({
        title: "Erro",
        message: `Erro ao remover: ${error.message}`,
        type: "error"
      });
      setModalAberto(true);
    }
  };

  const diasSemana = [
    { valor: "seg", label: "Segunda" },
    { valor: "ter", label: "Terça" },
    { valor: "qua", label: "Quarta" },
    { valor: "qui", label: "Quinta" },
    { valor: "sex", label: "Sexta" },
    { valor: "sab", label: "Sábado" },
    { valor: "dom", label: "Domingo" }
  ];

  const toggleDia = (dia: string) => {
    if (!config) return;
    
    const dias = config.dias_funcionamento || [];
    const novos = dias.includes(dia)
      ? dias.filter(d => d !== dia)
      : [...dias, dia];
    
    setConfig({ ...config, dias_funcionamento: novos });
  };

  if (carregando) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 dark:border-zinc-100"></div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
        <p className="text-zinc-600 dark:text-zinc-400">
          Erro ao carregar configurações
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status da Barbearia */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {config.aberta ? (
              <Unlock className="w-6 h-6 text-green-500" />
            ) : (
              <Lock className="w-6 h-6 text-red-500" />
            )}
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Status da Barbearia
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {config.aberta ? "Aberta para agendamentos" : "Fechada"}
              </p>
            </div>
          </div>
          
          <Button
            onClick={alternarStatus}
            disabled={salvando}
            color={config.aberta ? "red" : "green"}
            size="3"
          >
            {config.aberta ? "Fechar" : "Abrir"} Barbearia
          </Button>
        </div>

        {!config.aberta && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Mensagem de Fechamento
            </label>
            <TextArea
              value={config.mensagem_fechamento || ""}
              onChange={(e: any) => setConfig({ ...config, mensagem_fechamento: e.target.value })}
              placeholder="Ex: Fechado para manutenção. Voltamos em breve!"
              rows={3}
            />
          </div>
        )}
      </motion.div>

      {/* Configurações de Horário */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800"
      >
        <div className="flex items-center gap-3 mb-6">
          <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Horários de Funcionamento
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Configure os horários de abertura, fechamento e intervalo de almoço
            </p>
          </div>
        </div>

        {/* Horário Principal */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl p-6 mb-6 border-2 border-blue-200 dark:border-blue-800">
          <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Horário de Expediente
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <label className="block text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Unlock className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                🕐 Horário de Abertura
              </label>
              <TextField.Root
                type="time"
                value={config.horario_abertura}
                onChange={(e: any) => setConfig({ ...config, horario_abertura: e.target.value })}
                size="3"
                className="text-lg font-semibold"
              />
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2">
                Quando a barbearia abre para atendimento
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <label className="block text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-red-600 dark:text-red-400" />
                </div>
                🕐 Horário de Fechamento
              </label>
              <TextField.Root
                type="time"
                value={config.horario_fechamento}
                onChange={(e: any) => setConfig({ ...config, horario_fechamento: e.target.value })}
                size="3"
                className="text-lg font-semibold"
              />
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2">
                Quando a barbearia fecha
              </p>
            </div>
          </div>
        </div>

        {/* Intervalo de Almoço */}
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 rounded-xl p-6 border-2 border-orange-200 dark:border-orange-800">
          <h4 className="text-lg font-semibold text-orange-900 dark:text-orange-100 mb-2 flex items-center gap-2">
            <span className="text-2xl">🍽️</span>
            Intervalo de Almoço (Opcional)
          </h4>
          <p className="text-sm text-orange-700 dark:text-orange-300 mb-4">
            Defina o horário em que não haverá atendimentos para o almoço
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
              <label className="block text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-3">
                ⏰ Início do Almoço
              </label>
              <TextField.Root
                type="time"
                value={config.intervalo_almoco_inicio || ""}
                onChange={(e: any) => setConfig({ ...config, intervalo_almoco_inicio: e.target.value || null })}
                placeholder="Ex: 12:00"
                size="3"
              />
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2">
                Deixe vazio se não houver intervalo
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
              <label className="block text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-3">
                ⏰ Fim do Almoço
              </label>
              <TextField.Root
                type="time"
                value={config.intervalo_almoco_fim || ""}
                onChange={(e: any) => setConfig({ ...config, intervalo_almoco_fim: e.target.value || null })}
                placeholder="Ex: 14:00"
                size="3"
              />
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2">
                Quando os atendimentos retornam
              </p>
            </div>
          </div>
        </div>

        {/* Dias de Funcionamento */}
        <div className="mt-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-xl p-6 border-2 border-purple-200 dark:border-purple-800">
          <h4 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-2 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Dias de Funcionamento
          </h4>
          <p className="text-sm text-purple-700 dark:text-purple-300 mb-4">
            Selecione os dias da semana em que a barbearia funciona
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {diasSemana.map(dia => (
              <Button
                key={dia.valor}
                onClick={() => toggleDia(dia.valor)}
                variant={config.dias_funcionamento?.includes(dia.valor) ? "solid" : "outline"}
                color={config.dias_funcionamento?.includes(dia.valor) ? "purple" : "gray"}
                size="3"
                className="h-16 flex flex-col items-center justify-center gap-1"
              >
                <span className="text-lg font-bold">{dia.label.substring(0, 3)}</span>
                <span className="text-xs opacity-75">{dia.label}</span>
              </Button>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-purple-700 dark:text-purple-300">
            <AlertCircle className="w-4 h-4" />
            <span>
              {config.dias_funcionamento?.length || 0} dia(s) selecionado(s)
            </span>
          </div>
        </div>

        {/* Botão de Salvar */}
        <div className="mt-6 flex justify-end gap-3">
          <Button
            onClick={() => carregarDados()}
            variant="soft"
            color="gray"
            size="3"
            disabled={salvando}
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button
            onClick={salvarConfiguracao}
            disabled={salvando}
            size="3"
            color="green"
            className="min-w-[200px]"
          >
            {salvando ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Configurações
              </>
            )}
          </Button>
        </div>
      </motion.div>

      {/* Horários Bloqueados */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-zinc-700 dark:text-zinc-300" />
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Horários Bloqueados
            </h3>
          </div>
          
          <Button
            onClick={() => setModalBloqueio(true)}
            size="3"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Bloqueio
          </Button>
        </div>

        {bloqueios.length === 0 ? (
          <div className="text-center py-8 text-zinc-600 dark:text-zinc-400">
            Nenhum horário bloqueado
          </div>
        ) : (
          <div className="space-y-3">
            {bloqueios.map(bloqueio => (
              <div
                key={bloqueio.id}
                className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {format(new Date(bloqueio.data), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                    <Badge color={bloqueio.tipo === 'feriado' ? 'red' : 'orange'}>
                      {bloqueio.tipo === 'feriado' ? 'Feriado' : bloqueio.tipo === 'folga' ? 'Folga' : 'Bloqueio'}
                    </Badge>
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    {bloqueio.horario_inicio} - {bloqueio.horario_fim}
                    {bloqueio.barbeiros && ` • ${bloqueio.barbeiros.nome}`}
                    {bloqueio.motivo && ` • ${bloqueio.motivo}`}
                  </div>
                </div>
                
                <Button
                  onClick={() => removerBloqueio(bloqueio.id)}
                  color="red"
                  variant="soft"
                  size="2"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Modal de Novo Bloqueio */}
      <Dialog.Root open={modalBloqueio} onOpenChange={setModalBloqueio}>
        <Dialog.Content style={{ maxWidth: 500 }}>
          <Dialog.Title>Novo Bloqueio de Horário</Dialog.Title>
          
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-2">Barbeiro (opcional)</label>
              <Select.Root
                value={novoBloqueio.barbeiro_id || "all"}
                onValueChange={(value) => setNovoBloqueio({ ...novoBloqueio, barbeiro_id: value === "all" ? "" : value })}
              >
                <Select.Trigger placeholder="Todos os barbeiros" />
                <Select.Content>
                  <Select.Item value="all">Todos os barbeiros</Select.Item>
                  {barbeiros.map(b => (
                    <Select.Item key={b.id} value={b.id}>{b.nome}</Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Data</label>
              <TextField.Root
                type="date"
                value={novoBloqueio.data}
                onChange={(e: any) => setNovoBloqueio({ ...novoBloqueio, data: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Início</label>
                <TextField.Root
                  type="time"
                  value={novoBloqueio.horario_inicio}
                  onChange={(e: any) => setNovoBloqueio({ ...novoBloqueio, horario_inicio: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Fim</label>
                <TextField.Root
                  type="time"
                  value={novoBloqueio.horario_fim}
                  onChange={(e: any) => setNovoBloqueio({ ...novoBloqueio, horario_fim: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tipo</label>
              <Select.Root
                value={novoBloqueio.tipo}
                onValueChange={(value) => setNovoBloqueio({ ...novoBloqueio, tipo: value })}
              >
                <Select.Trigger />
                <Select.Content>
                  <Select.Item value="bloqueio_manual">Bloqueio Manual</Select.Item>
                  <Select.Item value="folga">Folga</Select.Item>
                  <Select.Item value="feriado">Feriado</Select.Item>
                </Select.Content>
              </Select.Root>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Motivo (opcional)</label>
              <TextArea
                value={novoBloqueio.motivo}
                onChange={(e: any) => setNovoBloqueio({ ...novoBloqueio, motivo: e.target.value })}
                placeholder="Ex: Feriado nacional, Folga do barbeiro..."
                rows={2}
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              onClick={() => setModalBloqueio(false)}
              variant="soft"
              color="gray"
              style={{ flex: 1 }}
            >
              Cancelar
            </Button>
            <Button
              onClick={criarBloqueio}
              disabled={salvando}
              style={{ flex: 1 }}
            >
              Criar Bloqueio
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Root>

      {/* Modal de Feedback */}
      {modalConfig && (
        <Modal
          isOpen={modalAberto}
          onClose={() => setModalAberto(false)}
          title={modalConfig.title}
          message={modalConfig.message}
          type={modalConfig.type}
        />
      )}
    </div>
  );
}
