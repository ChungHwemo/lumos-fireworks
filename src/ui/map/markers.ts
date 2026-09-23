import { Marker, type MapLibreMap } from "maplibre-gl";
import type { Coord } from "../../domain/types.ts";
import { pinIcon, type PinKind } from "./pin-icons.ts";

/** 픽토그램 + 단어 라벨 칩 마커. 한 글자 라벨은 쓰지 않는다 (map-3d PRD D4). */
export function pinMarker(
  map: MapLibreMap,
  coord: Coord,
  className: string,
  kind: PinKind,
  label: string,
  aria: string,
): Marker {
  const el = document.createElement("button");
  el.className = className;
  el.type = "button";
  // 마크업은 우리 상수뿐이다. 사용자 입력이 들어오지 않는다.
  el.innerHTML = pinIcon(kind);
  const text = document.createElement("span");
  text.textContent = label;
  el.appendChild(text);
  el.setAttribute("aria-label", aria);
  return new Marker({ element: el }).setLngLat([coord.lng, coord.lat]).addTo(map);
}
