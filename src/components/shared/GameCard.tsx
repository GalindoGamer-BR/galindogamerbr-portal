import type { Game } from '../../data/games'
import { useTilt } from '../../hooks/useTilt'

// A arte é exibida inteira (object-contain sobre fundo escuro) — igual ao
// site atual, que corrigiu explicitamente um bug de "cover" cortando as artes.
// `fallbackImage`: usada enquanto o jogo não tem arte própria (game.image vazio), ex.: a miniatura do vídeo mais recente.
export function GameCard({ game, fallbackImage }: { game: Game; fallbackImage?: string }) {
  const tiltRef = useTilt<HTMLAnchorElement>()
  const image = game.image || fallbackImage

  return (
    <a
      ref={tiltRef}
      href={game.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col overflow-hidden rounded-lg border border-gold/30 bg-panel shadow-[0_0_0_4px_#070b10] transition-colors hover:border-gold/60"
    >
      <div className="flex min-h-[190px] items-center justify-center bg-[#070b10] p-3">
        {image ? (
          <img src={image} alt={game.title} width={1672} height={941} loading="lazy" className="w-full object-contain" />
        ) : (
          <div className="aspect-video w-full" aria-hidden="true" />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex items-center gap-2">
          {game.icon && (
            <img src={game.icon} alt="" width={20} height={20} loading="lazy" className="h-5 w-5 shrink-0 object-contain" />
          )}
          <span className="text-xs font-semibold uppercase tracking-widest text-gold">{game.tag}</span>
        </div>
        <h3 className="text-xl">{game.title}</h3>
        <p className="flex-1 text-sm text-muted">{game.description}</p>
        <span className="text-sm font-semibold text-white/70 group-hover:text-gold">Ver playlist</span>
      </div>
    </a>
  )
}
