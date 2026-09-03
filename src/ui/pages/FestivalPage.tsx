import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  controlsFor,
  decoratedSpots,
  festivalById,
  seatsFor,
  seriesDates,
} from "../../data/catalog.ts";
import { isFestivalDay } from "../../domain/festival.ts";
import { weekday } from "../i18n.ts";
import { useLang } from "../Lang.tsx";
import { FestivalMap } from "../map/FestivalMap.tsx";
import type { GsiLayer } from "../map/gsi-style.ts";
import { shareUrl } from "../share.ts";

export function FestivalPage() {
  const { festivalId = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { lang, t, setLang } = useLang();
  const festival = festivalById(festivalId);
  const tab = params.get("tab") ?? "event";
  const layer = (params.get("map") === "std" ? "std" : "pale") as GsiLayer;
  const showControls = params.get("ctl") !== "0";
  const [toast, setToast] = useState("");

  const spots = useMemo(() => decoratedSpots(festivalId), [festivalId]);
  const controls = useMemo(() => controlsFor(festivalId), [festivalId]);
  const seats = useMemo(() => seatsFor(festivalId), [festivalId]);
  const dates = festival ? seriesDates(festival.seriesId) : [];

  if (!festival) return <Navigate to="/" replace />;

  const setTab = (next: string) => {
    params.set("tab", next);
    setParams(params, { replace: true });
  };

  return (
    <div className="split">
      <FestivalMap
        launch={festival.launch}
        spots={spots}
        controls={controls}
        showControls={showControls && tab !== "settings"}
        showSpots={tab !== "settings"}
        layer={layer}
        onSelect={(id) => navigate(`/e/${festival.id}/p/${id}`)}
      />
      <section className="sheet">
        <Link className="back" to="/">
          ← {t.back}
        </Link>
        <p className="kicker">
          {festival.date} ({weekday(festival.date, lang)}) · {festival.startTime}–
          {festival.endTime}
          {isFestivalDay(festival, new Date()) ? " · TODAY" : ""}
        </p>
        <h1>
          {festival.nameKo} <span lang="ja">{festival.nameJa}</span>
        </h1>
        <p className="disclaimer">{festival.disclaimerKo}</p>
        <nav className="tabs" aria-label="sections">
          <button type="button" aria-current={tab === "event" ? "true" : undefined} onClick={() => setTab("event")}>
            {t.tabEvent}
          </button>
          <button type="button" aria-current={tab === "spots" ? "true" : undefined} onClick={() => setTab("spots")}>
            {t.tabSpots}
          </button>
          <button type="button" aria-current={tab === "settings" ? "true" : undefined} onClick={() => setTab("settings")}>
            {t.tabSettings}
          </button>
        </nav>

        {tab === "event" && (
          <div className="stack">
            <p>
              <strong>{t.venue}</strong> {festival.venueKo}{" "}
              <span lang="ja">{festival.venueJa}</span>
            </p>
            <p>
              <strong>{t.station}</strong> {festival.nearestStationKo}
            </p>
            <p>
              <strong>{t[rainKey(festival.rainPolicy)]}</strong> — {festival.rainNoteKo}
            </p>
            {festival.shellsApprox != null && (
              <p>
                <strong>{t.shells}</strong> {festival.shellsApprox.toLocaleString(lang)}
              </p>
            )}
            {seats.map((seat) => (
              <p key={seat.zoneKo}>
                <strong>{t.paidSeats}</strong> {seat.zoneKo}
                {seat.priceJpy != null ? ` · ¥${seat.priceJpy.toLocaleString()}` : ""}
                <br />
                {seat.noteKo}
                {seat.ticketUrl && (
                  <>
                    {" "}
                    <a href={seat.ticketUrl} rel="noreferrer" target="_blank">
                      {t.official}
                    </a>
                  </>
                )}
              </p>
            ))}
            <p>
              <a href={festival.officialUrl} rel="noreferrer" target="_blank">
                {t.official}
              </a>
            </p>
            {dates.length > 1 && (
              <div>
                <h2>{t.moreDates}</h2>
                <ul className="dates">
                  {dates.map((row) => (
                    <li key={row.id}>
                      <Link to={`/e/${row.id}`}>{row.date}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <h2>{t.spotsPreview}</h2>
            {spots.length === 0 ? (
              <p>{t.noSpots}</p>
            ) : (
              <ol className="spot-list">
                {spots.slice(0, 4).map((spot) => (
                  <li key={spot.id}>
                    <Link to={`/e/${festival.id}/p/${spot.id}`}>
                      <SpotLine spot={spot} t={t} />
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}

        {tab === "spots" && (
          <div className="stack">
            <div className="toggles">
              <label>
                <input
                  type="checkbox"
                  checked={showControls}
                  onChange={(e) => {
                    params.set("ctl", e.target.checked ? "1" : "0");
                    setParams(params, { replace: true });
                  }}
                />
                {t.overlayControls}
              </label>
            </div>
            {spots.length === 0 ? (
              <p>{t.noSpots}</p>
            ) : (
              <ol className="spot-list">
                {spots.map((spot) => (
                  <li key={spot.id}>
                    <Link to={`/e/${festival.id}/p/${spot.id}`}>
                      <SpotLine spot={spot} t={t} />
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}

        {tab === "settings" && (
          <div className="stack">
            <p>
              <strong>{t.lang}</strong>
              <br />
              <button type="button" onClick={() => setLang("ko")} aria-pressed={lang === "ko"}>
                한국어
              </button>{" "}
              <button type="button" onClick={() => setLang("en")} aria-pressed={lang === "en"}>
                English
              </button>
            </p>
            <p>
              <strong>{t.overlaySpots}</strong>
              <br />
              <button
                type="button"
                onClick={() => {
                  params.set("map", "pale");
                  setParams(params, { replace: true });
                }}
                aria-pressed={layer === "pale"}
              >
                {t.mapPale}
              </button>{" "}
              <button
                type="button"
                onClick={() => {
                  params.set("map", "std");
                  setParams(params, { replace: true });
                }}
                aria-pressed={layer === "std"}
              >
                {t.mapStd}
              </button>
            </p>
            <p>{t.no3d}</p>
            <p>
              {t.gsiCredit}{" "}
              <a href="https://maps.gsi.go.jp/development/ichiran.html" rel="noreferrer" target="_blank">
                地理院タイル
              </a>
            </p>
            <button
              type="button"
              className="primary"
              onClick={async () => {
                const result = await shareUrl(
                  festival.nameKo,
                  t.shareCopy,
                  window.location.href,
                );
                if (result === "copied") setToast(t.copied);
              }}
            >
              {t.share}
            </button>
            {toast && <p role="status">{toast}</p>}
          </div>
        )}
      </section>
    </div>
  );
}

function rainKey(policy: string) {
  return {
    hold: "rainHold",
    cancel: "rainCancel",
    postpone: "rainPostpone",
    unknown: "rainUnknown",
  }[policy] as "rainHold" | "rainCancel" | "rainPostpone" | "rainUnknown";
}

function SpotLine({
  spot,
  t,
}: {
  spot: ReturnType<typeof decoratedSpots>[number];
  t: ReturnType<typeof useLang>["t"];
}) {
  const label =
    spot.badge === "blocked"
      ? t.badgeBlocked
      : spot.badge === "paid"
        ? t.badgePaid
        : spot.badge === "vehicle"
          ? t.badgeVehicle
          : null;
  return (
    <>
      <strong>
        {spot.nameKo} <span lang="ja">{spot.nameJa}</span>
      </strong>
      <span className="meta">
        {spot.distanceMeters != null ? `${spot.distanceMeters}${t.meters}` : "—"}
        {label ? ` · ${label}` : ""}
      </span>
    </>
  );
}
