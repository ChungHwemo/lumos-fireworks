import {
  AttributionControl,
  GeolocateControl,
  MapLibreMap,
  Marker,
  NavigationControl,
  setWorkerUrl,
} from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DecoratedSpot } from "../../data/catalog.ts";
import { areaLabel, type FestivalArea } from "../../domain/area.ts";
import { unknownLaunchOffset } from "../../domain/burst.ts";
import type { StationPoint } from "../../domain/station.ts";
import type { Coord, ControlRecord } from "../../domain/types.ts";
import type { Dict, Lang } from "../i18n.ts";
import { spotName } from "../labels.ts";
import { useLang } from "../Lang.tsx";
import { circlePolygon } from "./circle.ts";
import {
  createFireworksLayer,
  FIREWORKS_LAYER_ID,
  type FireworksLayer,
} from "./fireworks-layer.ts";
import { mapStyle, type MapStyleId } from "./gsi-style.ts";
import { pinIcon, type PinKind } from "./pin-icons.ts";

// v6 는 ESM 전용이라 번들러가 워커 경로를 모른다. 한 번만 알려 준다.
setWorkerUrl(workerUrl);

export type HeatPoint = {
  id: string;
  lng: number;
  lat: number;
  level: number;
};

type Props = {
  launch: Coord | null;
  area: FestivalArea;
  station?: StationPoint | null;
  spots: DecoratedSpot[];
  controls: ControlRecord[];
  selectedId?: string | null;
  sharePin?: Coord | null;
  heat?: HeatPoint[];
  showControls: boolean;
  showSpots: boolean;
  showCrowd?: boolean;
  fireworks?: boolean;
  fireworksSeed?: string;
  style: MapStyleId;
  onSelect: (spotId: string) => void;
  onMapClick?: (coord: Coord) => void;
};

type Latest = Props & { lang: Lang; t: Dict };

const FOCUS_ZOOM = 15;
const ORBIT_MS = 40_000;
const ORBIT_DEG = 90;

let webgl2: boolean | null = null;
/** 페이지당 한 번만 캔버스를 만들어 본다. v6 는 WebGL2 없이는 지도를 만들지 못한다. */
function hasWebGL2(): boolean {
  if (webgl2 != null) return webgl2;
  try {
    const canvas = document.createElement("canvas");
    webgl2 = canvas.getContext("webgl2") != null;
  } catch {
    webgl2 = false;
  }
  return webgl2;
}

function sameCoord(a: Coord | null | undefined, b: Coord | null | undefined): boolean {
  if (!a || !b) return a === b;
  return a.lng === b.lng && a.lat === b.lat;
}

export function FestivalMap(props: Props) {
  const {
    launch,
    area,
    station,
    spots,
    controls,
    selectedId,
    sharePin,
    heat,
    showControls,
    showSpots,
    showCrowd,
    fireworks,
    style,
  } = props;
  const { lang, t } = useLang();
  const [supported] = useState(hasWebGL2);
  const root = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const ready = useRef(false);
  const fireworksRef = useRef<FireworksLayer | null>(null);
  const markers = useRef<Marker[]>([]);

  // 지도 콜백은 마운트 때 한 번 묶인다. 최신 props 는 여기서 읽는다. 렌더 중에는 건드리지 않는다.
  const latest = useRef<Latest>({ ...props, lang, t });
  useEffect(() => {
    latest.current = { ...props, lang, t };
  });

  const focus = useMemo(
    () => spots.find((spot) => spot.id === selectedId) ?? sharePin ?? null,
    [spots, selectedId, sharePin],
  );
  const lastFocus = useRef<Coord | null>(focus);

  useEffect(() => {
    const host = root.current;
    if (!host) return;
    const init = latest.current;
    const initialFocus =
      init.spots.find((spot) => spot.id === init.selectedId) ?? init.sharePin ?? null;
    const center = initialFocus ?? init.area.coord;

    let map: MapLibreMap;
    try {
      map = new MapLibreMap({
        container: host,
        style: mapStyle(init.style),
        center: [center.lng, center.lat],
        zoom: initialFocus || init.launch ? FOCUS_ZOOM : init.area.zoom,
        pitch: 78,
        bearing: 0,
        canvasContextAttributes: { antialias: true },
        attributionControl: false,
        maxPitch: 85,
      });
    } catch (error) {
      // GPU 가 막힌 브라우저. 지도 없이도 시트는 읽을 수 있어야 한다.
      console.error("map init failed", error);
      const note = document.createElement("p");
      note.className = "map-fallback";
      note.textContent = init.t.mapUnavailable;
      host.replaceChildren(note);
      return () => host.replaceChildren();
    }
    map.addControl(new AttributionControl({ compact: true }), "bottom-left");
    map.addControl(new NavigationControl({ showCompass: true }), "top-left");
    map.addControl(
      new GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: false,
      }),
      "top-left",
    );
    mapRef.current = map;

    // 진입 오비트. 중심을 두고 90°를 40초에 돈다. 사용자가 만지면 멈추고 다시 돌지 않는다.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let orbiting = !reduced.matches;
    let orbitTimer = 0;
    const orbitStep = () => {
      if (!orbiting) return;
      map.easeTo({
        bearing: map.getBearing() + ORBIT_DEG,
        duration: ORBIT_MS,
        easing: (k) => k,
      });
      orbitTimer = window.setTimeout(orbitStep, ORBIT_MS);
    };
    const stopOrbit = () => {
      if (!orbiting) return;
      orbiting = false;
      window.clearTimeout(orbitTimer);
      map.stop();
    };

    // 불꽃 정지 조건: 토글 꺼짐, 탭 백그라운드, 모션 감소 설정 중 하나라도 걸리면 멈춘다.
    const syncRunning = () => {
      fireworksRef.current?.setRunning(
        latest.current.fireworks !== false && !document.hidden && !reduced.matches,
      );
    };

    map.on("style.load", () => {
      const first = !ready.current;
      ready.current = true;
      if (first) {
        map.resize();
        // bounds 를 맞추지 않는다. fitBounds 는 평면 기준이라 pitch 78 의 사다리꼴 가시영역에서
        // 어긋나고, 시트가 지도 오른쪽을 덮는 것도 모른다. 앵커든 지구 대략 좌표든 중심으로 잡는다.
        if (orbiting) orbitStep();
      }
      if (!map.getLayer(FIREWORKS_LAYER_ID)) {
        const seed = latest.current.fireworksSeed ?? "unknown";
        const base = latest.current.launch ?? latest.current.area.coord;
        const anchor = latest.current.launch ?? unknownLaunchOffset(base, seed);
        const created = createFireworksLayer(anchor);
        fireworksRef.current = created;
        map.addLayer(created);
        syncRunning();
      }
      drawOverlays(map, markers, latest.current);
    });
    map.on("click", (event) => {
      latest.current.onMapClick?.({ lng: event.lngLat.lng, lat: event.lngLat.lat });
    });
    // 캡처 단계라 마커의 stopPropagation 을 타지 않는다. 캔버스 드래그·핀 탭·컨트롤 클릭을 전부 받는다.
    host.addEventListener("pointerdown", stopOrbit, { capture: true });
    // 휠 줌·키보드 패닝은 pointerdown 을 거치지 않는다. 사용자가 일으킨 이동만 잡는다.
    // 우리 easeTo 는 originalEvent 가 없어 스스로를 멈추지 않는다.
    map.on("movestart", (event) => {
      if (event.originalEvent) stopOrbit();
    });

    document.addEventListener("visibilitychange", syncRunning);
    reduced.addEventListener("change", syncRunning);

    const ro = new ResizeObserver(() => map.resize());
    ro.observe(host);

    return () => {
      document.removeEventListener("visibilitychange", syncRunning);
      reduced.removeEventListener("change", syncRunning);
      ro.disconnect();
      for (const marker of markers.current) marker.remove();
      markers.current = [];
      window.clearTimeout(orbitTimer);
      host.removeEventListener("pointerdown", stopOrbit, { capture: true });
      fireworksRef.current = null;
      ready.current = false;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // 배경을 갈아 끼운다. style.load 가 다시 오면 불꽃 레이어와 오버레이가 거기서 다시 붙는다.
  const appliedStyle = useRef(style);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || appliedStyle.current === style) return;
    appliedStyle.current = style;
    map.setStyle(mapStyle(style));
  }, [style]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready.current) return;
    drawOverlays(map, markers, latest.current);
  }, [
    launch,
    area,
    station,
    spots,
    controls,
    selectedId,
    sharePin,
    heat,
    showControls,
    showSpots,
    showCrowd,
    lang,
    t,
  ]);

  // 선택 명당이나 공유 핀이 바뀔 때만 카메라를 옮긴다. 마운트 때는 이미 그 자리에서 시작한다.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focus || sameCoord(lastFocus.current, focus)) return;
    lastFocus.current = focus;
    map.easeTo({ center: [focus.lng, focus.lat], zoom: Math.max(map.getZoom(), FOCUS_ZOOM) });
  }, [focus]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    fireworksRef.current?.setRunning(fireworks !== false && !document.hidden && !reduced.matches);
  }, [fireworks]);

  if (!supported) {
    return (
      <div className="map" role="note">
        <p className="map-fallback">{t.mapUnavailable}</p>
      </div>
    );
  }
  return <div ref={root} className="map" role="application" aria-label={t.mapAria} />;
}

function dropLayer(map: MapLibreMap, id: string) {
  if (map.getLayer(id)) map.removeLayer(id);
}

function dropSource(map: MapLibreMap, id: string) {
  if (map.getSource(id)) map.removeSource(id);
}

function drawOverlays(map: MapLibreMap, markers: { current: Marker[] }, s: Latest) {
  for (const marker of markers.current) marker.remove();
  markers.current = [];

  dropLayer(map, "control-fill");
  dropLayer(map, "control-line");
  dropSource(map, "controls");
  dropLayer(map, "crowd-heat");
  dropSource(map, "crowd");

  if (s.showControls) {
    const features = s.controls.flatMap((control) => {
      const center = control.center ?? s.launch;
      if (!center || !control.radiusMeters) return [];
      const feature = circlePolygon(center, control.radiusMeters);
      feature.properties = { kind: control.kind, id: control.id };
      return [feature];
    });

    map.addSource("controls", {
      type: "geojson",
      data: { type: "FeatureCollection", features },
    });
    map.addLayer({
      id: "control-fill",
      type: "fill",
      source: "controls",
      paint: { "fill-color": "#c2410c", "fill-opacity": 0.16 },
    });
    map.addLayer({
      id: "control-line",
      type: "line",
      source: "controls",
      paint: { "line-color": "#c2410c", "line-width": 2 },
    });
  }

  if (s.showCrowd && s.heat && s.heat.length > 0) {
    map.addSource("crowd", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: s.heat.map((point) => ({
          type: "Feature",
          properties: { level: point.level, id: point.id },
          geometry: { type: "Point", coordinates: [point.lng, point.lat] },
        })),
      },
    });
    map.addLayer({
      id: "crowd-heat",
      type: "circle",
      source: "crowd",
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["get", "level"], 1, 10, 5, 32],
        "circle-color": [
          "interpolate",
          ["linear"],
          ["get", "level"],
          1,
          "#86efac",
          3,
          "#fbbf24",
          5,
          "#ef4444",
        ],
        "circle-opacity": 0.32,
        "circle-blur": 0.4,
      },
    });
  }

  if (s.launch) {
    markers.current.push(pin(map, s.launch, "pin pin-launch", "launch", s.t.pinLaunch, s.t.pinLaunch));
  } else if (s.area.precision !== "launch") {
    markers.current.push(
      pin(
        map,
        s.area.coord,
        "pin pin-approx",
        "launchUnknown",
        s.t.pinLaunchUnknown,
        areaLabel(s.area, s.lang),
      ),
    );
  }

  if (s.station) {
    markers.current.push(
      pin(map, s.station.coord, "pin pin-station", "station", s.t.pinStation, s.station.label[s.lang]),
    );
  }

  if (s.sharePin) {
    markers.current.push(pin(map, s.sharePin, "pin pin-share", "share", s.t.pinShare, s.t.pinShare));
  }

  if (s.showSpots) {
    for (const [index, spot] of s.spots.entries()) {
      const el = document.createElement("button");
      el.type = "button";
      el.className = `pin pin-${spot.badge ?? "open"}${spot.id === s.selectedId ? " is-on" : ""}`;
      el.textContent = String(index + 1);
      el.setAttribute("aria-label", spotName(spot, s.lang));
      el.setAttribute("aria-pressed", spot.id === s.selectedId ? "true" : "false");
      el.addEventListener("click", (event) => {
        event.stopPropagation();
        s.onSelect(spot.id);
      });
      markers.current.push(new Marker({ element: el }).setLngLat([spot.lng, spot.lat]).addTo(map));
    }
  }
}

function pin(
  map: MapLibreMap,
  coord: Coord,
  className: string,
  kind: PinKind,
  label: string,
  aria: string,
) {
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
