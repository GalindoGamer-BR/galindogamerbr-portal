import { useEffect, useState } from 'react'
import { Container } from '../components/ui/Container'
import { Eyebrow } from '../components/ui/Eyebrow'
import { LinkButton, NavButton } from '../components/ui/Button'
import { Reveal } from '../components/ui/Reveal'
import { DownloadIcon } from '../components/ui/DownloadIcon'

const MODSYNC_URL = 'https://modsync.phmoreira.dev/'
const DOWNLOAD_LATEST_URL = 'https://modsync.phmoreira.dev/download/latest'
const LATEST_VERSION_URL = 'https://modsync.phmoreira.dev/latest'

const STEPS = [
  { number: '01', title: 'Escolha a pasta', text: 'Mostre ao aplicativo onde ficam os mods do seu jogo.' },
  { number: '02', title: 'Inicie a sincronização', text: 'O Mod Sync compara os arquivos com a coleção oficial da fazenda.' },
  { number: '03', title: 'Entre no servidor', text: 'Tudo pronto para jogar com os mesmos mods usados nas lives.' },
] as const

const FEATURES = [
  { icon: '⚡', title: 'Download mais rápido', text: 'Receba os arquivos com muito mais agilidade que pelo gerenciador do próprio jogo.' },
  { icon: '🔄', title: 'Tudo sincronizado', text: 'Sua pasta e o servidor ficam alinhados sem comparação manual de versões.' },
  { icon: '📦', title: 'Fonte oficial', text: 'Use exatamente a mesma coleção presente na Fazenda Nova Aliança.' },
  { icon: '🧹', title: 'Pasta organizada', text: 'Arquivos antigos que não pertencem mais ao servidor são removidos automaticamente.' },
  { icon: '🎯', title: 'Configuração simples', text: 'Configure uma vez e deixe o aplicativo cuidar das próximas atualizações.' },
  { icon: '🖥️', title: 'Código aberto', text: 'O projeto é aberto para quem quiser conferir como cada etapa funciona.' },
] as const

type LatestVersionResponse = { version: string }

function useLatestVersion(): string | null {
  const [version, setVersion] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fetch(LATEST_VERSION_URL)
      .then((res) => (res.ok ? (res.json() as Promise<LatestVersionResponse>) : null))
      .then((data) => {
        if (active && data?.version) setVersion(data.version)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  return version
}

export function Mods() {
  const latestVersion = useLatestVersion()

  return (
    <>
      <section className="relative isolate overflow-hidden py-16 sm:py-24">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_20%,rgba(56,163,90,0.16),transparent_34%),radial-gradient(circle_at_85%_70%,rgba(217,177,79,0.12),transparent_38%)]" />
        <Container>
          <div className="grid items-center gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:gap-14">
            <Reveal>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <Eyebrow>Farming Simulator 25</Eyebrow>
                  <span className="rounded-full border border-green/40 bg-green/10 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-green">Aplicativo oficial</span>
                </div>
                <h1 className="mt-5 text-5xl leading-[0.92] sm:text-6xl">SEUS MODS PRONTOS. SUA FAZENDA EM DIA.</h1>
                <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">O jeito mais simples de baixar, organizar e manter os mods da Fazenda Nova Aliança sempre atualizados.</p>

                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <LinkButton variant="green" href={DOWNLOAD_LATEST_URL}><DownloadIcon />Baixar versão mais recente</LinkButton>
                  <LinkButton variant="default" href={MODSYNC_URL} target="_blank" rel="noopener noreferrer">Release notes</LinkButton>
                </div>
                <p className="mt-4 text-sm text-muted">
                  Vai entrar na fazenda? <NavButton variant="default" size="sm" to="/jogar#como-entrar" className="ml-2">Veja como jogar com o Galindo</NavButton>
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold uppercase tracking-widest text-muted">
                  {latestVersion && <span className="text-green">Versão {latestVersion}</span>}
                  <span>Gratuito</span><span>Windows</span><span>Configuração rápida</span>
                </div>
              </div>
            </Reveal>

            <Reveal>
              <div className="relative">
                <div className="absolute -inset-5 -z-10 rounded-full bg-green/10 blur-3xl" />
                <div className="overflow-hidden rounded-xl border border-green/40 bg-panel shadow-[0_25px_70px_-25px_rgba(56,163,90,0.5)]">
                  <div className="flex items-center justify-end border-b border-line bg-panel2/90 px-4 py-3">
                    <span className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-muted">Mod Sync em ação</span>
                  </div>
                  <img src="/assets/mod-sync-demo.webp" alt="Mod Sync sincronizando os mods da fazenda" className="w-full" />
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      <section className="border-y border-line bg-panel/45 py-16 sm:py-20">
        <Reveal>
          <Container>
            <div className="max-w-2xl">
              <Eyebrow>Pronto em poucos passos</Eyebrow>
              <h2 className="mt-1 text-3xl sm:text-4xl">DA INSTALAÇÃO AO JOGO</h2>
              <p className="mt-3 text-muted">Sem procurar arquivos, comparar versões ou descobrir um problema na hora de entrar.</p>
            </div>
            <div className="mt-9 grid gap-4 md:grid-cols-3">
              {STEPS.map((step) => (
                <div key={step.number} className="group relative overflow-hidden rounded-lg border border-line bg-gradient-to-br from-panel to-panel2 p-6 transition duration-300 hover:border-green/60">
                  <span className="absolute right-4 top-1 text-6xl font-black text-white/[0.035] transition group-hover:text-green/[0.08]">{step.number}</span>
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-green/40 bg-green/10 text-xs font-bold text-green">{step.number}</span>
                  <h3 className="mt-5 text-xl">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{step.text}</p>
                </div>
              ))}
            </div>
          </Container>
        </Reveal>
      </section>

      <section className="py-16 sm:py-24">
        <Reveal>
          <Container>
            <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-14">
              <div>
                <Eyebrow>Feito para a comunidade</Eyebrow>
                <h2 className="mt-1 text-3xl sm:text-4xl">MENOS TEMPO CONFIGURANDO. MAIS TEMPO JOGANDO.</h2>
                <p className="mt-4 leading-relaxed text-muted">Cada atualização da fazenda chegava com uma busca por links, versões e arquivos antigos. O Mod Sync reúne tudo em uma única experiência e mantém sua instalação pronta para a próxima resenha.</p>
                <div className="mt-7 rounded-lg border border-gold/30 bg-gold/[0.06] p-5">
                  <p className="text-sm font-semibold leading-relaxed text-white/85">A coleção é atualizada direto da fonte oficial usada no servidor e nas lives do GalindoGamerBR.</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {FEATURES.map((feature) => (
                  <div key={feature.title} className="rounded-lg border border-line bg-panel p-5 transition duration-300 hover:-translate-y-1 hover:border-green/50 hover:shadow-[0_16px_40px_-28px_rgba(56,163,90,0.8)]">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-line bg-panel2 text-xl">{feature.icon}</span>
                    <h3 className="mt-4 text-base">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{feature.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </Container>
        </Reveal>
      </section>

      <section className="pb-16 sm:pb-24">
        <Reveal>
          <Container>
            <div className="relative overflow-hidden rounded-xl border border-green/40 bg-gradient-to-r from-green/15 via-panel to-panel p-7 sm:p-10">
              <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-green/10 blur-3xl" />
              <div className="relative flex flex-col justify-between gap-7 md:flex-row md:items-center">
                <div className="max-w-2xl">
                  <Eyebrow>Sua próxima colheita começa aqui</Eyebrow>
                  <h2 className="mt-1 text-3xl sm:text-4xl">PREPARE SUA PASTA PARA A FAZENDA</h2>
                  <p className="mt-3 text-muted">Baixe o Mod Sync, faça a primeira sincronização e entre no servidor com tranquilidade.</p>
                </div>
                <div className="shrink-0"><LinkButton variant="green" href={DOWNLOAD_LATEST_URL}><DownloadIcon />Baixar agora</LinkButton></div>
              </div>
            </div>
          </Container>
        </Reveal>
      </section>
    </>
  )
}
