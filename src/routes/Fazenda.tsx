import { useEffect, useId, useState } from 'react'
import { Container } from '../components/ui/Container'
import { Eyebrow } from '../components/ui/Eyebrow'
import { Reveal } from '../components/ui/Reveal'
import { LinkButton, NavButton } from '../components/ui/Button'
import { FarmStatusCard } from '../components/shared/FarmStatusCard'
import { VipSteps } from '../components/shared/VipSteps'
import { Modal } from '../components/ui/Modal'
import { VideoEmbed } from '../components/shared/VideoEmbed'
import { getFarmVideos } from '../lib/api/farm'

const FARM_RULES_VIDEO_ID = 'TcBrAo_A1Lc'

// Lista de mods do servidor dedicado, a mesma exibida no card de status que
// o bot Guaxinim Comunista posta no Discord — pública, sem auth.
const SERVER_MODS_LIST_URL = 'http://galindoverso.gamesservers.io:9017/mods.html'

const CONTRIBUTE_ITEMS = [
  { icon: '🚜', title: 'Jogue e participe', text: 'Entre no servidor e ajude no plantio, na produção e na expansão da fazenda durante as lives.' },
  { icon: '💬', title: 'Dê ideias nas lives', text: 'Sugestões de compra, construção e próximos passos ajudam a escrever a história da fazenda.' },
  { icon: '🛠️', title: 'Ajude a manter tudo no ar', text: 'Ser VIP contribui direto com os custos do servidor dedicado e dos projetos do canal.' },
  { icon: '📢', title: 'Divulgue o canal', text: 'Compartilhe clipes e momentos marcantes da fazenda nas redes sociais.' },
  { icon: '🤝', title: 'Acolha quem chegou agora', text: 'Receba bem os novos membros e ajude a explicar como tudo funciona por aqui.' },
  { icon: '🐛', title: 'Reporte problemas', text: 'Viu um bug, mod quebrado ou algo estranho no servidor? Avise um administrador.' },
] as const

const INTERACT_ITEMS = [
  { icon: '🎮', title: 'Chat do jogo', text: 'Converse e combine tarefas com quem estiver online na fazenda.' },
  { icon: '💻', title: 'Discord', text: 'Canais de texto e voz da comunidade, disponíveis mesmo fora das lives.' },
  { icon: '📱', title: 'WhatsApp', text: 'Grupo geral pra acompanhar avisos e trocar ideia fora do Discord.' },
  { icon: '📺', title: 'Chat da live', text: 'Participe do chat durante as transmissões, muita decisão da fazenda sai dali.' },
] as const

// Card genérico dos grids de "Faça parte" e "Comunidade" — hover sutil
// (zoom no ícone + borda dourada), mesma linguagem usada no resto do site
// (CommunityStatsGrid, HubLink) pra não destoar visualmente.
const INFO_CARD_CLASSNAME = 'group rounded-lg border border-line bg-gradient-to-br from-panel to-panel2 p-5 transition duration-300 hover:-translate-y-1 hover:border-gold/60 hover:shadow-[0_16px_40px_-28px_rgba(217,177,79,0.8)]'

function InfoCard({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className={INFO_CARD_CLASSNAME}>
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-line bg-bg/50 text-xl transition duration-300 group-hover:scale-110 group-hover:border-gold/40">{icon}</span>
      <h3 className="mt-4 text-base">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
    </div>
  )
}

const PLAIN_REQUIREMENTS = [
  { icon: '📜', title: 'Leia as regras', text: 'As regras da fazenda ficam fixadas no Discord, dá uma lida antes de entrar.' },
  { icon: '🔞', title: 'Seja maior de 18 anos', text: 'Requisito pra jogar no servidor, sem exceção.' },
] as const

// Página de destino do botão "Participe da Fazenda" no card carro-chefe de
// /conteudos (Farming Simulator 25 — Fazenda Nova Aliança). Reaproveita o
// VipSteps (mesma fonte de /comunidade) pra não duplicar/dessincronizar o
// fluxo de virar VIP.
export function Fazenda() {
  const rulesVideoTitleId = useId()
  const [rulesVideoOpen, setRulesVideoOpen] = useState(false)
  const [rulesVideoId, setRulesVideoId] = useState(FARM_RULES_VIDEO_ID)

  useEffect(() => {
    getFarmVideos().then((videos) => setRulesVideoId(videos.rulesVideoId)).catch(() => {})
  }, [])

  return (
    <>
      <section className="relative isolate overflow-hidden py-16 sm:py-24">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_25%,rgba(217,177,79,0.16),transparent_36%),radial-gradient(circle_at_85%_70%,rgba(56,163,90,0.12),transparent_38%)]" />
        <Container>
          <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
            <Reveal>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <Eyebrow>Farming Simulator 25</Eyebrow>
                  <span className="rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-gold">Servidor da comunidade</span>
                </div>
                <h1 className="mt-5 text-5xl leading-[0.92] sm:text-6xl">A FAZENDA É NOSSA. A PRÓXIMA HISTÓRIA PODE SER SUA.</h1>
                <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
                  Entre para a Fazenda Nova Aliança, jogue ao lado da comunidade e ajude a construir um projeto que continua crescendo dentro e fora das lives.
                </p>
                <div className="mt-7 flex flex-wrap gap-2">
                  {['Servidor sempre ativo', 'Comunidade acolhedora', 'Não exige experiência'].map((item) => (
                    <span key={item} className="rounded-full border border-line bg-panel/80 px-3 py-1.5 text-xs font-semibold text-white/75">{item}</span>
                  ))}
                </div>
              </div>
            </Reveal>
            <Reveal>
              <div className="relative">
                <div className="absolute -inset-5 -z-10 rounded-full bg-gold/10 blur-3xl" />
                <FarmStatusCard />
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      <section className="border-y border-line bg-panel/40 py-16 sm:py-20">
        <Reveal>
          <Container>
            <div className="max-w-2xl">
              <Eyebrow>Uma fazenda feita em conjunto</Eyebrow>
              <h2 className="mt-1 text-3xl sm:text-4xl">TODO MUNDO AJUDA A FAZER A HISTÓRIA ACONTECER</h2>
              <p className="mt-3 text-muted">Você pode participar do seu jeito, no servidor, nas lives ou fortalecendo a comunidade.</p>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {CONTRIBUTE_ITEMS.map((item) => (
                <InfoCard key={item.title} {...item} />
              ))}
            </div>
          </Container>
        </Reveal>
      </section>

      <section id="participar" className="py-16 sm:py-24">
        <Reveal>
          <Container>
            <div className="max-w-2xl">
              <Eyebrow>Seu caminho até o servidor</Eyebrow>
              <h2 className="mt-1 text-3xl sm:text-4xl">PRONTO PARA VIR PARA A LIDA?</h2>
              <p className="mt-3 text-muted">Confira os requisitos, prepare o jogo e solicite sua entrada.</p>
            </div>

            <div className="mt-9 overflow-hidden rounded-xl border border-gold/40 bg-panel bg-[radial-gradient(circle_at_top_left,rgba(217,177,79,0.1),transparent_42%)] p-6 shadow-[0_24px_70px_-45px_rgba(217,177,79,0.7)] sm:p-8">
              <div className="flex flex-col justify-between gap-4 border-b border-line pb-6 md:flex-row md:items-end">
                <div className="max-w-2xl">
                  <Eyebrow>Antes de entrar</Eyebrow>
                  <h3 className="mt-1 text-2xl">QUATRO PASSOS PARA PREPARAR TUDO</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">O acesso é reservado aos membros VIP maiores de 18 anos que conhecem e respeitam as regras da fazenda.</p>
                </div>
                <span className="shrink-0 rounded-full border border-green/40 bg-green/10 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-green">Servidor sempre ativo</span>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <button
                  type="button"
                  onClick={() => setRulesVideoOpen(true)}
                  className="group flex flex-col justify-between rounded-lg border-2 border-gold bg-bg/40 p-5 text-left shadow-[0_0_30px_-12px_rgba(217,177,79,0.4)] transition duration-300 hover:-translate-y-1"
                >
                  <div>
                    <span className="inline-block w-fit text-2xl transition duration-300 group-hover:scale-110">🎬</span>
                    <h4 className="mt-2 text-sm font-semibold uppercase tracking-wide">ASSISTA ÀS REGRAS DA FAZENDA</h4>
                    <p className="mt-2 text-sm leading-relaxed text-muted">Veja as regras e orientações para jogar no servidor.</p>
                  </div>
                  <span className="mt-3 text-xs font-semibold text-gold group-hover:underline">Assistir agora</span>
                </button>

                <a
                  href="#vip"
                  className="group flex flex-col justify-between rounded-lg border-2 border-gold bg-bg/40 p-5 shadow-[0_0_30px_-12px_rgba(217,177,79,0.4)] transition duration-300 hover:-translate-y-1"
                >
                  <div>
                    <span className="inline-block w-fit text-2xl transition duration-300 group-hover:scale-110">🌟</span>
                    <h4 className="mt-2 text-sm font-semibold uppercase tracking-wide">Seja VIP</h4>
                    <p className="mt-2 text-sm leading-relaxed text-muted">O requisito principal para acessar a fazenda. Veja como logo abaixo.</p>
                  </div>
                  <span className="mt-3 text-xs font-semibold text-gold group-hover:underline">Ver como</span>
                </a>

                {PLAIN_REQUIREMENTS.map((item) => (
                  <InfoCard key={item.title} {...item} />
                ))}
              </div>

              <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
                <p className="max-w-xl text-sm text-muted">Com os requisitos em dia, sincronize os mods e faça sua solicitação na área VIP.</p>
                <div className="flex flex-wrap gap-3">
                <NavButton variant="green" to="/mods">
                  Sincronize seus mods
                </NavButton>
                <LinkButton variant="default" href={SERVER_MODS_LIST_URL} target="_blank" rel="noopener noreferrer">
                  Ver lista de mods do servidor
                </LinkButton>
                </div>
              </div>
            </div>
          </Container>
        </Reveal>
      </section>

      <section className="border-y border-line bg-panel/40 py-16 sm:py-20">
        <Reveal>
          <Container>
            <div className="max-w-2xl">
              <Eyebrow>A resenha continua</Eyebrow>
              <h2 className="mt-1 text-3xl sm:text-4xl">A FAZENDA VAI ALÉM DO JOGO</h2>
              <p className="mt-3 text-muted">Converse, combine tarefas e acompanhe as decisões em todos os espaços da comunidade.</p>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {INTERACT_ITEMS.map((item) => (
                <InfoCard key={item.title} {...item} />
              ))}
            </div>
          </Container>
        </Reveal>
      </section>

      <section id="vip" className="py-16 sm:py-24">
        <Reveal>
          <Container>
            <VipSteps variant="full" />
          </Container>
        </Reveal>
      </section>

      <Modal
        open={rulesVideoOpen}
        onClose={() => setRulesVideoOpen(false)}
        titleId={rulesVideoTitleId}
        className="max-w-4xl overflow-hidden p-0"
      >
        <div className="flex items-center justify-between gap-4 p-4 sm:px-6">
          <h2 id={rulesVideoTitleId} className="text-lg sm:text-xl">
            REGRAS DA FAZENDA
          </h2>
          <button
            type="button"
            onClick={() => setRulesVideoOpen(false)}
            className="text-sm font-semibold uppercase text-muted transition hover:text-white"
          >
            Fechar
          </button>
        </div>
        <VideoEmbed videoId={rulesVideoId} title="Regras da Fazenda Nova Aliança do GalindoGamerBR" />
      </Modal>
    </>
  )
}
