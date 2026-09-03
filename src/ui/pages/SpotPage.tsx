import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import {
  controlsFor,
  decoratedSpots,
  festivalById,
  linksFor,
} from "../../data/catalog.ts";
import { loadReports } from "../../data/reports.ts";
import { crowdHeat, listReports } from "../../domain/report.ts";
import { useLang } from "../Lang.tsx";
import { FestivalMap } from "../map/FestivalMap.tsx";
import { appleDir, googleDir } from "../share.ts";
import { ShareButton } from "../ShareButton.tsx";
import { ReportForm, reportKindLabel } from "./ReportForm.tsx";

export function SpotPage() {
  const { festivalId = "", spotId = "" } = useParams();
  const { t } = useLang();
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
  const heat = useMemo(
    () => crowdHeat(spots, festivalReports),
    [spots, festivalReports],
  );

  if (!festival) return <Navigate to="/" replace />;
  if (!spot) return <Navigate to={`/e/${festivalId}`} replace />;

  const hitting = controls.filter((control) => spot.access.controlIds.includes(control.id));
  const links = linksFor(spot.id);
  const mine = festivalReports.filter((report) => report.spotId === spot.id);

  return (
    <div className="split">
      <FestivalMap
        launch={festival.launch}
        spots={spots}
        controls={controls}
        selectedId={spot.id}
        heat={heat}
        showControls
        showSpots
        showCrowd
        layer="pale"
        onSelect={(id) => navigate(`/e/${festival.id}/p/${id}`)}
      />
      <article className="sheet">
        <Link className="back" to={`/e/${festival.id}?tab=spots`}>
          ← {festival.nameKo}
        </Link>
        <h1>
          {spot.nameKo} <span lang="ja">{spot.nameJa}</span>
        </h1>
        <p className="disclaimer">{festival.disclaimerKo}</p>
        <ShareButton title={spot.nameKo} />
        <p className="meta">
          {spot.distanceMeters != null && (
            <>
              {t.crowFly} {spot.distanceMeters}
              {t.meters}
            </>
          )}
          {spot.access.walkMeters != null &&
            spot.access.walkMeters !== spot.distanceMeters && (
              <>
                {" · "}
                {t.walk} {spot.access.walkMeters}
                {t.meters}
              </>
            )}
          {spot.badge === "blocked" && ` · ${t.badgeBlocked}`}
          {spot.badge === "paid" && ` · ${t.badgePaid}`}
          {spot.badge === "vehicle" && ` · ${t.badgeVehicle}`}
        </p>
        <p>{spot.descriptionKo}</p>
        <dl className="cells">
          <div>
            <dt>{t.viewing}</dt>
            <dd>{spot.viewingKo}</dd>
          </div>
          <div>
            <dt>{t.crowd}</dt>
            <dd>
              {spot.crowdKo}
              <br />
              <span className="meta">{t.notLiveCrowd}</span>
            </dd>
          </div>
          <div>
            <dt>{t.restroom}</dt>
            <dd>{spot.restroomKo}</dd>
          </div>
          <div>
            <dt>{t.food}</dt>
            <dd>{spot.foodKo}</dd>
          </div>
          <div>
            <dt>{t.transit}</dt>
            <dd>{spot.transitKo}</dd>
          </div>
          <div>
            <dt>{t.access}</dt>
            <dd>
              {spot.accessNoticeKo}
              {hitting.map((control) => (
                <p key={control.id}>
                  <strong>{control.titleKo}</strong> ({control.scheduleKo})
                  <br />
                  {control.detailKo}
                </p>
              ))}
            </dd>
          </div>
        </dl>
        {spot.visibilityNoteKo && <p className="note">{spot.visibilityNoteKo}</p>}
        {links.map((link) => (
          <p key={link.id} className="note">
            <a href={link.url} rel="noreferrer" target="_blank">
              {link.fallbackTitle}
            </a>
            <br />
            {link.note}
          </p>
        ))}
        <div className="actions">
          <Link className="primary" to={`/e/${festival.id}/p/${spot.id}/3d`}>
            {t.look3d}
          </Link>
          <a className="primary" href={googleDir(spot.lat, spot.lng)} rel="noreferrer" target="_blank">
            {t.googleMaps}
          </a>
          <a href={appleDir(spot.lat, spot.lng)} rel="noreferrer" target="_blank">
            {t.appleMaps}
          </a>
        </div>
        <h2>{t.tabReports}</h2>
        <ReportForm
          festivalId={festival.id}
          spotId={spot.id}
          lng={spot.lng}
          lat={spot.lat}
          onSaved={setReports}
        />
        {mine.length === 0 ? (
          <p>{t.reportEmpty}</p>
        ) : (
          <ol className="report-list">
            {mine.map((report) => (
              <li key={report.id}>
                <strong>{reportKindLabel(report.kind, t)}</strong>
                <p>{report.body}</p>
              </li>
            ))}
          </ol>
        )}
      </article>
    </div>
  );
}
