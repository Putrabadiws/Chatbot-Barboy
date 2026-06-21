import { MapPin, Clock, ArrowUpRight } from "lucide-react";
import {
  isSafeHttpUrl,
  type CardData,
  type MenuCard,
  type OutletCard,
  type PromoCard,
} from "@/lib/cards";

// Rich card renderers for live menu / outlet / promo data. Data arrives as a
// message annotation (see lib/cards.ts) and is rendered below the bot's text.
// Palette follows the existing brand: lime #96c93d accents, slate surfaces.

const LIME = "#96c93d";

export function Cards({ cards }: { cards: CardData[] }) {
  if (cards.length === 0) return null;
  return (
    <div className="mt-3 space-y-4">
      {cards.map((card, i) => {
        if (card.type === "menu") return <MenuCards key={i} card={card} />;
        if (card.type === "outlet") return <OutletCards key={i} card={card} />;
        return <PromoCards key={i} card={card} />;
      })}
    </div>
  );
}

function MenuCards({ card }: { card: MenuCard }) {
  return (
    <div className="space-y-3">
      {card.categories.map((cat) => (
        <div key={cat.category}>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            {cat.category}
          </p>
          {/* Horizontal scroll so a long category never blows up the bubble */}
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
            {cat.items.map((item) => (
              <div
                key={item.name}
                className="flex-shrink-0 w-36 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm"
              >
                {item.image ? (
                  // Plain <img> to match the rest of the app (no next/image)
                  <img
                    src={item.image}
                    alt={item.name}
                    loading="lazy"
                    className="w-full h-24 object-cover bg-slate-100"
                  />
                ) : (
                  <div className="w-full h-24 bg-slate-100 flex items-center justify-center text-slate-300 text-xs">
                    Burger Bangor
                  </div>
                )}
                <div className="p-2.5">
                  <p className="text-sm font-semibold text-slate-800 leading-tight">
                    {item.name}
                  </p>
                  {item.excerpt && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {item.excerpt}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function OutletCards({ card }: { card: OutletCard }) {
  return (
    <div className="space-y-2">
      {card.stores.map((store, i) => (
        <div
          key={`${store.name}-${i}`}
          className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800">
                {store.name}
              </p>
              {store.city && (
                <p className="text-xs text-slate-500">{store.city}</p>
              )}
            </div>
            <div className="flex flex-shrink-0 items-center gap-1.5">
              {typeof store.distanceKm === "number" && (
                <span
                  className="text-xs font-semibold text-white px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: LIME }}
                >
                  ~{store.distanceKm} km
                </span>
              )}
              {store.is24h && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                  <Clock className="w-3 h-3" />
                  24 jam
                </span>
              )}
            </div>
          </div>
          {store.address && (
            <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">
              {store.address}
            </p>
          )}
          {isSafeHttpUrl(store.mapsLink) && (
            <a
              href={store.mapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-2 text-sm font-semibold"
              style={{ color: LIME }}
            >
              <MapPin className="w-4 h-4" />
              Buka Maps
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

function PromoCards({ card }: { card: PromoCard }) {
  return (
    <div className="space-y-3">
      {card.promos.map((promo, i) => (
        <div
          key={`${promo.title}-${i}`}
          className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm"
        >
          {promo.image && (
            <img
              src={promo.image}
              alt={promo.title}
              loading="lazy"
              className="w-full h-32 object-cover bg-slate-100"
            />
          )}
          <div className="p-3">
            <p className="text-sm font-semibold text-slate-800">
              {promo.title}
            </p>
            {promo.description && (
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                {promo.description}
              </p>
            )}
            {promo.validUntil && (
              <p className="text-xs text-slate-400 mt-1">
                Berlaku s/d {promo.validUntil}
              </p>
            )}
            {isSafeHttpUrl(promo.ctaUrl) && (
              <a
                href={promo.ctaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 text-white text-sm font-semibold rounded-lg transition-colors"
                style={{ backgroundColor: LIME }}
              >
                {promo.ctaLabel ?? "Lihat Promo"}
                <ArrowUpRight className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
