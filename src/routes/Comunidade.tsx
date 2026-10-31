import { Container } from '../components/ui/Container'
import { Eyebrow } from '../components/ui/Eyebrow'
import { Reveal } from '../components/ui/Reveal'
import { LinkButton, NavButton } from '../components/ui/Button'
import { HubLink } from '../components/shared/HubLink'
import { CommunityStatsGrid } from '../components/shared/CommunityStatsGrid'

const WHATSAPP_URL = 'https://chat.whatsapp.com/JM27GGiEFzRFtUyuc8wUdk'

const HUB_LINKS = [
  {
    icon: '🎮',
    eyebrow: 'Discord oficial',
    title: 'SERVIDOR DA COMUNIDADE',
    description: 'Entre nos canais de texto e voz, acompanhe os avisos e participe das conversas do canal.',
    href: '/discord',
  },
  {
    icon: '💬',
    eyebrow: 'WhatsApp',
    title: 'GRUPO DOS SEGUIDORES',
    description: 'Receba novidades, acompanhe a comunidade e continue a resenha ao longo do dia.',
    href: WHATSAPP_URL,
  },
  {
    icon: '🚜',
    eyebrow: 'Farming Simulator 25',
    title: 'MOD SYNC',
    description: 'Prepare seu jogo com a coleção de mods usada na Fazenda Nova Aliança.',
    href: '/mods',
  },
] as const

const COMMUNITY_VALUES = [
  { icon: '🤝', title: 'Gente que acolhe', text: 'Quem acabou de chegar encontra espaço para conversar, aprender e participar.' },
  { icon: '🎥', title: 'Conteúdo compartilhado', text: 'Lives, vídeos e momentos que continuam rendendo assunto depois da transmissão.' },
  { icon: '🌱', title: 'Projetos que crescem', text: 'A comunidade ajuda a manter o canal, as séries e novas ideias em movimento.' },
] as const

export function Comunidade() {
  return (
    <>
      <section id="numeros" className="relative isolate overflow-hidden border-b border-line bg-panel/40 py-16 sm:py-24">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_50%,rgba(217,177,79,0.09),transparent_48%)]" />
        <Reveal>
          <Container>
            <div className="text-center">
              <div className="mx-auto max-w-3xl">
                <Eyebrow>Comunidade em números</Eyebrow>
                <h1 className="mt-2 text-4xl sm:text-5xl">UMA COMUNIDADE QUE NÃO PARA DE CRESCER</h1>
                <p className="mx-auto mt-4 max-w-2xl text-lg text-muted">Milhares de pessoas acompanhando, conversando e fazendo parte do Galindoverso todos os dias.</p>
              </div>
            </div>
            <div className="mt-10 rounded-xl border border-gold/25 bg-bg/30 p-4 shadow-[0_22px_70px_-45px_rgba(217,177,79,0.75)] sm:p-6"><CommunityStatsGrid /></div>
          </Container>
        </Reveal>
      </section>

      <section className="relative isolate overflow-hidden py-16 sm:py-24">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_25%,rgba(88,101,242,0.15),transparent_36%),radial-gradient(circle_at_82%_65%,rgba(217,177,79,0.14),transparent_40%)]" />
        <Container>
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            <Reveal>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <Eyebrow>Comunidade GalindoGamerBR</Eyebrow>
                  <span className="rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-gold">A resenha não para</span>
                </div>
                <h2 className="mt-5 text-5xl leading-[0.92] sm:text-6xl">CHEGUE JUNTO. A CASA TAMBÉM É SUA.</h2>
                <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
                  Encontre quem acompanha as lives, compartilha a paixão por simuladores e ajuda a construir tudo o que acontece no Galindoverso.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <NavButton variant="blue" to="/discord">Entrar no Discord</NavButton>
                  <LinkButton variant="default" href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">Entrar no WhatsApp</LinkButton>
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  {['Lives e jogos', 'Servidores abertos', 'Resenha todos os dias'].map((item) => (
                    <span key={item} className="rounded-full border border-line bg-panel/80 px-3 py-1.5 text-xs font-semibold text-white/75">{item}</span>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal>
              <div className="relative overflow-hidden rounded-xl border border-gold/35 bg-panel p-6 shadow-[0_24px_70px_-35px_rgba(217,177,79,0.5)] sm:p-7">
                <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-gold/10 blur-3xl" />
                <div className="relative">
                  <Eyebrow>O que une a comunidade</Eyebrow>
                  <h2 className="mt-1 text-2xl">MUITO ALÉM DO CHAT</h2>
                  <div className="mt-6 space-y-4">
                    {COMMUNITY_VALUES.map((item) => (
                      <div key={item.title} className="flex gap-4 rounded-lg border border-line bg-bg/40 p-4">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-line bg-panel2 text-xl">{item.icon}</span>
                        <div>
                          <h3 className="text-sm">{item.title}</h3>
                          <p className="mt-1 text-sm leading-relaxed text-muted">{item.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-24">
        <Reveal>
          <Container>
            <div className="max-w-2xl">
              <Eyebrow>Escolha seu espaço</Eyebrow>
              <h2 className="mt-1 text-3xl sm:text-4xl">TODOS OS CAMINHOS PARA CHEGAR JUNTO</h2>
              <p className="mt-3 text-muted">Entre na conversa, acompanhe os avisos ou prepare seu jogo para jogar junto.</p>
            </div>
            <div className="mt-9 grid grid-cols-1 gap-5 sm:grid-cols-3">
              {HUB_LINKS.map((link) => <HubLink key={link.title} {...link} />)}
            </div>
          </Container>
        </Reveal>
      </section>

      <section className="pb-16 sm:pb-24">
        <Reveal>
          <Container>
            <div className="flex flex-col items-start justify-between gap-5 rounded-xl border border-gold/40 bg-panel p-6 sm:flex-row sm:items-center sm:p-8">
              <div className="max-w-2xl">
                <Eyebrow>Quer jogar com a gente?</Eyebrow>
                <h2 className="mt-1 text-2xl sm:text-3xl">SERVIDORES ABERTOS, COOP E VIP EM UM SÓ LUGAR</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">Veja como entrar nos jogos, virar VIP e jogar junto com a comunidade.</p>
              </div>
              <NavButton variant="gold" to="/jogar">Jogue com o Galindo</NavButton>
            </div>
          </Container>
        </Reveal>
      </section>
    </>
  )
}
