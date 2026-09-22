import { useCallback, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  controlsFor,
  decoratedSpots,
  festivalById,
  seatsFor,
  seriesDates,
  type DecoratedSpot,
} from "../../data/catalog.ts";
import { loadReports } from "../../data/reports.ts";
import { areaLabel, festivalArea, festivalPlace } from "../../domain/area.ts";
import { isFestivalDay } from "../../domain/festival.ts";
import { crowdHeat, listReports } from "../../domain/report.ts";
import { filterSpotsByText } from "../../domain/spot.ts";
import { festivalStationPoint } from "../../domain/station.ts";
import type { Coord } from "../../domain/types.ts";
import { festivalIcs, icsDataUrl } from "../calendar.ts";
import { SEAT_COPY } from "../content.ts";
import {
  NamePair,
  festivalRainNote,
  festivalStationPair,
  festivalTitle,
  festivalVenue,
} from "../display.tsx";
import { localeTag, weekday, type Dict, type Lang } from "../i18n.ts";
import { Icon } from "../Icon.tsx";
import { badgeLabel, dateRange, rainLabel, reportKindLabel, spotName } from "../labels.ts";
import { useLang } from "../Lang.tsx";
import { LangSwitch } from "../LangSwitch.tsx";
import { FestivalMap } from "../map/FestivalMap.tsx";
import { parseMapStyle, type MapStyleId } from "../map/gsi-style.ts";
import { MapChips } from "../map/MapChips.tsx";
import { MapLegend } from "../map/MapLegend.tsx";
import { flag, useUpdateParams } from "../searchParams.ts";
import { parseCoordPair } from "../share.ts";
import { ShareButton } from "../ShareButton.tsx";
import { Sheet } from "../Sheet.tsx";
import { useDocumentTitle } from "../useDocumentTitle.ts";
import { ReportForm } from "./ReportForm.tsx";

const TABS = ["event", "spots", "reports", "settings"] as const;
type TabId = (typeof TABS)[number];

function parseTab(raw: string | null): TabId {
  return (TABS as readonly string[]).includes(raw ?? "") ? (raw as TabId) : "event";
}

export function FestivalPage() {
  const { festivalId = "" } = useParams();
  const [params] = useSearchParams();
  const update = useUpdateParams();
  const navigate = useNavigate();
  const { lang, t } = useLang();
  const festival = festivalById(festivalId);
  const title = festival ? festivalTitle(festival, lang) : null;
  useDocumentTitle(title?.primary);

  const tab = parseTab(params.get("tab"));
  const mapStyleId = parseMapStyle(params.get("map"));
  const showControls = flag(params, "ctl", true);
  const showCrowd = flag(params, "crowd", true);
  const showFireworks = flag(params, "fw", true);
  // 문자열 두 개를 키로 메모한다. params 객체는 렌더마다 새로워 지도가 매번 다시 그려진다.
  const lngRaw = params.get("lng");
  const latRaw = params.get("lat");
  const sharePin = useMemo(() => parseCoordPair(lngRaw, latRaw), [lngRaw, latRaw]);
  const [q, setQ] = useState("");
  const [reports, setReports] = useState(loadReports);

  const spots = useMemo(() => decoratedSpots(festivalId), [festivalId]);
  const visibleSpots = useMemo(() => filterSpotsByText(spots, q), [spots, q]);
  const controls = useMemo(() => controlsFor(festivalId), [festivalId]);
  const seats = useMemo(() => seatsFor(festivalId), [festivalId]);
  const dates = useMemo(() => (festival ? seriesDates(festival.seriesId) : []), [festival]);
  const festivalReports = useMemo(
    () => listReports(reports, { festivalId }),
    [reports, festivalId],
  );
  const heat = useMemo(() => crowdHeat(spots, festivalReports), [spots, festivalReports]);
  const area = useMemo(() => (festival ? festivalArea(festival) : null), [festival]);
  const onSelect = useCallback(
    (id: string) => navigate(`/e/${festivalId}/p/${id}`),
    [navigate, festivalId],
  );
  const onMapClick = useCallback(
    (coord: Coord) => update({ lng: coord.lng.toFixed(5), lat: coord.lat.toFixed(5) }),
    [update],
  );
  const onToggle = useCallback(
    (key: "ctl" | "crowd" | "fw", on: boolean) => update({ [key]: on ? "1" : "0" }),
    [update],
  );
  const onStyle = useCallback(
    (next: MapStyleId) => update({ map: next === "night" ? null : next }),
    [update],
  );

  if (!festival || !area) return <Navigate to="/" replace />;

  const station = festivalStationPoint(festival);
  const stationNames = festivalStationPair(festival);
  const pin = festival.launch ?? spots[0] ?? area.coord;
  const inSettings = tab === "settings";
  const todayTag = isFestivalDay(festival, new Date());
  // 「비 와도 진행 — 비 와도 진행.」처럼 태그와 같은 말이면 메모를 생략한다.
  const rainNoteRaw = festivalRainNote(festival, lang);
  const rainNote =
    rainNoteRaw.replace(/[.。]\s*$/, "") === rainLabel(festival.rainPolicy, t) ? "" : rainNoteRaw;
  const ics = icsDataUrl(
    festivalIcs({
      id: festival.id,
      date: festival.date,
      startTime: festival.startTime,
      endTime: festival.endTime,
      officialUrl: festival.officialUrl,
      venueJa: festival.venueJa,
      title: title?.primary ?? festival.nameKo,
      description: `${rainLabel(festival.rainPolicy, t)} — ${festivalRainNote(festival, lang)}. ${t.unofficial}`,
      location: `${festivalVenue(festival, lang).primary}, ${festivalPlace(festival, lang)}`,
      launch: festival.launch,
    }),
  );

  return (
    <div className="split">
      <FestivalMap
        key={festival.id}
        launch={festival.launch}
        area={area}
        station={station}
        spots={visibleSpots}
        controls={controls}
        sharePin={sharePin}
        heat={heat}
        showControls={showControls && !inSettings}
        showSpots={!inSettings}
        showCrowd={showCrowd && !inSettings}
        fireworks={showFireworks}
        fireworksSeed={festival.id}
        style={mapStyleId}
        onSelect={onSelect}
        onMapClick={onMapClick}
      />
      <MapLegend />
      <MapChips
        controls={showControls}
        crowd={showCrowd}
        fireworks={showFireworks}
        style={mapStyleId}
        onToggle={onToggle}
        onStyle={onStyle}
      />
      <Sheet ariaLabel={t.eventInfo}>
        <header className="sheet-head">
          <Link className="icon-btn" to="/" aria-label={t.back}>
            <Icon name="chevron-left" />
          </Link>
          <div className="sheet-title">
            <p className="kicker">{festivalPlace(festival, lang)}</p>
            <h1>
              <NamePair ko={festival.nameKo} ja={festival.nameJa} en={title?.en} lang={lang} />
            </h1>
          </div>
        </header>

        <ul className="meta-list">
          <li>
            <Icon name="calendar" />
            <span>
              {dateRange(festival, (date) => weekday(date, lang))}
              {todayTag && <span className="tag tag-live">{t.today}</span>}
            </span>
          </li>
          <li>
            <Icon name="clock" />
            <span>
              {festival.startTime}–{festival.endTime} <span className="dim">Asia/Tokyo</span>
            </span>
          </li>
          <li>
            <Icon name="pin" />
            <span>
              <NamePair
                ko={festival.venueKo}
                ja={festival.venueJa}
                en={festivalVenue(festival, lang).en}
                lang={lang}
              />
              {area.precision === "city" || area.precision === "prefecture"
                ? ` · ${areaLabel(area, lang)}`
                : ""}
            </span>
          </li>
          <li>
            <Icon name="train" />
            <span>
              <NamePair ko={stationNames.ko} ja={stationNames.ja} en={stationNames.en} lang={lang} />
            </span>
          </li>
          <li>
            <Icon name="umbrella" />
            <span>
              <span className={`tag tag-rain-${festival.rainPolicy}`}>
                {rainLabel(festival.rainPolicy, t)}
              </span>
              {rainNote ? ` ${rainNote}` : ""}
            </span>
          </li>
          {festival.shellsApprox != null && (
            <li>
              <Icon name="spark" />
              <span>
                {t.shells} {festival.shellsApprox.toLocaleString(localeTag[lang])}
              </span>
            </li>
          )}
        </ul>

        <div className="action-row">
          <button type="button" className="pill pill-primary" onClick={() => update({ tab: "spots" })}>
            <Icon name="eye" size={15} /> {t.findSpots}
          </button>
          <a className="pill" href={festival.officialUrl} rel="noreferrer" target="_blank">
            <Icon name="external" size={15} /> {t.official}
          </a>
          <a className="pill" href={ics} download={`${festival.id}.ics`}>
            <Icon name="calendar" size={15} /> {t.addToCalendar}
          </a>
          <ShareButton variant="pill" title={title?.primary ?? festival.nameKo} />
        </div>

        <p className="disclaimer">
          {t.unofficial}
          {festival.launch ? ` ${t.launchEstimate}` : ` ${t.areaApprox}`}
        </p>

        <nav className="segmented tabs" aria-label={t.eventInfo}>
          {TABS.map((id) => (
            <button
              key={id}
              type="button"
              aria-current={tab === id ? "page" : undefined}
              onClick={() => update({ tab: id === "event" ? null : id })}
            >
              {id === "event"
                ? t.tabEvent
                : id === "spots"
                  ? t.tabSpots
                  : id === "reports"
                    ? t.tabReports
                    : t.tabSettings}
            </button>
          ))}
        </nav>

        {tab === "event" && (
          <div className="stack">
            {seats.length > 0 && (
              <section className="block">
                <h2>
                  <Icon name="ticket" size={16} /> {t.paidSeats}
                </h2>
                {seats.map((seat) => {
                  const copy = SEAT_COPY[festival.id];
                  return (
                    <p key={seat.zoneKo} className="seat">
                      <strong>{copy?.zone[lang] ?? seat.zoneKo}</strong>
                      {seat.priceJpy != null
                        ? ` · ¥${seat.priceJpy.toLocaleString(localeTag[lang])}`
                        : ""}
                      <br />
                      <span className="mute">{copy?.note[lang] ?? seat.noteKo}</span>
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
              </section>
            )}
            {dates.length > 1 && (
              <section className="block">
                <h2>
                  <Icon name="calendar" size={16} /> {t.moreDates}
                </h2>
                <ul className="dates">
                  {dates.map((row) => (
                    <li key={row.id}>
                      <Link
                        className="chip"
                        to={`/e/${row.id}`}
                        aria-current={row.id === festival.id ? "page" : undefined}
                      >
                        {row.date.slice(5).replace("-", "/")}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <section className="block">
              <div className="block-head">
                <h2>
                  <Icon name="eye" size={16} /> {t.spotsPreview}
                </h2>
                {spots.length > 4 && (
                  <button type="button" className="link-btn" onClick={() => update({ tab: "spots" })}>
                    {t.seeAll} <Icon name="chevron-right" size={14} />
                  </button>
                )}
              </div>
              {spots.length === 0 ? (
                <p className="mute">{t.noSpots}</p>
              ) : (
                <SpotList spots={spots.slice(0, 4)} all={spots} festivalId={festival.id} t={t} lang={lang} />
              )}
            </section>
          </div>
        )}

        {tab === "spots" && (
          <div className="stack">
            <label className="search">
              <Icon name="filter" size={16} />
              <span className="sr-only">{t.searchSpots}</span>
              <input
                type="search"
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder={t.searchSpots}
              />
            </label>
            <p className="note">{t.notLiveCrowd}</p>
            {visibleSpots.length === 0 ? (
              <p role="status" className="mute">
                {t.noSpots}
              </p>
            ) : (
              <SpotList spots={visibleSpots} all={visibleSpots} festivalId={festival.id} t={t} lang={lang} />
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
              <p className="mute">{t.reportEmpty}</p>
            ) : (
              <ol className="report-list">
                {festivalReports.map((report) => (
                  <li key={report.id}>
                    <span className="tag">{reportKindLabel(report.kind, t)}</span>
                    <p>{report.body}</p>
                    <p className="meta">
                      <time dateTime={report.createdAt}>
                        {new Date(report.createdAt).toLocaleString(localeTag[lang], {
                          timeZone: "Asia/Tokyo",
                        })}
                      </time>
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}

        {tab === "settings" && (
          <div className="stack">
            <LangSwitch />
            <div>
              <strong>{t.mapStyle}</strong>
              <div className="segmented" role="group" aria-label={t.mapStyle}>
                {(["night", "photo", "pale"] as const).map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onStyle(id)}
                    aria-pressed={mapStyleId === id}
                  >
                    {id === "night" ? t.mapNight : id === "photo" ? t.mapPhoto : t.mapPale}
                  </button>
                ))}
              </div>
            </div>
            <p className="note">{t.no3d}</p>
            <p className="note">
              {t.gsiCredit}{" "}
              <a href="https://maps.gsi.go.jp/development/ichiran.html" rel="noreferrer" target="_blank">
                地理院タイル
              </a>
            </p>
          </div>
        )}
      </Sheet>
    </div>
  );
}

function SpotList({
  spots,
  all,
  festivalId,
  t,
  lang,
}: {
  spots: DecoratedSpot[];
  /** 번호는 지도 핀과 같아야 한다. 전체 목록에서의 순서를 쓴다. */
  all: DecoratedSpot[];
  festivalId: string;
  t: Dict;
  lang: Lang;
}) {
  return (
    <ol className="spot-list">
      {spots.map((spot) => {
        const index = all.indexOf(spot) + 1;
        const label = badgeLabel(spot.badge, t);
        return (
          <li key={spot.id}>
            <Link to={`/e/${festivalId}/p/${spot.id}`}>
              <span className={`pin pin-${spot.badge ?? "open"} pin-static`} aria-hidden="true">
                {index}
              </span>
              <span className="spot-main">
                <strong>
                  <NamePair ko={spot.nameKo} ja={spot.nameJa} en={spotName(spot, "en")} lang={lang} />
                </strong>
                <span className="meta">
                  {spot.distanceMeters != null ? `${spot.distanceMeters.toLocaleString()}${t.meters}` : "—"}
                  {label ? (
                    <>
                      {" "}
                      <span className={`tag tag-${spot.badge}`}>{label}</span>
                    </>
                  ) : null}
                </span>
              </span>
              <Icon name="chevron-right" size={16} className="card-chevron" />
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
