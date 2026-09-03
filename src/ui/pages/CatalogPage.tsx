import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { catalogFestivals, festivals } from "../../data/catalog.ts";
import { parseFromQuery } from "../../domain/query.ts";
import { weekday } from "../i18n.ts";
import { useLang } from "../Lang.tsx";

function rainKey(policy: string) {
  return {
    hold: "rainHold",
    cancel: "rainCancel",
    postpone: "rainPostpone",
    unknown: "rainUnknown",
  }[policy] as "rainHold" | "rainCancel" | "rainPostpone" | "rainUnknown";
}

export function CatalogPage() {
  const { lang, t } = useLang();
  const [params, setParams] = useSearchParams();
  const from = parseFromQuery(params.get("from"));
  const [holdOnly, setHoldOnly] = useState(false);
  const [paidOnly, setPaidOnly] = useState(false);
  const [pref, setPref] = useState("");

  const prefs = useMemo(
    () => [...new Set(festivals.map((festival) => festival.prefecture))].sort(),
    [],
  );

  const rows = catalogFestivals({
    from,
    rainPolicy: holdOnly ? "hold" : undefined,
    paidSeats: paidOnly ? true : undefined,
  }).filter((festival) => !pref || festival.prefecture === pref);

  return (
    <main className="page page-list">
      <header className="hero">
        <p className="kicker">Asia/Tokyo · from {from}</p>
        <h1>{t.appTitle}</h1>
        <p className="lede">{t.appBlurb}</p>
      </header>
      <p className="disclaimer">{t.unofficial}</p>
      <div className="filters" role="group" aria-label={t.catalog}>
        <label>
          {t.fromDate}
          <input
            type="date"
            value={from}
            onChange={(event) => {
              const next = parseFromQuery(event.target.value || null);
              params.set("from", next);
              setParams(params, { replace: true });
            }}
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={holdOnly}
            onChange={(e) => setHoldOnly(e.target.checked)}
          />
          {t.holdOnly}
        </label>
        <label>
          <input
            type="checkbox"
            checked={paidOnly}
            onChange={(e) => setPaidOnly(e.target.checked)}
          />
          {t.paidOnly}
        </label>
        <select
          aria-label={t.allPref}
          value={pref}
          onChange={(e) => setPref(e.target.value)}
        >
          <option value="">{t.allPref}</option>
          {prefs.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>
      <h2 className="sr-only">{t.catalog}</h2>
      <ol className="cards">
        {rows.map((festival) => (
          <li key={festival.id}>
            <Link className="card" to={`/e/${festival.id}`}>
              <time dateTime={festival.date}>
                {festival.date}
                {festival.dateEnd ? `–${festival.dateEnd}` : ""} (
                {weekday(festival.date, lang)})
              </time>
              <strong>
                {festival.nameKo}{" "}
                <span lang="ja">{festival.nameJa}</span>
              </strong>
              <p>
                {festival.prefecture} {festival.city} · {festival.startTime}–
                {festival.endTime}
              </p>
              <p className="meta">
                {t[rainKey(festival.rainPolicy)]}
                {festival.paidSeats ? ` · ${t.paidSeats}` : ""}
                {festival.nearestStationKo ? ` · ${festival.nearestStationKo}` : ""}
              </p>
            </Link>
          </li>
        ))}
      </ol>
    </main>
  );
}
