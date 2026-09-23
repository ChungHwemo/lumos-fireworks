import type { MapLibreMap } from "maplibre-gl";
import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import type { Coord } from "../../domain/types.ts";
import { Icon } from "../Icon.tsx";
import { useLang } from "../Lang.tsx";

/** 컨트롤이 지도에 요구하는 것만. 테스트는 이 모양의 가짜 지도를 넘긴다. */
export type ControlsMap = Pick<
  MapLibreMap,
  | "getBearing"
  | "getPitch"
  | "getZoom"
  | "setBearing"
  | "setPitch"
  | "easeTo"
  | "resetNorth"
  | "zoomIn"
  | "zoomOut"
  | "on"
  | "off"
>;

const ROTATE_STEP_DEG = 45;
const TILT_PITCH = 78;
const FLAT_PITCH_MAX = 10;
/** FestivalMap 의 maxPitch 와 같다. 지도가 어차피 그 위로는 받지 않는다. */
const MAX_PITCH = 80;
/** MapLibre 의 컴패스 드래그와 같은 감도. */
const DRAG_BEARING_PER_PX = 0.8;
const DRAG_PITCH_PER_PX = 0.5;
const DRAG_THRESHOLD_PX = 3;
const TOAST_MS = 3200;

type Props = {
  map: ControlsMap;
  orbiting: boolean;
  onOrbitToggle: () => void;
  /** 사용자가 카메라를 직접 만졌다. 자동 회전을 멈춘다. */
  onInteract: () => void;
  /** 현위치 핀을 놓고 치우는 함수를 돌려준다. 지도 마커는 여기서 만들지 않는다. */
  placeHere: (coord: Coord, label: string) => () => void;
};

function normalize(bearing: number): number {
  return ((Math.round(bearing) % 360) + 360) % 360;
}

/**
 * 지도 위 카메라·위치 조작. 벤치마크처럼 시트 위 오른쪽에 세로로 선다.
 * 회전은 컴패스 드래그·우클릭 드래그·두 손가락에도 있지만, 눌러서 되는 버튼이 있어야 보인다.
 */
export function MapControls({ map, orbiting, onOrbitToggle, onInteract, placeHere }: Props) {
  const { t } = useLang();
  const [bearing, setBearing] = useState(() => map.getBearing());
  const [pitch, setPitch] = useState(() => map.getPitch());
  const [locating, setLocating] = useState(false);
  const [hereCoord, setHereCoord] = useState<Coord | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => {
      setBearing(map.getBearing());
      setPitch(map.getPitch());
    };
    map.on("rotate", sync);
    map.on("pitch", sync);
    return () => {
      map.off("rotate", sync);
      map.off("pitch", sync);
    };
  }, [map]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // 언어가 바뀌면 핀 라벨도 바뀌어야 하므로 t.here 를 의존성에 둔다.
  useEffect(() => {
    if (!hereCoord) return;
    return placeHere(hereCoord, t.here);
  }, [hereCoord, placeHere, t.here]);

  const rotate = (deltaDeg: number) => {
    onInteract();
    map.easeTo({ bearing: map.getBearing() + deltaDeg, duration: 450 });
  };

  const flat = pitch < FLAT_PITCH_MAX;
  const toggleTilt = () => {
    onInteract();
    map.easeTo({ pitch: flat ? TILT_PITCH : 0, duration: 600 });
  };

  // 컴패스: 탭은 북쪽 맞추기, 끌기는 회전과 기울기.
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const skipClick = useRef(false);
  const onCompassDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    try {
      // 버튼 밖으로 나가도 끌기가 이어진다. 합성 포인터·구형 브라우저는 던지므로 없이도 간다.
      event.currentTarget.setPointerCapture?.(event.pointerId);
    } catch {
      /* 캡처 없이도 버튼 위에서는 동작한다 */
    }
    drag.current = { x: event.clientX, y: event.clientY, moved: false };
    onInteract();
  };
  const onCompassMove = (event: PointerEvent<HTMLButtonElement>) => {
    const state = drag.current;
    if (!state) return;
    const dx = event.clientX - state.x;
    const dy = event.clientY - state.y;
    if (!state.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
    state.moved = true;
    state.x = event.clientX;
    state.y = event.clientY;
    map.setBearing(map.getBearing() - dx * DRAG_BEARING_PER_PX);
    map.setPitch(Math.min(MAX_PITCH, Math.max(0, map.getPitch() - dy * DRAG_PITCH_PER_PX)));
  };
  const onCompassUp = (event: PointerEvent<HTMLButtonElement>) => {
    const state = drag.current;
    drag.current = null;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (state?.moved) skipClick.current = true;
  };
  const onCompassClick = () => {
    if (skipClick.current) {
      skipClick.current = false;
      return;
    }
    onInteract();
    map.resetNorth({ duration: 500 });
  };

  const locate = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setToast(t.locateFailed);
      return;
    }
    onInteract();
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coord = { lng: position.coords.longitude, lat: position.coords.latitude };
        setHereCoord(coord);
        setLocating(false);
        map.easeTo({ center: [coord.lng, coord.lat], zoom: Math.max(map.getZoom(), 15), duration: 800 });
      },
      () => {
        setLocating(false);
        setToast(t.locateFailed);
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 30_000 },
    );
  }, [map, onInteract, t.locateFailed]);

  const heading = normalize(bearing);
  const compassLabel = `${t.resetNorth} · ${t.compassHint} · ${t.bearingNow} ${heading}°`;

  return (
    <div className="map-controls" role="group" aria-label={t.mapControls}>
      <div className="ctrl-group">
        <button
          type="button"
          className="compass"
          aria-label={compassLabel}
          title={compassLabel}
          onPointerDown={onCompassDown}
          onPointerMove={onCompassMove}
          onPointerUp={onCompassUp}
          onPointerCancel={onCompassUp}
          onClick={onCompassClick}
        >
          <svg
            className="compass-needle"
            viewBox="0 0 24 24"
            width="22"
            height="22"
            aria-hidden="true"
            focusable="false"
            style={{ transform: `rotateX(${pitch}deg) rotateZ(${-bearing}deg)` }}
          >
            <path d="M12 2.5 15.2 12H8.8Z" fill="#ff6b6b" />
            <path d="M12 21.5 8.8 12h6.4Z" fill="currentColor" opacity="0.75" />
          </svg>
        </button>
        <button type="button" aria-label={t.rotateLeft} title={t.rotateLeft} onClick={() => rotate(ROTATE_STEP_DEG)}>
          <Icon name="rotate-ccw" size={18} />
        </button>
        <button type="button" aria-label={t.rotateRight} title={t.rotateRight} onClick={() => rotate(-ROTATE_STEP_DEG)}>
          <Icon name="rotate-cw" size={18} />
        </button>
        <button
          type="button"
          className="ctrl-text"
          aria-label={flat ? t.tilt3d : t.tilt2d}
          title={flat ? t.tilt3d : t.tilt2d}
          aria-pressed={!flat}
          onClick={toggleTilt}
        >
          {flat ? "3D" : "2D"}
        </button>
        <button
          type="button"
          aria-label={t.orbit}
          title={t.orbit}
          aria-pressed={orbiting}
          onClick={onOrbitToggle}
        >
          <Icon name={orbiting ? "pause" : "play"} size={18} />
        </button>
      </div>
      <div className="ctrl-group">
        <button
          type="button"
          aria-label={locating ? t.locating : t.here}
          title={t.here}
          aria-busy={locating || undefined}
          disabled={locating}
          onClick={locate}
        >
          <Icon name="locate" size={18} />
        </button>
      </div>
      <div className="ctrl-group ctrl-zoom">
        <button
          type="button"
          aria-label={t.zoomIn}
          title={t.zoomIn}
          onClick={() => {
            onInteract();
            map.zoomIn();
          }}
        >
          <Icon name="plus" size={18} />
        </button>
        <button
          type="button"
          aria-label={t.zoomOut}
          title={t.zoomOut}
          onClick={() => {
            onInteract();
            map.zoomOut();
          }}
        >
          <Icon name="minus" size={18} />
        </button>
      </div>
      {toast && (
        <p role="alert" className="ctrl-toast">
          {toast}
        </p>
      )}
    </div>
  );
}
