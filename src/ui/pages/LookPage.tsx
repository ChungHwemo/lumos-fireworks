import { useMemo } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { decoratedSpots, festivalById } from "../../data/catalog.ts";
import { lookAtLaunch } from "../../domain/look-at.ts";
import { spotNameEn } from "../content.ts";
import { NamePair, festivalTitle } from "../display.tsx";
import { LookViewer } from "../look/LookViewer.tsx";
import { useLang } from "../Lang.tsx";

export function LookPage() {
  const { festivalId = "", spotId = "" } = useParams();
  const { lang, t } = useLang();
  const festival = festivalById(festivalId);
  const spots = useMemo(() => decoratedSpots(festivalId), [festivalId]);
  const spot = spots.find((row) => row.id === spotId);

  if (!festival) return <Navigate to="/" replace />;
  if (!spot) return <Navigate to={`/e/${festivalId}`} replace />;

  const view = lookAtLaunch(spot, festival.launch);
  const water = /海|湖|ビーチ|湾/.test(`${festival.venueJa}${festival.venueKo}`);
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
      <article className="sheet">
        <Link className="back" to={`/e/${festival.id}/p/${spot.id}`}>
          ←{" "}
          <NamePair
            ko={spot.nameKo}
            ja={spot.nameJa}
            en={spotNameEn(spot.id, spot.nameJa)}
            lang={lang}
          />
        </Link>
        <h1>{t.look3d}</h1>
        <p className="disclaimer">{t.unofficial} {t.look3dNote}</p>
        <p>
          <NamePair
            ko={spot.nameKo}
            ja={spot.nameJa}
            en={spotNameEn(spot.id, spot.nameJa)}
            lang={lang}
          />
          {" → "}
          <NamePair ko={festival.nameKo} ja={festival.nameJa} en={fest.en} lang={lang} />
        </p>
        {view && (
          <dl className="cells">
            <div>
              <dt>{t.crowFly}</dt>
              <dd>
                {view.distanceMeters}
                {t.meters}
              </dd>
            </div>
            <div>
              <dt>{t.bearing}</dt>
              <dd>{view.bearingDeg}°</dd>
            </div>
            <div>
              <dt>{t.pitch}</dt>
              <dd>{view.pitchDeg}°</dd>
            </div>
          </dl>
        )}
      </article>
    </div>
  );
}
