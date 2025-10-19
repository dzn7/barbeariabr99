"use client";

import { motion } from "framer-motion";
import { Calendar, Clock, Award, Scissors, Star, Phone, MapPin } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Carousel, Card } from "@/components/CarrosselTrabalhosComCurtidas";
import { ModalServicos } from "@/components/ModalServicos";
import { SecaoAvaliacoes } from "@/components/SecaoAvaliacoes";
import { SecaoComoNosEncontrar } from "@/components/SecaoComoNosEncontrar";
import { BotaoWhatsAppFlutuante } from "@/components/BotaoWhatsAppFlutuante";
import { useEstatisticasAvaliacoes } from "@/hooks/useEstatisticasAvaliacoes";

/**
 * Página inicial da barbearia
 * Design limpo e direto ao ponto
 */
export default function PaginaInicial() {
  const { estatisticas: estatisticasAvaliacoes, carregando: carregandoEstatisticas } = useEstatisticasAvaliacoes();

  // Serviços reais 
  const servicosReais = [
    // Populares
    { nome: "Corte Degradê", preco: "R$ 25,00", duracao: "40min", categoria: "popular" },
    { nome: "Corte Degradê + Sobrancelha", preco: "R$ 30,00", duracao: "40min", categoria: "popular" },
    { nome: "Corte Degradê + Barba", preco: "R$ 40,00", duracao: "1h", categoria: "popular" },
    // Outros
    { nome: "Corte Social na Máquina", preco: "R$ 20,00", duracao: "30min", categoria: "outros" },
    { nome: "Corte Social na Tesoura", preco: "R$ 25,00", duracao: "40min", categoria: "outros" },
    { nome: "Corte Degradê + Barba + Sobrancelha", preco: "R$ 45,00", duracao: "1h", categoria: "outros" },
    { nome: "Corte Social na Máquina + Barba", preco: "R$ 35,00", duracao: "50min", categoria: "outros" },
    { nome: "Corte Social na Máquina + Sobrancelha", preco: "R$ 25,00", duracao: "40min", categoria: "outros" },
    { nome: "Corte Social na Tesoura + Barba", preco: "R$ 40,00", duracao: "1h", categoria: "outros" },
    { nome: "Corte Social na Máquina + Barba + Sobrancelha", preco: "R$ 40,00", duracao: "1h", categoria: "outros" },
    { nome: "Corte Social na Tesoura + Barba + Sobrancelha", preco: "R$ 45,00", duracao: "1h", categoria: "outros" },
    { nome: "Fazer a Barba", preco: "R$ 15,00", duracao: "20min", categoria: "outros" },
  ];

  // Serviços em destaque para exibir na página
  const servicosDestaque = [
    { nome: "Corte Degradê", preco: "R$ 25", duracao: "40min" },
    { nome: "Corte + Barba", preco: "R$ 40", duracao: "1h" },
    { nome: "Pacote Completo", preco: "R$ 45", duracao: "1h" },
  ];

  const diferenciais = [
    {
      icone: Calendar,
      titulo: "Agendamento Fácil",
      texto: "Reserve online em poucos cliques"
    },
    {
      icone: Clock,
      titulo: "Horário Flexível",
      texto: "Segunda a sábado das 9h às 18h"
    },
    {
      icone: Award,
      titulo: "Profissionais Experientes",
      texto: "Mais de 4 anos de experiencia"
    }
  ];


  const trabalhos = [
    {
      id: "00000000-0000-0000-0000-000000000001", // ID temporário - será substituído pelo do banco
      category: "Corte Clássico",
      title: "Degradê Moderno",
      src: "/assets/img1.jpeg",
      curtidas: 0,
      content: (
        <div>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            Corte degradê com acabamento profissional. Técnica moderna que valoriza o formato do rosto.
          </p>
          <p className="text-zinc-600 dark:text-zinc-400">
            Nossos barbeiros são especializados em diversos estilos de corte, sempre buscando o melhor resultado para cada cliente.
          </p>
        </div>
      ),
    },
    {
      id: "00000000-0000-0000-0000-000000000002",
      category: "Barba & Cabelo",
      title: "Combo Completo",
      src: "/assets/img2.jpeg",
      curtidas: 0,
      content: (
        <div>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            Transformação completa com corte de cabelo e barba. Resultado impecável e profissional.
          </p>
          <p className="text-zinc-600 dark:text-zinc-400">
            Utilizamos produtos premium e técnicas avançadas para garantir a melhor experiência.
          </p>
        </div>
      ),
    },
    {
      id: "00000000-0000-0000-0000-000000000003",
      category: "Estilo Premium",
      title: "Corte Degradê",
      src: "/assets/img3.jpeg",
      curtidas: 0,
      content: (
        <div>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            Corte social elegante e sofisticado. Perfeito para o dia a dia profissional.
          </p>
          <p className="text-zinc-600 dark:text-zinc-400">
            Atendimento personalizado com atenção aos detalhes que fazem a diferença.
          </p>
        </div>
      ),
    },
  ];

  const cards = trabalhos.map((trabalho, index) => (
    <Card key={trabalho.src} card={trabalho} index={index} />
  ));

  return (
    <div className="w-full bg-white dark:bg-black overflow-x-hidden">
      
      {/* Hero moderno e assimétrico */}
      <section className="relative bg-white dark:bg-black overflow-hidden">
        <div className="container mx-auto px-4 py-16 md:py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            
            {/* Conteúdo */}
            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-4"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-900 rounded-full">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-medium text-zinc-900 dark:text-white">
                    {carregandoEstatisticas ? (
                      'Carregando...'
                    ) : estatisticasAvaliacoes.totalAvaliacoes > 0 ? (
                      `${estatisticasAvaliacoes.mediaNotas} estrelas • ${estatisticasAvaliacoes.totalAvaliacoes} avaliações`
                    ) : (
                      'Seja o primeiro a avaliar'
                    )}
                  </span>
                </div>
                
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-zinc-900 dark:text-white leading-tight">
                  Estilo que
                  <br />
                  <span className="text-zinc-600 dark:text-zinc-400">Surpreende</span>
                </h1>
                
                <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 max-w-lg">
                  Mais de 4 anos transformando estilos em Barras, PI. 
                  Agende seu horário e venha viver essa experiência BR99.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Link
                  href="/agendamento"
                  className="group relative inline-flex items-center justify-center px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl font-semibold overflow-hidden transition-all hover:scale-105 hover:shadow-xl"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Agendar Horário
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-zinc-800 to-zinc-900 dark:from-zinc-100 dark:to-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
                
                <a
                  href="tel:+558699533738"
                  className="inline-flex items-center justify-center px-8 py-4 border-2 border-zinc-900 dark:border-white text-zinc-900 dark:text-white rounded-xl font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all hover:scale-105"
                >
                  <Phone className="w-5 h-5 mr-2" />
                  (86) 99953-3738
                </a>
              </motion.div>

              {/* Estatísticas */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="grid grid-cols-3 gap-6 pt-8 border-t border-zinc-200 dark:border-zinc-800"
              >
                <div>
                  <div className="text-3xl font-bold text-zinc-900 dark:text-white">4+</div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">Anos</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-zinc-900 dark:text-white">
                    {carregandoEstatisticas ? '...' : estatisticasAvaliacoes.totalAvaliacoes || 0}
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">Avaliações</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-zinc-900 dark:text-white">
                    {carregandoEstatisticas ? '...' : `${estatisticasAvaliacoes.porcentagem5Estrelas || 0}%`}
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">5 Estrelas</div>
                </div>
              </motion.div>
            </div>

            {/* Imagem da Fachada */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="relative hidden lg:block"
            >
              <div className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl">
                <Image
                  src="/assets/faxada.PNG"
                  alt="Fachada Barbearia BR99"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover"
                  priority
                />
                {/* Overlay sutil */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>

              {/* Cards flutuantes */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-6 -right-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-4 border border-zinc-200 dark:border-zinc-800"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                    <Star className="w-6 h-6 text-white fill-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-zinc-900 dark:text-white">
                      {carregandoEstatisticas ? '...' : estatisticasAvaliacoes.mediaNotas || '0.0'}
                    </div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">Avaliação</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute -bottom-6 -left-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-4 border border-zinc-200 dark:border-zinc-800"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-zinc-900 dark:bg-white rounded-full flex items-center justify-center">
                    <Scissors className="w-6 h-6 text-white dark:text-zinc-900" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-zinc-900 dark:text-white">R$ 25</div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">A partir de</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Gradiente de fundo */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-zinc-900/5 dark:bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-zinc-900/5 dark:bg-white/5 rounded-full blur-3xl" />
        </div>
      </section>

      {/* Serviços */}
      <section className="py-20 bg-white dark:bg-black">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white mb-4">
              Nossos Serviços
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              Serviços em destaque - Veja todos os preços
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {servicosDestaque.map((servico, index) => (
              <motion.div
                key={servico.nome}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-zinc-50 dark:bg-zinc-900 p-6 rounded-lg"
              >
                <div className="flex items-start justify-between mb-4">
                  <Scissors className="w-8 h-8 text-zinc-900 dark:text-white" />
                  <div className="text-right">
                    <div className="text-2xl font-bold text-zinc-900 dark:text-white">
                      {servico.preco}
                    </div>
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">
                      {servico.duracao}
                    </div>
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
                  {servico.nome}
                </h3>
                
                <Link
                  href="/agendamento"
                  className="block text-center px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
                >
                  Agendar
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Botão para ver todos os serviços */}
          <div className="text-center">
            <ModalServicos servicos={servicosReais} />
          </div>
        </div>
      </section>

      {/* Diferenciais */}
      <section className="py-20 bg-white dark:bg-black">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white mb-4">
              Por que nos escolher
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {diferenciais.map((item, index) => {
              const Icone = item.icone;
              return (
                <motion.div
                  key={item.titulo}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-zinc-900 dark:bg-zinc-800 rounded-lg mb-4">
                    <Icone className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
                    {item.titulo}
                  </h3>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    {item.texto}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Conheça nosso trabalho */}
      <section className="py-20 bg-white dark:bg-black">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white mb-4">
              Conheça nosso trabalho
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              Veja alguns dos nossos melhores cortes e transformações
            </p>
          </div>
        </div>
        
        <Carousel items={cards} />
      </section>

      {/* Seção de Avaliações */}
      <SecaoAvaliacoes />

      {/* Como nos Encontrar */}
      <SecaoComoNosEncontrar />

      {/* Localização e contato */}
      <section className="py-20 bg-zinc-900 dark:bg-zinc-900">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Venha nos visitar
            </h2>
            
            <div className="flex flex-col md:flex-row gap-8 justify-center items-center text-zinc-300">
              <div className="flex items-center gap-3">
                <MapPin className="w-6 h-6" />
                <span className="text-lg">Rua Duque de Caxias, 601 - Xique-Xique, Barras - PI</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-6 h-6" />
                <span className="text-lg">(86) 99953-3738</span>
              </div>
            </div>

            <div>
              <Link
                href="/agendamento"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-black rounded-lg font-medium hover:bg-zinc-100 transition-colors"
              >
                Agendar Agora
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Botão Flutuante WhatsApp */}
      <BotaoWhatsAppFlutuante />

    </div>
  );
}
