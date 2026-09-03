import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  controlsFor,
  decoratedSpots,
  festivalById,
  seatsFor,
  seriesDates,
} from "../../data/catalog.ts";
import { loadReports } from "../../data/reports.ts";
import { areaLabel, festivalArea } from "../../domain/area.ts";
import { isFestivalDay } from "../../domain/festival.ts";
import { festivalStationPoint } from "../../domain/station.ts";
import { crowdHeat, listReports } from "../../domain/report.ts";
import { filterSpotsByText } from "../../domain/spot.ts";
import { SEAT_COPY, spotNameEn } from "../content.ts";
import {
  NamePair,
  festivalRainNote,
  festivalStationPair,
  festivalTitle,
  festivalVenue,
} from "../display.tsx";
import { localeTag, weekday } from "../i18n.ts";
import { useLang } from "../Lang.tsx";
import { LangSwitch } from "../LangSwitch.tsx";
import { FestivalMap } from "../map/FestivalMap.tsx";
import type { GsiLayer } from "../map/gsi-style.ts";
import { parseShareCoord } from "../share.ts";
import { ShareButton } from "../ShareButton.tsx";
import { ReportForm, reportKindLabel } from "./ReportForm.tsx";

export function FestivalPage() {
  const { festivalId = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { lang, t } = useLang();
  const festival = festivalById(festivalId);
  const title = festival ? festivalTitle(festival, lang) : null;
  const tab = params.get("tab") ?? "event";
  const layer = (params.get("map") === "std" ? "std" : "pale") as GsiLayer;
  const showControls = params.get("ctl") !== "0";
  const showCrowd = params.get("crowd") !== "0";
  const showFireworks = params.get("fw") !== "0";
  const sharePin = parseShareCoord(params);
  const [q, setQ] = useState("");
  const [reports, setReports] = useState(loadReports);

  const spots = useMemo(() => decoratedSpots(festivalId), [festivalId]);
  const visibleSpots = useMemo(() => filterSpotsByText(spots, q), [spots, q]);
  const controls = useMemo(() => controlsFor(festivalId), [festivalId]);
  const seats = useMemo(() => seatsFor(festivalId), [festivalId]);
  const dates = festival ? seriesDates(festival.seriesId) : [];
  const festivalReports = useMemo(
    () => listReports(reports, { festivalId }),
    [reports, festivalId],
  );
  const heat = useMemo(
    () => crowdHeat(spots, festivalReports),
    [spots, festivalReports],
  );

  if (!festival) return <Navigate to="/" replace />;

  const setTab = (next: string) => {
    params.set("tab", next);
    setParams(params, { replace: true });
  };

  const area = festivalArea(festival);
  const station = festivalStationPoint(festival);
  const stationNames = festivalStationPair(festival);
  const pin = festival.launch ?? spots[0] ?? area.coord;

  return (
    <div className="split">
      <FestivalMap
        key={festival.id}
        launch={festival.launch}
        area={area}
        station={station?.coord}
        spots={visibleSpots}
        controls={controls}
        sharePin={sharePin}
        heat={heat}
        showControls={showControls && tab !== "settings"}
        showSpots={tab !== "settings"}
        showCrowd={showCrowd && tab !== "settings"}
        fireworks={showFireworks}
        fireworksSeed={festival.id}
        layer={layer}
        onSelect={(id) => navigate(`/e/${festival.id}/p/${id}`)}
        labels={{
          launch: t.pinLaunch,
          share: t.pinShare,
          mapAria: t.mapAria,
          launchAria: t.launch,
          shareAria: t.share,
          approx: t.pinLaunchUnknown,
          approxAria: areaLabel(area, lang),
          station: t.pinStation,
          stationAria: stationNames[lang],
          spotName: (spot) =>
            lang === "ja" ? spot.nameJa : lang === "en" ? spotNameEn(spot.id, spot.nameJa) : spot.nameKo,
        }}
        onMapClick={(coord) => {
          params.set("lng", coord.lng.toFixed(5));
          params.set("lat", coord.lat.toFixed(5));
          setParams(params, { replace: true });
        }}
      />
      <section className="sheet">
        <Link className="back" to="/">
          ← {t.back}
        </Link>
        <p className="kicker">
          {festival.dateEnd
            ? `${festival.date}–${festival.dateEnd}`
            : `${festival.date} (${weekday(festival.date, lang)})`}{" "}
          · {festival.startTime}–{festival.endTime}
          {isFestivalDay(festival, new Date()) ? ` · ${t.today}` : ""}
        </p>
        <h1>
          <NamePair ko={festival.nameKo} ja={festival.nameJa} en={title?.en} lang={lang} />
        </h1>
        <p className="disclaimer">
          {t.unofficial}
          {festival.launch ? ` ${t.launchEstimate}` : ` ${t.areaApprox}`}
        </p>
        <nav className="tabs">
          <Tab current={tab} id="event" onClick={setTab}>
            {t.tabEvent}
          </Tab>
          <Tab current={tab} id="spots" onClick={setTab}>
            {t.tabSpots}
          </Tab>
          <Tab current={tab} id="reports" onClick={setTab}>
            {t.tabReports}
          </Tab>
          <Tab current={tab} id="settings" onClick={setTab}>
            {t.tabSettings}
          </Tab>
        </nav>

        {tab === "event" && (
          <div className="stack">
            <ShareButton title={title?.primary ?? festival.nameKo} />
            <p>
              <strong>{t.venue}</strong>{" "}
              <NamePair
                ko={festival.venueKo}
                ja={festival.venueJa}
                en={festivalVenue(festival, lang).en}
                lang={lang}
              />
              {area.precision === "city" || area.precision === "prefecture"
                ? ` · ${areaLabel(area, lang)}`
                : ""}
            </p>
            <p>
              <strong>{t.station}</strong>{" "}
              <NamePair
                ko={stationNames.ko}
                ja={stationNames.ja}
                en={stationNames.en}
                lang={lang}
              />
            </p>
            <p>
              <strong>{t[rainKey(festival.rainPolicy)]}</strong> — {festivalRainNote(festival, lang)}
            </p>
            {festival.shellsApprox != null && (
              <p>
                <strong>{t.shells}</strong> {festival.shellsApprox.toLocaleString(localeTag[lang])}
              </p>
            )}
            {seats.map((seat) => {
              const copy = SEAT_COPY[festival.id];
              return (
              <p key={seat.zoneKo}>
                <strong>{t.paidSeats}</strong> {copy?.zone[lang] ?? seat.zoneKo}
                {seat.priceJpy != null ? ` · ¥${seat.priceJpy.toLocaleString(localeTag[lang])}` : ""}
                <br />
                {copy?.note[lang] ?? seat.noteKo}
                {seat.ticketUrl && (
                  <>
                    {" "}
                    <a href={seat.ticketUrl} rel="noreferrer" target="_blank">
                      {t.official}
                    </a>
                  </>
                )}
              </p>
              );
            })}
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
                      <SpotLine spot={spot} t={t} lang={lang} />
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}

        {tab === "spots" && (
          <div className="stack">
            <ShareButton title={title?.primary ?? festival.nameKo} />
            <label>
              {t.searchSpots}
              <input
                type="search"
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder={t.searchSpots}
              />
            </label>
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
              <label>
                <input
                  type="checkbox"
                  checked={showCrowd}
                  onChange={(e) => {
                    params.set("crowd", e.target.checked ? "1" : "0");
                    setParams(params, { replace: true });
                  }}
                />
                {t.overlayCrowd}
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={showFireworks}
                  onChange={(e) => {
                    params.set("fw", e.target.checked ? "1" : "0");
                    setParams(params, { replace: true });
                  }}
                />
                {t.overlayFireworks}
              </label>
            </div>
            <p className="note">{t.notLiveCrowd}</p>
            {visibleSpots.length === 0 ? (
              <p>{t.noSpots}</p>
            ) : (
              <ol className="spot-list">
                {visibleSpots.map((spot) => (
                  <li key={spot.id}>
                    <Link to={`/e/${festival.id}/p/${spot.id}`}>
                      <SpotLine spot={spot} t={t} lang={lang} />
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}

        {tab === "reports" && (
          <div className="stack">
            <p className="note">{t.reportLocal}</p>
            <ReportForm
              festivalId={festival.id}
              spotId={null}
              lng={pin.lng}
              lat={pin.lat}
              onSaved={setReports}
            />
            {festivalReports.length === 0 ? (
              <p>{t.reportEmpty}</p>
            ) : (
              <ol className="report-list">
                {festivalReports.map((report) => (
                  <li key={report.id}>
                    <strong>{reportKindLabel(report.kind, t)}</strong>
                    <p>{report.body}</p>
                    <p className="meta">{report.createdAt}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}

        {tab === "settings" && (
          <div className="stack">
            <LangSwitch />
            <p>{t.no3d}</p>
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
            <p>
              {t.gsiCredit}{" "}
              <a href="https://maps.gsi.go.jp/development/ichiran.html" rel="noreferrer" target="_blank">
                地理院タイル
              </a>
            </p>
            <ShareButton title={title?.primary ?? festival.nameKo} />
          </div>
        )}
      </section>
    </div>
  );
}

function Tab({
  current,
  id,
  onClick,
  children,
}: {
  current: string;
  id: string;
  onClick: (id: string) => void;
  children: string;
}) {
  const on = current === id;
  return (
    <button
      type="button"
      aria-current={on ? "page" : undefined}
      onClick={() => onClick(id)}
    >
      {children}
    </button>
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
  lang,
}: {
  spot: ReturnType<typeof decoratedSpots>[number];
  t: ReturnType<typeof useLang>["t"];
  lang: ReturnType<typeof useLang>["lang"];
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
        <NamePair ko={spot.nameKo} ja={spot.nameJa} en={spotNameEn(spot.id, spot.nameJa)} lang={lang} />
      </strong>
      <span className="meta">
        {spot.distanceMeters != null ? `${spot.distanceMeters}${t.meters}` : "—"}
        {label ? ` · ${label}` : ""}
      </span>
    </>
  );
}
