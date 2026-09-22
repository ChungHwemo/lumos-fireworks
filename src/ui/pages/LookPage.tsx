import { useMemo } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { decoratedSpots, festivalById } from "../../data/catalog.ts";
import { lookAtLaunch } from "../../domain/look-at.ts";
import { NamePair, festivalTitle } from "../display.tsx";
import { Icon } from "../Icon.tsx";
import { spotName } from "../labels.ts";
import { useLang } from "../Lang.tsx";
import { LookViewer } from "../look/LookViewer.tsx";
import { Sheet } from "../Sheet.tsx";
import { useDocumentTitle } from "../useDocumentTitle.ts";

const WATER_VENUE = /海|湖|ビーチ|湾/;

export function LookPage() {
  const { festivalId = "", spotId = "" } = useParams();
  const { lang, t } = useLang();
  const festival = festivalById(festivalId);
  const spots = useMemo(() => decoratedSpots(festivalId), [festivalId]);
  const spot = spots.find((row) => row.id === spotId);
  useDocumentTitle(spot ? `${t.look3d} · ${spotName(spot, lang)}` : null);

  if (!festival) return <Navigate to="/" replace />;
  if (!spot) return <Navigate to={`/e/${festivalId}`} replace />;

  const view = lookAtLaunch(spot, festival.launch);
  const water = WATER_VENUE.test(`${festival.venueJa}${festival.venueKo}`);
  const fest = festivalTitle(festival, lang);

  return (
    <div className="split">
      {festival.launch && view ? (
        <LookViewer from={spot} launch={festival.launch} water={water} label={t.look3d} />
      ) : (
        <div className="look look-empty">
          <p>{t.lookNeedLaunch}</p>
        </div>
      )}
      <Sheet as="article" ariaLabel={t.look3d}>
        <header className="sheet-head">
          <Link className="icon-btn" to={`/e/${festival.id}/p/${spot.id}`} aria-label={spotName(spot, lang)}>
            <Icon name="chevron-left" />
          </Link>
          <div className="sheet-title">
            <p className="kicker">{fest.primary}</p>
            <h1>{t.look3d}</h1>
          </div>
        </header>
        <p className="lede">
          <NamePair ko={spot.nameKo} ja={spot.nameJa} en={spotName(spot, "en")} lang={lang} />
          {" → "}
          <NamePair ko={festival.nameKo} ja={festival.nameJa} en={fest.en} lang={lang} />
        </p>
        <p className="disclaimer">
          {t.unofficial} {t.look3dNote}
        </p>
        {view && (
          <dl className="info-grid">
            <div className="info-card">
              <dt>
                <Icon name="spark" size={15} /> {t.crowFly}
              </dt>
              <dd>
                {view.distanceMeters.toLocaleString()}
                {t.meters}
              </dd>
            </div>
            <div className="info-card">
              <dt>
                <Icon name="navigate" size={15} /> {t.bearing}
              </dt>
              <dd>{view.bearingDeg}°</dd>
            </div>
            <div className="info-card">
              <dt>
                <Icon name="eye" size={15} /> {t.pitch}
              </dt>
              <dd>{view.pitchDeg}°</dd>
            </div>
          </dl>
        )}
      </Sheet>
    </div>
  );
}
