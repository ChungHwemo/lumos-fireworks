import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { catalogFestivals } from "../../data/catalog.ts";
import { festivalPlace, prefectureLabel } from "../../domain/area.ts";
import { isFestivalDay } from "../../domain/festival.ts";
import { parseFromQuery } from "../../domain/query.ts";
import type { FestivalRecord } from "../../domain/types.ts";
import { LocalName, festivalStation, festivalTitle } from "../display.tsx";
import { weekday } from "../i18n.ts";
import { Icon } from "../Icon.tsx";
import { monthLabel, rainLabel, shortMonth } from "../labels.ts";
import { useLang } from "../Lang.tsx";
import { LangSwitch } from "../LangSwitch.tsx";
import { ThemeToggle } from "../ThemeSwitch.tsx";
import { flag, useUpdateParams } from "../searchParams.ts";
import { useDocumentTitle } from "../useDocumentTitle.ts";

export function CatalogPage() {
  const { lang, t } = useLang();
  const [params] = useSearchParams();
  const update = useUpdateParams();
  useDocumentTitle(null);

  // 필터는 전부 URL 에 산다. 걸러 둔 목록을 그대로 공유할 수 있다.
  const from = parseFromQuery(params.get("from"));
  const holdOnly = flag(params, "hold", false);
  const paidOnly = flag(params, "paid", false);
  const pref = params.get("pref") ?? "";
  const filtered = holdOnly || paidOnly || pref !== "" || params.has("from");

  const upcoming = useMemo(
    () =>
      catalogFestivals({
        from,
        rainPolicy: holdOnly ? "hold" : undefined,
        paidSeats: paidOnly ? true : undefined,
      }),
    [from, holdOnly, paidOnly],
  );
  // 현 목록은 남은 행사에서만 뽑는다. 이미 끝난 현을 골라 빈 화면을 보는 일이 없다.
  const prefs = useMemo(
    () => [...new Set(upcoming.map((festival) => festival.prefecture))].sort(),
    [upcoming],
  );
  const rows = pref ? upcoming.filter((festival) => festival.prefecture === pref) : upcoming;

  // 달 단위로 묶는다. 시즌 행사는 아직 남은 첫 날(from) 기준으로 놓인다.
  const groups = useMemo(() => {
    const out: { month: string; rows: FestivalRecord[] }[] = [];
    for (const row of rows) {
      const anchor = row.date > from ? row.date : from;
      const month = anchor.slice(0, 7);
      const last = out[out.length - 1];
      if (last && last.month === month) last.rows.push(row);
      else out.push({ month, rows: [row] });
    }
    return out;
  }, [rows, from]);

  const today = new Date();

  return (
    <main className="page page-list">
      <header className="topbar">
        <div>
          <p className="kicker">Asia/Tokyo · {from}</p>
          <h1>{t.appTitle}</h1>
        </div>
        <div className="topbar-tools">
          <ThemeToggle />
          <LangSwitch compact />
        </div>
      </header>
      <p className="lede">{t.appBlurb}</p>

      <form
        className="filters"
        role="search"
        aria-label={t.filters}
        onSubmit={(event) => event.preventDefault()}
      >
        <label className="chip chip-input">
          <Icon name="calendar" size={15} />
          <span className="sr-only">{t.fromDate}</span>
          <input
            type="date"
            value={from}
            aria-label={t.fromDate}
            onChange={(event) => {
              update({ from: event.target.value ? parseFromQuery(event.target.value) : null });
            }}
          />
        </label>
        <button
          type="button"
          className="chip"
          aria-pressed={holdOnly}
          onClick={() => update({ hold: holdOnly ? null : "1" })}
        >
          <Icon name="umbrella" size={15} /> {t.holdOnly}
        </button>
        <button
          type="button"
          className="chip"
          aria-pressed={paidOnly}
          onClick={() => update({ paid: paidOnly ? null : "1" })}
        >
          <Icon name="ticket" size={15} /> {t.paidOnly}
        </button>
        <label className="chip chip-input">
          <Icon name="pin" size={15} />
          <select
            aria-label={t.allPref}
            value={prefs.includes(pref) ? pref : ""}
            onChange={(event) => update({ pref: event.target.value || null })}
          >
            <option value="">{t.allPref}</option>
            {prefs.map((name) => (
              <option key={name} value={name}>
                {prefectureLabel(name, lang)}
              </option>
            ))}
          </select>
        </label>
        {filtered && (
          <button
            type="button"
            className="chip chip-ghost"
            onClick={() => update({ from: null, hold: null, paid: null, pref: null })}
          >
            <Icon name="close" size={14} /> {t.resetFilters}
          </button>
        )}
      </form>

      <p className="disclaimer">{t.unofficial}</p>

      <h2 className="sr-only">{t.catalog}</h2>
      {rows.length === 0 ? (
        <p className="empty" role="status">
          {t.noFestivals}
        </p>
      ) : (
        <p className="count" role="status">
          {rows.length}
          {t.festivalCount}
        </p>
      )}
      {groups.map((group) => (
        <section key={group.month} className="month">
          <h3 className="month-head">{monthLabel(`${group.month}-01`, lang)}</h3>
          <ol className="cards">
            {group.rows.map((festival) => (
              <li key={festival.id}>
                <Link className="card" to={`/e/${festival.id}`}>
                  <div className="card-date" aria-hidden="true">
                    {festival.dateEnd ? (
                      // 시즌 행사는 끝나는 날을 크게 쓴다. 시작일은 이미 지났을 수 있다.
                      <>
                        <strong>~{Number(festival.dateEnd.slice(8, 10))}</strong>
                        <span>{shortMonth(festival.dateEnd, lang)}</span>
                      </>
                    ) : (
                      <>
                        <strong>{Number(festival.date.slice(8, 10))}</strong>
                        <span>{weekday(festival.date, lang)}</span>
                      </>
                    )}
                  </div>
                  <div className="card-body">
                    <time dateTime={festival.date} className="sr-only">
                      {festival.dateEnd ? `${festival.date}–${festival.dateEnd}` : festival.date}
                    </time>
                    <strong className="card-title">
                      <LocalName
                        ko={festival.nameKo}
                        ja={festival.nameJa}
                        en={festivalTitle(festival, lang).en}
                        lang={lang}
                      />
                    </strong>
                    <p className="card-line">
                      <Icon name="pin" size={14} /> {festivalPlace(festival, lang)}
                      <span className="dot" />
                      <Icon name="clock" size={14} /> {festival.startTime}–{festival.endTime}
                      {festival.dateEnd ? (
                        <>
                          <span className="dot" />
                          {festival.date}–{festival.dateEnd}
                        </>
                      ) : null}
                    </p>
                    <p className="card-tags">
                      {isFestivalDay(festival, today) && <span className="tag tag-live">{t.today}</span>}
                      <span className={`tag tag-rain-${festival.rainPolicy}`}>
                        {rainLabel(festival.rainPolicy, t)}
                      </span>
                      {festival.paidSeats && <span className="tag">{t.paidSeats}</span>}
                      {festival.nearestStationKo && (
                        <span className="tag tag-plain">
                          <Icon name="train" size={13} /> {festivalStation(festival, lang)}
                        </span>
                      )}
                    </p>
                  </div>
                  <Icon name="chevron-right" className="card-chevron" size={18} />
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </main>
  );
}
