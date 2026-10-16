import { Container } from '../components/ui/Container'
import { Eyebrow } from '../components/ui/Eyebrow'
import { Reveal } from '../components/ui/Reveal'
import { LinkButton } from '../components/ui/Button'

const ICON_CREDITS = [
  {
    label: 'Sun icons created by Magnific - Flaticon',
    href: 'https://www.flaticon.com/free-icons/sun',
    icon: '/assets/icons/schedule-icon-sun.webp',
  },
  {
    label: 'Sunset icons created by Magnific - Flaticon',
    href: 'https://www.flaticon.com/free-icons/sunset',
    icon: '/assets/icons/schedule-icon-sunset.webp',
  },
  {
    label: 'Instagram icons created by Magnific - Flaticon',
    href: 'https://www.flaticon.com/br/icones-gratis/instagram',
    icon: '/assets/logos/instagram.webp',
  },
  {
    label: 'Youtube icons created by Magnific - Flaticon',
    href: 'https://www.flaticon.com/br/icones-gratis/youtube',
    icon: '/assets/logos/youtube.webp',
  },
  {
    label: 'Tik tok icons created by Magnific - Flaticon',
    href: 'https://www.flaticon.com/br/icones-gratis/tik-tok',
    icon: '/assets/logos/tiktok.webp',
  },
  {
    label: 'Twitch icons created by Laisa Islam Ani - Flaticon',
    href: 'https://www.flaticon.com/free-icons/twitch',
    icon: '/assets/logos/twitch.webp',
  },
]

// Lista de créditos de ícones/assets de terceiros usados no site — página
// própria em vez de lotar o rodapé, já que essa lista só tende a crescer.
export function Creditos() {
  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-line py-16 sm:py-24">
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_20%_30%,rgba(217,177,79,0.13),transparent_34%),radial-gradient(circle_at_82%_42%,rgba(86,104,245,0.12),transparent_30%)]" />
        <Container>
          <Reveal>
            <div className="max-w-3xl">
              <Eyebrow>Quem tornou este espaço possível</Eyebrow>
              <h1 className="mt-2 text-4xl leading-none sm:text-6xl">CRÉDITOS DE UMA HISTÓRIA CONSTRUÍDA EM CONJUNTO</h1>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
                Desenvolvimento, identidade e recursos que ajudam o universo GalindoGamerBR a ganhar forma também fora das lives.
              </p>
            </div>
          </Reveal>
        </Container>
      </section>

      <section className="py-16 sm:py-24">
        <Reveal>
          <Container>
            <div className="relative overflow-hidden rounded-xl border border-gold/40 bg-gradient-to-br from-panel via-panel to-panel2 p-7 shadow-[0_24px_70px_-38px_rgba(217,177,79,0.55)] sm:p-10">
              <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-blue/10 blur-3xl" />
              <div className="relative grid gap-9 lg:grid-cols-[0.72fr_1.28fr] lg:items-center lg:gap-14">
                <div className="relative mx-auto w-full max-w-sm overflow-hidden rounded-xl border border-line bg-bg">
                  <img
                    src="/assets/pedro-profile.webp"
                    alt="Pedro Henrique"
                    width="900"
                    height="900"
                    className="aspect-square w-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-bg/75 to-transparent" />
                </div>
                <div>
                  <Eyebrow>Desenvolvimento do portal</Eyebrow>
                  <h2 className="mt-2 text-4xl leading-none sm:text-5xl">PEDRO HENRIQUE</h2>
                  <p className="mt-5 text-lg leading-relaxed text-white/85">
                    Software Engineer com mais de sete anos construindo backends e sistemas cloud native seguros e escaláveis.
                  </p>
                  <p className="mt-4 leading-relaxed text-muted">
                    Experiência nos ecossistemas Microsoft, Lenovo e Dell, conduzindo decisões de arquitetura, modernização e confiabilidade desde a concepção até a produção.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {['Microsoft Azure', 'C# e .NET', 'Microsserviços', 'Sistemas distribuídos'].map((skill) => (
                      <span key={skill} className="rounded-full border border-blue/40 bg-blue/10 px-3 py-1.5 text-xs font-semibold text-white/85">{skill}</span>
                    ))}
                  </div>
                  <div className="mt-7 flex flex-wrap gap-3">
                    <LinkButton variant="blue" href="https://phmoreira.dev/" target="_blank" rel="noopener noreferrer">
                      Conhecer o portfólio
                    </LinkButton>
                    <LinkButton variant="default" href="https://www.linkedin.com/in/pedrogmoreira/" target="_blank" rel="noopener noreferrer">
                      <img src="/assets/icons/linkedin.svg" alt="" className="h-4 w-4" /> LinkedIn
                    </LinkButton>
                    <LinkButton variant="default" href="https://discord.com/users/276859538349752321" target="_blank" rel="noopener noreferrer">
                      <img src="/assets/icons/discord.svg" alt="" className="h-4 w-4" /> Discord
                    </LinkButton>
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </Reveal>
      </section>

      <section className="border-t border-line bg-panel/35 py-16 sm:py-20">
        <Reveal>
          <Container>
            <div className="max-w-2xl">
              <Eyebrow>Recursos utilizados</Eyebrow>
              <h2 className="mt-1 text-3xl sm:text-4xl">CRÉDITOS DE ÍCONES</h2>
              <p className="mt-3 leading-relaxed text-muted">Atribuições dos recursos visuais de terceiros utilizados no portal.</p>
            </div>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ICON_CREDITS.map((credit) => (
                <li key={credit.href}>
                  <a
                    href={credit.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex h-full items-center gap-4 rounded-lg border border-line bg-panel p-4 text-sm text-white/75 transition duration-300 hover:-translate-y-0.5 hover:border-gold/60 hover:text-gold"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-line bg-bg/60">
                      <img src={credit.icon} alt="" className="h-7 w-7 object-contain transition group-hover:scale-110" />
                    </span>
                    {credit.label}
                  </a>
                </li>
              ))}
            </ul>
          </Container>
        </Reveal>
      </section>
    </>
  )
}
