import { useCallback, useMemo, useState, type ReactNode } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { controlsFor, decoratedSpots, festivalById, linksFor } from "../../data/catalog.ts";
import { loadReports } from "../../data/reports.ts";
import { festivalArea } from "../../domain/area.ts";
import { crowdHeat, listReports } from "../../domain/report.ts";
import { festivalStationPoint } from "../../domain/station.ts";
import { CONTROL_COPY } from "../content.ts";
import { NamePair, festivalTitle, spotField } from "../display.tsx";
import { Icon, type IconName } from "../Icon.tsx";
import { badgeLabel, distanceLine, reportKindLabel, spotName } from "../labels.ts";
import { useLang } from "../Lang.tsx";
import { FestivalMap } from "../map/FestivalMap.tsx";
import { appleDir, googleDir } from "../share.ts";
import { ShareButton } from "../ShareButton.tsx";
import { Sheet } from "../Sheet.tsx";
import { useDocumentTitle } from "../useDocumentTitle.ts";
import { ReportForm } from "./ReportForm.tsx";

export function SpotPage() {
  const { festivalId = "", spotId = "" } = useParams();
  const { lang, t } = useLang();
  const navigate = useNavigate();
  const festival = festivalById(festivalId);
  const spots = useMemo(() => decoratedSpots(festivalId), [festivalId]);
  const controls = useMemo(() => controlsFor(festivalId), [festivalId]);
  const spot = spots.find((row) => row.id === spotId);
  const [reports, setReports] = useState(loadReports);
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
  useDocumentTitle(spot ? spotName(spot, lang) : null);

  if (!festival || !area) return <Navigate to="/" replace />;
  if (!spot) return <Navigate to={`/e/${festivalId}`} replace />;

  const hitting = controls.filter((control) => spot.access.controlIds.includes(control.id));
  const links = linksFor(spot.id);
  const mine = festivalReports.filter((report) => report.spotId === spot.id);
  const station = festivalStationPoint(festival);
  const badge = badgeLabel(spot.badge, t);
  const others = spots.filter((row) => row.id !== spot.id).slice(0, 4);

  return (
    <div className="split">
      <FestivalMap
        key={festival.id}
        launch={festival.launch}
        area={area}
        station={station}
        spots={spots}
        controls={controls}
        selectedId={spot.id}
        heat={heat}
        showControls
        showSpots
        showCrowd
        fireworks
        fireworksSeed={festival.id}
        style="night"
        onSelect={onSelect}
      />
      <Sheet as="article" ariaLabel={t.spotKicker}>
        <header className="sheet-head">
          <Link className="icon-btn" to={`/e/${festival.id}?tab=spots`} aria-label={festivalTitle(festival, lang).primary}>
            <Icon name="chevron-left" />
          </Link>
          <div className="sheet-title">
            <p className="kicker">
              {t.spotKicker} · {festivalTitle(festival, lang).primary}
            </p>
            <h1>
              <NamePair ko={spot.nameKo} ja={spot.nameJa} en={spotName(spot, "en")} lang={lang} />
            </h1>
          </div>
        </header>

        <p className="lede">{spotField(spot, "description", spot.descriptionKo, lang)}</p>

        <p className="distance">
          <Icon name="spark" size={16} />
          {spot.distanceMeters != null ? (
            <strong>{distanceLine(spot.distanceMeters, t)}</strong>
          ) : (
            <span className="mute">{t.noLaunchDistance}</span>
          )}
          {spot.access.walkMeters != null && spot.access.walkMeters !== spot.distanceMeters && (
            <span className="mute">
              {" · "}
              {t.walk} {spot.access.walkMeters.toLocaleString()}
              {t.meters}
            </span>
          )}
          {badge && <span className={`tag tag-${spot.badge}`}>{badge}</span>}
        </p>

        <div className="action-row">
          <Link className="pill pill-primary" to={`/e/${festival.id}/p/${spot.id}/3d`}>
            <Icon name="cube" size={15} /> {t.look3d}
          </Link>
          <a className="pill" href={googleDir(spot.lat, spot.lng)} rel="noreferrer" target="_blank">
            <Icon name="navigate" size={15} /> {t.googleMaps}
          </a>
          <a className="pill" href={appleDir(spot.lat, spot.lng)} rel="noreferrer" target="_blank">
            <Icon name="navigate" size={15} /> {t.appleMaps}
          </a>
          <ShareButton variant="pill" title={spotName(spot, lang)} />
        </div>

        <p className="disclaimer">
          {t.unofficial}
          {festival.launch ? ` ${t.launchEstimate}` : ` ${t.areaApprox}`}
        </p>

        <dl className="info-grid">
          <Cell icon="eye" label={t.viewing}>
            {spotField(spot, "viewing", spot.viewingKo, lang)}
          </Cell>
          <Cell icon="people" label={t.crowd}>
            {spotField(spot, "crowd", spot.crowdKo, lang)}
            <small className="mute">{t.notLiveCrowd}</small>
          </Cell>
          <Cell icon="restroom" label={t.restroom}>
            {spotField(spot, "restroom", spot.restroomKo, lang)}
          </Cell>
          <Cell icon="food" label={t.food}>
            {spotField(spot, "food", spot.foodKo, lang)}
          </Cell>
          <Cell icon="bus" label={t.transit}>
            {spotField(spot, "transit", spot.transitKo, lang)}
          </Cell>
          <Cell icon="gate" label={t.access} wide>
            {spotField(spot, "access", spot.accessNoticeKo, lang)}
            {hitting.map((control) => {
              const copy = CONTROL_COPY[control.id];
              return (
                <p key={control.id} className="control">
                  <strong>{copy?.title[lang] ?? control.titleKo}</strong>
                  <span className="mute"> · {copy?.schedule[lang] ?? control.scheduleKo}</span>
                  <br />
                  {copy?.detail[lang] ?? control.detailKo}
                </p>
              );
            })}
          </Cell>
        </dl>

        {spot.visibilityNoteKo && (
          <p className="note">{spotField(spot, "visibility", spot.visibilityNoteKo, lang)}</p>
        )}

        {links.length > 0 && (
          <section className="block">
            <h2>
              <Icon name="external" size={16} /> {t.sources}
            </h2>
            <ul className="source-list">
              {links.map((link) => (
                <li key={link.id}>
                  <a href={link.url} rel="noreferrer" target="_blank">
                    {link.fallbackTitle}
                  </a>
                  <span className="mute">{link.note}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {others.length > 0 && (
          <section className="block">
            <h2>
              <Icon name="pin" size={16} /> {t.otherSpots}
            </h2>
            <ol className="spot-list">
              {others.map((row) => {
                const index = spots.indexOf(row) + 1;
                const rowBadge = badgeLabel(row.badge, t);
                return (
                  <li key={row.id}>
                    <Link to={`/e/${festival.id}/p/${row.id}`}>
                      <span className={`pin pin-${row.badge ?? "open"} pin-static`} aria-hidden="true">
                        {index}
                      </span>
                      <span className="spot-main">
                        <strong>
                          <NamePair ko={row.nameKo} ja={row.nameJa} en={spotName(row, "en")} lang={lang} />
                        </strong>
                        <span className="meta">
                          {row.distanceMeters != null
                            ? `${row.distanceMeters.toLocaleString()}${t.meters}`
                            : "—"}
                          {rowBadge ? (
                            <>
                              {" "}
                              <span className={`tag tag-${row.badge}`}>{rowBadge}</span>
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
          </section>
        )}

        <section className="block">
          <h2>
            <Icon name="people" size={16} /> {t.tabReports}
          </h2>
          <ReportForm
            festivalId={festival.id}
            spotId={spot.id}
            lng={spot.lng}
            lat={spot.lat}
            onSaved={setReports}
          />
          {mine.length === 0 ? (
            <p className="mute">{t.reportEmpty}</p>
          ) : (
            <ol className="report-list">
              {mine.map((report) => (
                <li key={report.id}>
                  <span className="tag">{reportKindLabel(report.kind, t)}</span>
                  <p>{report.body}</p>
                </li>
              ))}
            </ol>
          )}
        </section>
      </Sheet>
    </div>
  );
}

function Cell({
  icon,
  label,
  wide = false,
  children,
}: {
  icon: IconName;
  label: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`info-card${wide ? " is-wide" : ""}`}>
      <dt>
        <Icon name={icon} size={15} /> {label}
      </dt>
      <dd>{children}</dd>
    </div>
  );
}
