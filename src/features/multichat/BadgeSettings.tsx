import { isBadgeHidden, platformBadges, type BadgePlatform } from "./badgeDefs";
import { PlatformBadge } from "./PlatformBadge";
import { PlatformIcon } from "./PlatformIcon";
import { labels, type Platform } from "./types";

// Escolha dos selos exibidos no chat. Só aparecem as plataformas com conta vinculada; o que for desligado some das
// mensagens de todas as pessoas daquela plataforma, só para quem desligou.
export function BadgeSettings({
  platforms,
  hidden,
  onToggle,
}: {
  platforms: Platform[];
  hidden: readonly string[];
  onToggle: (platform: Platform, id: string) => void;
}) {
  const linked = platforms.filter((p): p is BadgePlatform => p in platformBadges);
  return (
    <section className="mc-badge-settings" aria-label="Selos no chat">
      <h3>Selos no chat</h3>
      {!linked.length && <p className="mc-muted">Conecte uma conta para escolher os selos de cada plataforma.</p>}
      {linked.map((platform) => (
        <div className="mc-badge-group" key={platform}>
          <strong><PlatformIcon platform={platform} />{labels[platform]}</strong>
          <div className="mc-badge-options">
            {platformBadges[platform].map((badge) => {
              const on = !isBadgeHidden(hidden, platform, badge.id);
              return (
                <button key={badge.id} type="button" className="mc-badge-option" aria-pressed={on} onClick={() => onToggle(platform, badge.id)}>
                  <PlatformBadge platform={platform} id={badge.id} />
                  {badge.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}
