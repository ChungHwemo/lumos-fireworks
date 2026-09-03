import { useLang } from "../Lang.tsx";
import { pinIcon, type PinKind } from "./pin-icons.ts";

function Glyph({ kind }: { kind: PinKind }) {
  return <span className="legend-glyph" dangerouslySetInnerHTML={{ __html: pinIcon(kind) }} />;
}

/** 접어 둔 상태로 시작한다. 360px에서 지도를 덮지 않는다. */
export function MapLegend() {
  const { t } = useLang();
  return (
    <details className="legend">
      <summary>{t.legend}</summary>
      <ul>
        <li>
          <Glyph kind="launch" /> {t.pinLaunch}
        </li>
        <li>
          <Glyph kind="launchUnknown" /> {t.pinLaunchUnknown}
        </li>
        <li>
          <Glyph kind="station" /> {t.pinStation}
        </li>
        <li>
          <Glyph kind="share" /> {t.pinShare}
        </li>
        <li>
          <span className="pin pin-open legend-chip">1</span> {t.legendSpotOpen}
        </li>
        <li>
          <span className="pin pin-paid legend-chip">1</span> {t.legendSpotPaid}
        </li>
        <li>
          <span className="pin pin-blocked legend-chip">1</span> {t.legendSpotBlocked}
        </li>
        <li>
          <span className="pin pin-vehicle legend-chip">1</span> {t.legendSpotVehicle}
        </li>
      </ul>
      <p className="note">{t.legendSpotNumber}</p>
    </details>
  );
}
