import maplibregl from "maplibre-gl";
import { useEffect, useRef } from "react";
import type { DecoratedSpot } from "../../data/catalog.ts";
import type { FestivalArea } from "../../domain/area.ts";
import type { Coord, ControlRecord } from "../../domain/types.ts";
import { circlePolygon } from "./circle.ts";
import { gsiStyle, type GsiLayer } from "./gsi-style.ts";

export type HeatPoint = {
  id: string;
  lng: number;
  lat: number;
  level: number;
};

type Props = {
  launch: Coord | null;
  area?: FestivalArea;
  station?: Coord | null;
  spots: DecoratedSpot[];
  controls: ControlRecord[];
  selectedId?: string | null;
  sharePin?: Coord | null;
  heat?: HeatPoint[];
  showControls: boolean;
  showSpots: boolean;
  showCrowd?: boolean;
  layer: GsiLayer;
  onSelect: (spotId: string) => void;
  onMapClick?: (coord: Coord) => void;
  labels?: {
    launch: string;
    share: string;
    mapAria: string;
    launchAria: string;
    shareAria: string;
    approx?: string;
    approxAria?: string;
    station?: string;
    stationAria?: string;
    spotName: (spot: DecoratedSpot) => string;
  };
};

export function FestivalMap({
  launch,
  area,
  station,
  spots,
  controls,
  selectedId,
  sharePin,
  heat = [],
  showControls,
  showSpots,
  showCrowd = false,
  layer,
  onSelect,
  onMapClick,
  labels,
}: Props) {
  const root = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);
  const state = useRef({
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
    layer,
    onSelect,
    onMapClick,
    labels,
  });
  state.current = {
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
    layer,
    onSelect,
    onMapClick,
    labels,
  };

  useEffect(() => {
    if (!root.current) return;
    const center = area?.coord ?? launch ?? { lng: 139.7, lat: 36.2 };
    const map = new maplibregl.Map({
      container: root.current,
      style: gsiStyle(layer),
      center: [center.lng, center.lat],
      zoom: area?.zoom ?? (launch ? 15 : 5),
      pitch: launch || area ? 83 : 0,
      bearing: 0,
      canvasContextAttributes: { antialias: true },
      attributionControl: false,
      maxPitch: 85,
    });
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");
    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-left");
    map.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: false,
      }),
      "top-left",
    );
    mapRef.current = map;

    const host = root.current;
    const redraw = () => drawOverlays(map, markers, state.current);
    let firstStyle = true;
    map.on("style.load", () => {
      if (firstStyle) {
        firstStyle = false;
        map.resize();
        fitView(map, viewPoints(state.current));
      }
      redraw();
      if (orbiting) orbitStep();
    });
    map.on("click", (event) => {
      state.current.onMapClick?.({ lng: event.lngLat.lng, lat: event.lngLat.lat });
    });

    // 진입 오비트. 발사점을 중심으로 90°를 40초에 돈다. 사용자가 만지면 멈추고 다시 돌지 않는다.
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let orbiting = (launch != null || area != null) && !reducedMotion.matches;
    let orbitTimer = 0;
    const orbitStep = () => {
      if (!orbiting) return;
      map.easeTo({
        bearing: map.getBearing() + 90,
        duration: 40000,
        easing: (t) => t,
      });
      orbitTimer = window.setTimeout(orbitStep, 40000);
    };
    const stopOrbit = () => {
      if (!orbiting) return;
      orbiting = false;
      window.clearTimeout(orbitTimer);
      map.stop();
    };
    // 캡처 단계라 마커의 stopPropagation 을 타지 않는다. 캔버스 드래그·핀 탭·컨트롤 클릭을 전부 받는다.
    host.addEventListener("pointerdown", stopOrbit, { capture: true });
    // 휠 줌·키보드 패닝은 pointerdown 을 거치지 않는다. 사용자가 일으킨 이동만 잡는다.
    // 우리 easeTo 는 originalEvent 가 없어 스스로를 멈추지 않는다.
    const onUserMove = (event: { originalEvent?: unknown }) => {
      if (event.originalEvent) stopOrbit();
    };
    map.on("movestart", onUserMove);

    const ro = new ResizeObserver(() => map.resize());
    ro.observe(host);

    return () => {
      ro.disconnect();
      for (const marker of markers.current) marker.remove();
      markers.current = [];
      window.clearTimeout(orbitTimer);
      host.removeEventListener("pointerdown", stopOrbit, { capture: true });
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.loaded()) return;
    const src = map.getSource("gsi") as maplibregl.RasterTileSource | undefined;
    if (src && "setTiles" in src) {
      const id = layer === "pale" ? "pale" : "std";
      src.setTiles([`https://cyberjapandata.gsi.go.jp/xyz/${id}/{z}/{x}/{y}.png`]);
      return;
    }
    map.setStyle(gsiStyle(layer));
  }, [layer]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    drawOverlays(map, markers, state.current);
  }, [launch, area, station, spots, controls, selectedId, sharePin, heat, showControls, showSpots, showCrowd, labels]);

  return <div ref={root} className="map" role="application" aria-label={labels?.mapAria ?? "행사 지도"} />;
}

function dropLayer(map: maplibregl.Map, id: string) {
  if (map.getLayer(id)) map.removeLayer(id);
}

function dropSource(map: maplibregl.Map, id: string) {
  if (map.getSource(id)) map.removeSource(id);
}

function drawOverlays(
  map: maplibregl.Map,
  markers: { current: maplibregl.Marker[] },
  props: Props,
) {
  for (const marker of markers.current) marker.remove();
  markers.current = [];

  dropLayer(map, "control-fill");
  dropLayer(map, "control-line");
  dropSource(map, "controls");
  dropLayer(map, "crowd-heat");
  dropSource(map, "crowd");

  if (props.showControls) {
    const features = props.controls
      .filter((control) => control.radiusMeters && (control.center || props.launch))
      .map((control) => {
        const center = control.center ?? props.launch;
        if (!center || !control.radiusMeters) return null;
        const feature = circlePolygon(center, control.radiusMeters);
        feature.properties = { kind: control.kind, id: control.id };
        return feature;
      })
      .filter((feature): feature is NonNullable<typeof feature> => feature != null);

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

  if (props.showCrowd && props.heat && props.heat.length > 0) {
    map.addSource("crowd", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: props.heat.map((point) => ({
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
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["get", "level"],
          1,
          10,
          5,
          32,
        ],
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

  if (props.launch) {
    markers.current.push(
      pin(
        map,
        props.launch,
        "pin pin-launch",
        props.labels?.launch ?? "발",
        props.labels?.launchAria ?? "발사 앵커",
      ),
    );
  } else if (props.area && props.area.precision !== "launch") {
    markers.current.push(
      pin(
        map,
        props.area.coord,
        "pin pin-approx",
        props.labels?.approx ?? "대략",
        props.labels?.approxAria ?? props.labels?.approx ?? "대략 위치",
      ),
    );
  }

  if (props.station) {
    markers.current.push(
      pin(
        map,
        props.station,
        "pin pin-station",
        props.labels?.station ?? "역",
        props.labels?.stationAria ?? props.labels?.station ?? "가까운 역",
      ),
    );
  }

  if (props.sharePin) {
    markers.current.push(
      pin(
        map,
        props.sharePin,
        "pin pin-share",
        props.labels?.share ?? "공",
        props.labels?.shareAria ?? "공유 좌표",
      ),
    );
  }

  if (props.showSpots) {
    for (const [index, spot] of props.spots.entries()) {
      const el = document.createElement("button");
      el.type = "button";
      el.className = `pin pin-${spot.badge ?? "open"}${spot.id === props.selectedId ? " is-on" : ""}`;
      el.textContent = String(index + 1);
      el.setAttribute("aria-label", props.labels?.spotName(spot) ?? spot.nameKo);
      el.addEventListener("click", (event) => {
        event.stopPropagation();
        props.onSelect(spot.id);
      });
      markers.current.push(new maplibregl.Marker({ element: el }).setLngLat([spot.lng, spot.lat]).addTo(map));
    }
  }

  const focus = props.spots.find((spot) => spot.id === props.selectedId) ?? props.sharePin;
  if (focus) {
    map.easeTo({ center: [focus.lng, focus.lat], zoom: Math.max(map.getZoom(), 15) });
  }
}

function viewPoints(props: Props): Coord[] {
  const points: Coord[] = [];
  if (props.launch) points.push(props.launch);
  else if (props.area) points.push(props.area.coord);
  if (props.station) points.push(props.station);
  return points;
}

function fitView(map: maplibregl.Map, points: Coord[]) {
  if (points.length === 0) return;
  if (points.length === 1) {
    map.jumpTo({ center: [points[0].lng, points[0].lat] });
    return;
  }
  const lngs = points.map((point) => point.lng);
  const lats = points.map((point) => point.lat);
  map.fitBounds(
    [
      [Math.min(...lngs), Math.min(...lats)],
      [Math.max(...lngs), Math.max(...lats)],
    ],
    { padding: 72, maxZoom: 14, duration: 0 },
  );
}

function pin(
  map: maplibregl.Map,
  coord: Coord,
  className: string,
  label: string,
  aria: string,
) {
  const el = document.createElement("button");
  el.className = className;
  el.type = "button";
  el.textContent = label;
  el.setAttribute("aria-label", aria);
  return new maplibregl.Marker({ element: el }).setLngLat([coord.lng, coord.lat]).addTo(map);
}
