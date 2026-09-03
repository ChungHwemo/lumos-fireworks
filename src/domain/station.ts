import type { Coord, Festival } from "./types.ts";

export type StationPoint = {
  coord: Coord;
  label: {
    ko: string;
    ja: string;
    en: string;
  };
};

const STATIONS: Record<string, StationPoint> = {
  "sakata-hanabi": {
    coord: { lng: 139.8436, lat: 38.9217 },
    label: { ko: "JR 사카타역", ja: "JR酒田駅", en: "JR Sakata Station" },
  },
  "joso-kinugawa": {
    coord: { lng: 139.9942, lat: 36.0178 },
    label: { ko: "간토철도 미츠카이도역", ja: "関東鉄道水海道駅", en: "Kanto Railway Mitsukaido Station" },
  },
  "atami-kaijo": {
    coord: { lng: 139.0777, lat: 35.1032 },
    label: { ko: "JR 아타미역", ja: "JR熱海駅", en: "JR Atami Station" },
  },
  "hokkaido-geijutsu": {
    coord: { lng: 141.3636, lat: 43.0631 },
    label: { ko: "지하철 사카에마치역", ja: "地下鉄栄町駅", en: "Subway Sakaemachi Station" },
  },
  "suwako-shinsaku": {
    coord: { lng: 138.1092, lat: 36.0464 },
    label: { ko: "JR 가미스와역", ja: "JR上諏訪駅", en: "JR Kami-Suwa Station" },
  },
  "katakai-matsuri": {
    coord: { lng: 138.7953, lat: 37.3142 },
    label: { ko: "JR 오지야역", ja: "JR小千谷駅", en: "JR Ojiya Station" },
  },
  "chofu-hanabi": {
    coord: { lng: 139.5439, lat: 35.6519 },
    label: { ko: "케이오 조후역", ja: "京王調布駅", en: "Keio Chofu Station" },
  },
  "tohoku-mirai": {
    coord: { lng: 140.8514, lat: 38.0364 },
    label: { ko: "JR 와타리역", ja: "JR亘理駅", en: "JR Watari Station" },
  },
  "kamioka-nangai": {
    coord: { lng: 140.4814, lat: 39.4647 },
    label: { ko: "JR 오마가리역", ja: "JR大曲駅", en: "JR Omagari Station" },
  },
  "tonegawa-hanabi": {
    coord: { lng: 139.7097, lat: 36.1958 },
    label: { ko: "JR 고가역", ja: "JR古河駅", en: "JR Koga Station" },
  },
  "doshin-akihanabi": {
    coord: { lng: 141.4008, lat: 43.0369 },
    label: { ko: "지하철 후쿠즈미역", ja: "地下鉄福住駅", en: "Subway Fukuzumi Station" },
  },
  "iizuka-noryo": {
    coord: { lng: 130.6914, lat: 33.6364 },
    label: { ko: "JR 이이즈카역", ja: "JR飯塚駅", en: "JR Iizuka Station" },
  },
  "oarai-kaijo": {
    coord: { lng: 140.5747, lat: 36.3131 },
    label: { ko: "오아라이역", ja: "大洗駅", en: "Oarai Station" },
  },
  "omagari-aki": {
    coord: { lng: 140.4814, lat: 39.4647 },
    label: { ko: "JR 오마가리역", ja: "JR大曲駅", en: "JR Omagari Station" },
  },
  "kawasaki-tamagawa": {
    coord: { lng: 139.7047, lat: 35.5344 },
    label: { ko: "케이큐 코지마신덴역", ja: "京急小島新田駅", en: "Keikyu Kojimashinden Station" },
  },
  "joyo-aki": {
    coord: { lng: 135.7853, lat: 34.8211 },
    label: { ko: "킨테츠 테라다역", ja: "近鉄寺田駅", en: "Kintetsu Terada Station" },
  },
  "yonezawa-sengoku": {
    coord: { lng: 140.1169, lat: 37.9097 },
    label: { ko: "JR 요네자와역", ja: "JR米沢駅", en: "JR Yonezawa Station" },
  },
  "yodogawa-hanabi": {
    coord: { lng: 135.4989, lat: 34.7335 },
    label: { ko: "JR 신오사카역", ja: "JR新大阪駅", en: "JR Shin-Osaka Station" },
  },
  kukinoumi: {
    coord: { lng: 130.8061, lat: 33.9014 },
    label: { ko: "JR 와카마쓰역", ja: "JR若松駅", en: "JR Wakamatsu Station" },
  },
  "tsuchiura-zenkoku": {
    coord: { lng: 140.2061, lat: 36.0783 },
    label: { ko: "JR 츠치우라역", ja: "JR土浦駅", en: "JR Tsuchiura Station" },
  },
  "obu-higashiura": {
    coord: { lng: 136.9631, lat: 35.0119 },
    label: { ko: "JR 오부역", ja: "JR大府駅", en: "JR Obu Station" },
  },
  "huistenbosch-kyushu": {
    coord: { lng: 129.7903, lat: 33.0864 },
    label: { ko: "JR 하우스텐보스역", ja: "JRハウステンボス駅", en: "JR Huis Ten Bosch Station" },
  },
};

export function festivalStationPoint(
  festival: Pick<Festival, "seriesId">,
): StationPoint | null {
  return STATIONS[festival.seriesId] ?? null;
}
