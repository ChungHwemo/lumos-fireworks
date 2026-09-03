import maplibregl from "maplibre-gl";
import { useEffect, useRef } from "react";
import type { DecoratedSpot } from "../../data/catalog.ts";
import type { ControlRecord } from "../../domain/types.ts";
import { circlePolygon } from "./circle.ts";
import { gsiStyle, type GsiLayer } from "./gsi-style.ts";

type Props = {
  launch: { lng: number; lat: number } | null;
  spots: DecoratedSpot[];
  controls: ControlRecord[];
  selectedId?: string | null;
  showControls: boolean;
  showSpots: boolean;
  layer: GsiLayer;
  onSelect: (spotId: string) => void;
};

export function FestivalMap({
  launch,
  spots,
  controls,
  selectedId,
  showControls,
  showSpots,
  layer,
  onSelect,
}: Props) {
  const root = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);
  const state = useRef({ launch, spots, controls, selectedId, showControls, showSpots, layer, onSelect });
  state.current = { launch, spots, controls, selectedId, showControls, showSpots, layer, onSelect };

  useEffect(() => {
    if (!root.current) return;
    const center = launch ?? { lng: 139.7, lat: 36.2 };
    const map = new maplibregl.Map({
      container: root.current,
      style: gsiStyle(layer),
      center: [center.lng, center.lat],
      zoom: launch ? 14 : 5,
      attributionControl: false,
      preserveDrawingBuffer: true,
    });
    (window as unknown as { __hanabiMap?: maplibregl.Map }).__hanabiMap = map;
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");
    map.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: false,
      }),
      "top-right",
    );
    mapRef.current = map;

    const redraw = () => drawOverlays(map, markers, state.current);
    map.on("load", () => {
      map.resize();
      redraw();
    });
    map.on("style.load", redraw);

    const ro = new ResizeObserver(() => map.resize());
    ro.observe(root.current);

    return () => {
      ro.disconnect();
      for (const marker of markers.current) marker.remove();
      markers.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.loaded()) return;
    if (map.getStyle()?.sources && "gsi" in (map.getStyle()?.sources ?? {})) {
      const src = map.getSource("gsi") as maplibregl.RasterTileSource | undefined;
      if (src && "setTiles" in src) {
        const id = layer === "pale" ? "pale" : "std";
        src.setTiles([`https://cyberjapandata.gsi.go.jp/xyz/${id}/{z}/{x}/{y}.png`]);
        drawOverlays(map, markers, state.current);
        return;
      }
    }
    map.setStyle(gsiStyle(layer));
  }, [layer]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    drawOverlays(map, markers, state.current);
  }, [launch, spots, controls, selectedId, showControls, showSpots]);

  return <div ref={root} className="map" role="application" aria-label="행사 지도" />;
}

function drawOverlays(
  map: maplibregl.Map,
  markers: { current: maplibregl.Marker[] },
  props: Props,
) {
  for (const marker of markers.current) marker.remove();
  markers.current = [];

  if (map.getLayer("control-fill")) map.removeLayer("control-fill");
  if (map.getLayer("control-line")) map.removeLayer("control-line");
  if (map.getSource("controls")) map.removeSource("controls");

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

  if (props.launch) {
    const el = document.createElement("button");
    el.className = "pin pin-launch";
    el.type = "button";
    el.textContent = "발";
    el.setAttribute("aria-label", "발사 앵커");
    markers.current.push(
      new maplibregl.Marker({ element: el }).setLngLat([props.launch.lng, props.launch.lat]).addTo(map),
    );
  }

  if (props.showSpots) {
    for (const [index, spot] of props.spots.entries()) {
      const el = document.createElement("button");
      el.type = "button";
      el.className = `pin pin-${spot.badge ?? "open"}${spot.id === props.selectedId ? " is-on" : ""}`;
      el.textContent = String(index + 1);
      el.setAttribute("aria-label", spot.nameKo);
      el.addEventListener("click", () => props.onSelect(spot.id));
      markers.current.push(
        new maplibregl.Marker({ element: el }).setLngLat([spot.lng, spot.lat]).addTo(map),
      );
    }
  }

  const focus = props.spots.find((spot) => spot.id === props.selectedId);
  if (focus) {
    map.easeTo({ center: [focus.lng, focus.lat], zoom: Math.max(map.getZoom(), 15) });
  }
}
