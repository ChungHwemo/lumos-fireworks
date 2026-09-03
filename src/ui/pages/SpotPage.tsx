import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import {
  controlsFor,
  decoratedSpots,
  festivalById,
  linksFor,
} from "../../data/catalog.ts";
import { loadReports } from "../../data/reports.ts";
import { areaLabel, festivalArea } from "../../domain/area.ts";
import { festivalStationPoint } from "../../domain/station.ts";
import { crowdHeat, listReports } from "../../domain/report.ts";
import { CONTROL_COPY, spotNameEn } from "../content.ts";
import { NamePair, festivalStation, festivalTitle, spotField } from "../display.tsx";
import { useLang } from "../Lang.tsx";
import { FestivalMap } from "../map/FestivalMap.tsx";
import { appleDir, googleDir } from "../share.ts";
import { ShareButton } from "../ShareButton.tsx";
import { ReportForm, reportKindLabel } from "./ReportForm.tsx";

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
  const heat = useMemo(
    () => crowdHeat(spots, festivalReports),
    [spots, festivalReports],
  );

  if (!festival) return <Navigate to="/" replace />;
  if (!spot) return <Navigate to={`/e/${festivalId}`} replace />;

  const hitting = controls.filter((control) => spot.access.controlIds.includes(control.id));
  const links = linksFor(spot.id);
  const mine = festivalReports.filter((report) => report.spotId === spot.id);
  const area = festivalArea(festival);
  const station = festivalStationPoint(festival);

  return (
    <div className="split">
      <FestivalMap
        key={festival.id}
        launch={festival.launch}
        area={area}
        station={station?.coord}
        spots={spots}
        controls={controls}
        selectedId={spot.id}
        heat={heat}
        showControls
        showSpots
        showCrowd
        layer="pale"
        labels={{
          launch: t.pinLaunch,
          share: t.pinShare,
          mapAria: t.mapAria,
          launchAria: t.launch,
          shareAria: t.share,
          approx: t.pinApprox,
          approxAria: areaLabel(area, lang),
          station: t.pinStation,
          stationAria: festivalStation(festival, lang),
          spotName: (row) =>
            lang === "ja" ? row.nameJa : lang === "en" ? spotNameEn(row.id, row.nameJa) : row.nameKo,
        }}
        onSelect={(id) => navigate(`/e/${festival.id}/p/${id}`)}
      />
      <article className="sheet">
        <Link className="back" to={`/e/${festival.id}?tab=spots`}>
          ← {festivalTitle(festival, lang).primary}
        </Link>
        <h1>
          <NamePair ko={spot.nameKo} ja={spot.nameJa} en={spotNameEn(spot.id, spot.nameJa)} lang={lang} />
        </h1>
        <p className="disclaimer">
          {t.unofficial}
          {festival.launch ? ` ${t.launchEstimate}` : ` ${t.areaApprox}`}
        </p>
        <ShareButton title={lang === "ja" ? spot.nameJa : lang === "en" ? spotNameEn(spot.id, spot.nameJa) : spot.nameKo} />
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
        <p>{spotField(spot, "description", spot.descriptionKo, lang)}</p>
        <dl className="cells">
          <div>
            <dt>{t.viewing}</dt>
            <dd>{spotField(spot, "viewing", spot.viewingKo, lang)}</dd>
          </div>
          <div>
            <dt>{t.crowd}</dt>
            <dd>
              {spotField(spot, "crowd", spot.crowdKo, lang)}
              <br />
              <span className="meta">{t.notLiveCrowd}</span>
            </dd>
          </div>
          <div>
            <dt>{t.restroom}</dt>
            <dd>{spotField(spot, "restroom", spot.restroomKo, lang)}</dd>
          </div>
          <div>
            <dt>{t.food}</dt>
            <dd>{spotField(spot, "food", spot.foodKo, lang)}</dd>
          </div>
          <div>
            <dt>{t.transit}</dt>
            <dd>{spotField(spot, "transit", spot.transitKo, lang)}</dd>
          </div>
          <div>
            <dt>{t.access}</dt>
            <dd>
              {spotField(spot, "access", spot.accessNoticeKo, lang)}
              {hitting.map((control) => {
                const copy = CONTROL_COPY[control.id];
                return (
                <p key={control.id}>
                  <strong>{copy?.title[lang] ?? control.titleKo}</strong> ({copy?.schedule[lang] ?? control.scheduleKo})
                  <br />
                  {copy?.detail[lang] ?? control.detailKo}
                </p>
                );
              })}
            </dd>
          </div>
        </dl>
        {spot.visibilityNoteKo && (
          <p className="note">{spotField(spot, "visibility", spot.visibilityNoteKo, lang)}</p>
        )}
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
