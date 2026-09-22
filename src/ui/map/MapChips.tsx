import { Icon } from "../Icon.tsx";
import { useLang } from "../Lang.tsx";
import { MAP_STYLES, type MapStyleId } from "./gsi-style.ts";

/**
 * 지도 위에 떠 있는 레이어 토글. 벤치마크의 「행사 구역 / 하위 시설 / 통제 정보」자리다.
 * 값은 전부 URL 에 있고 여기는 버튼만 그린다.
 */
export function MapChips({
  controls,
  crowd,
  fireworks,
  style,
  onToggle,
  onStyle,
}: {
  controls: boolean;
  crowd: boolean;
  fireworks: boolean;
  style: MapStyleId;
  onToggle: (key: "ctl" | "crowd" | "fw", on: boolean) => void;
  onStyle: (style: MapStyleId) => void;
}) {
  const { t } = useLang();
  const styleLabel: Record<MapStyleId, string> = {
    night: t.mapNight,
    photo: t.mapPhoto,
    pale: t.mapPale,
  };
  const nextStyle = MAP_STYLES[(MAP_STYLES.indexOf(style) + 1) % MAP_STYLES.length];
  // 좁은 화면은 CSS 가 글자를 숨기고 아이콘만 남긴다. 이름은 aria-label 로 남는다.
  return (
    <div className="map-chips" role="group" aria-label={t.mapLayers}>
      <button
        type="button"
        className="chip"
        aria-pressed={controls}
        aria-label={t.overlayControls}
        title={t.overlayControls}
        onClick={() => onToggle("ctl", !controls)}
      >
        <Icon name="gate" size={15} /> <span className="chip-label">{t.overlayControls}</span>
      </button>
      <button
        type="button"
        className="chip"
        aria-pressed={crowd}
        aria-label={t.overlayCrowd}
        title={t.overlayCrowd}
        onClick={() => onToggle("crowd", !crowd)}
      >
        <Icon name="people" size={15} /> <span className="chip-label">{t.overlayCrowd}</span>
      </button>
      <button
        type="button"
        className="chip"
        aria-pressed={fireworks}
        aria-label={t.overlayFireworks}
        title={t.overlayFireworks}
        onClick={() => onToggle("fw", !fireworks)}
      >
        <Icon name="spark" size={15} /> <span className="chip-label">{t.overlayFireworks}</span>
      </button>
      <button
        type="button"
        className="chip chip-style"
        onClick={() => onStyle(nextStyle)}
        aria-label={`${t.mapStyle}: ${styleLabel[style]}`}
        title={`${t.mapStyle}: ${styleLabel[style]}`}
      >
        <Icon name="layers" size={15} /> <span className="chip-label">{styleLabel[style]}</span>
      </button>
    </div>
  );
}
