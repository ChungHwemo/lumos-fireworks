import type { Coord, Festival } from "./types.ts";

export type AreaPrecision = "launch" | "district" | "city" | "prefecture";

export type PlaceLabel = {
  ko: string;
  ja: string;
  en: string;
};

export type FestivalArea = {
  coord: Coord;
  precision: AreaPrecision;
  zoom: number;
  label: PlaceLabel;
};

type Place = PlaceLabel & { coord: Coord };

const ZOOM: Record<AreaPrecision, number> = {
  launch: 14,
  district: 13,
  city: 11,
  prefecture: 8,
};

type AreaInput = Pick<Festival, "launch" | "city" | "prefecture"> & {
  venueJa?: string;
  venueKo?: string;
};

const DISTRICTS: { re: RegExp; place: Place }[] = [
  {
    re: /片貝|카타카이/,
    place: {
      coord: { lng: 138.868, lat: 37.327 },
      ko: "오지야시 카타카이",
      ja: "小千谷市片貝",
      en: "Katakai, Ojiya",
    },
  },
  {
    re: /万博|만박/,
    place: {
      coord: { lng: 135.386, lat: 34.654 },
      ko: "오사카시 만박 지구",
      ja: "大阪市・万博",
      en: "Osaka Expo area",
    },
  },
  {
    re: /淀川|요도가와/,
    place: {
      coord: { lng: 135.486, lat: 34.738 },
      ko: "오사카시 요도가와 하천공원",
      ja: "大阪市 淀川河川公園",
      en: "Yodo River park",
    },
  },
  {
    re: /若松|와카마쓰/,
    place: {
      coord: { lng: 130.811, lat: 33.905 },
      ko: "기타큐슈 와카마쓰",
      ja: "北九州市若松",
      en: "Wakamatsu, Kitakyushu",
    },
  },
  {
    re: /神岡|南外|카미오카|난가이/,
    place: {
      coord: { lng: 140.4, lat: 39.41 },
      ko: "다이센시 카미오카·난가이",
      ja: "大仙市神岡・南外",
      en: "Kamioka / Nangai, Daisen",
    },
  },
];

function matchDistrict(festival: Pick<AreaInput, "venueJa" | "venueKo">): Place | undefined {
  const hay = `${festival.venueJa ?? ""} ${festival.venueKo ?? ""}`;
  return DISTRICTS.find((row) => row.re.test(hay))?.place;
}

const CITIES: Record<string, Place> = {
  酒田市: { coord: { lng: 139.8366, lat: 38.9144 }, ko: "사카타시", ja: "酒田市", en: "Sakata" },
  常総市: { coord: { lng: 139.9939, lat: 36.0236 }, ko: "조소시", ja: "常総市", en: "Joso" },
  熱海市: { coord: { lng: 139.0715, lat: 35.0962 }, ko: "아타미시", ja: "熱海市", en: "Atami" },
  札幌市: { coord: { lng: 141.3544, lat: 43.0618 }, ko: "삿포로시", ja: "札幌市", en: "Sapporo" },
  諏訪市: { coord: { lng: 138.114, lat: 36.0391 }, ko: "스와시", ja: "諏訪市", en: "Suwa" },
  小千谷市: { coord: { lng: 138.7951, lat: 37.3144 }, ko: "오지야시", ja: "小千谷市", en: "Ojiya" },
  調布市: { coord: { lng: 139.5406, lat: 35.6506 }, ko: "조후시", ja: "調布市", en: "Chofu" },
  亘理町: { coord: { lng: 140.8528, lat: 38.0378 }, ko: "와타리정", ja: "亘理町", en: "Watari" },
  大仙市: { coord: { lng: 140.4754, lat: 39.4531 }, ko: "다이센시", ja: "大仙市", en: "Daisen" },
  境町: { coord: { lng: 139.8333, lat: 36.1083 }, ko: "사카이정", ja: "境町", en: "Sakai" },
  飯塚市: { coord: { lng: 130.6914, lat: 33.6458 }, ko: "이이즈카시", ja: "飯塚市", en: "Iizuka" },
  大洗町: { coord: { lng: 140.575, lat: 36.3133 }, ko: "오아라이정", ja: "大洗町", en: "Oarai" },
  洞爺湖町: { coord: { lng: 140.7644, lat: 42.5511 }, ko: "도야코정", ja: "洞爺湖町", en: "Toyako" },
  川崎市: { coord: { lng: 139.7031, lat: 35.5309 }, ko: "가와사키시", ja: "川崎市", en: "Kawasaki" },
  恩納村: { coord: { lng: 127.8533, lat: 26.4975 }, ko: "온나손", ja: "恩納村", en: "Onna" },
  城陽市: { coord: { lng: 135.78, lat: 34.8531 }, ko: "조요시", ja: "城陽市", en: "Joyo" },
  米沢市: { coord: { lng: 140.1167, lat: 37.9222 }, ko: "요네자와시", ja: "米沢市", en: "Yonezawa" },
  大阪市: { coord: { lng: 135.5023, lat: 34.6937 }, ko: "오사카시", ja: "大阪市", en: "Osaka" },
  北九州市: { coord: { lng: 130.8752, lat: 33.8834 }, ko: "기타큐슈시", ja: "北九州市", en: "Kitakyushu" },
  土浦市: { coord: { lng: 140.2026, lat: 36.0781 }, ko: "츠치우라시", ja: "土浦市", en: "Tsuchiura" },
  大府市: { coord: { lng: 136.9631, lat: 35.012 }, ko: "오부시", ja: "大府市", en: "Obu" },
  佐世保市: { coord: { lng: 129.715, lat: 33.1797 }, ko: "사세보시", ja: "佐世保市", en: "Sasebo" },
};

const PREFECTURES: Record<string, Place> = {
  北海道: { coord: { lng: 141.347, lat: 43.065 }, ko: "홋카이도", ja: "北海道", en: "Hokkaido" },
  山形県: { coord: { lng: 140.102, lat: 38.255 }, ko: "야마가타현", ja: "山形県", en: "Yamagata" },
  茨城県: { coord: { lng: 140.447, lat: 36.341 }, ko: "이바라키현", ja: "茨城県", en: "Ibaraki" },
  静岡県: { coord: { lng: 138.383, lat: 34.977 }, ko: "시즈오카현", ja: "静岡県", en: "Shizuoka" },
  長野県: { coord: { lng: 138.181, lat: 36.651 }, ko: "나가노현", ja: "長野県", en: "Nagano" },
  新潟県: { coord: { lng: 139.023, lat: 37.902 }, ko: "니가타현", ja: "新潟県", en: "Niigata" },
  東京都: { coord: { lng: 139.692, lat: 35.69 }, ko: "도쿄도", ja: "東京都", en: "Tokyo" },
  宮城県: { coord: { lng: 140.872, lat: 38.269 }, ko: "미야기현", ja: "宮城県", en: "Miyagi" },
  秋田県: { coord: { lng: 140.102, lat: 39.718 }, ko: "아키타현", ja: "秋田県", en: "Akita" },
  福岡県: { coord: { lng: 130.418, lat: 33.606 }, ko: "후쿠오카현", ja: "福岡県", en: "Fukuoka" },
  神奈川県: { coord: { lng: 139.643, lat: 35.448 }, ko: "가나가와현", ja: "神奈川県", en: "Kanagawa" },
  沖縄県: { coord: { lng: 127.681, lat: 26.212 }, ko: "오키나와현", ja: "沖縄県", en: "Okinawa" },
  京都府: { coord: { lng: 135.755, lat: 35.021 }, ko: "교토부", ja: "京都府", en: "Kyoto" },
  大阪府: { coord: { lng: 135.52, lat: 34.686 }, ko: "오사카부", ja: "大阪府", en: "Osaka" },
  愛知県: { coord: { lng: 136.907, lat: 35.18 }, ko: "아이치현", ja: "愛知県", en: "Aichi" },
  長崎県: { coord: { lng: 129.874, lat: 32.75 }, ko: "나가사키현", ja: "長崎県", en: "Nagasaki" },
};

export function festivalArea(festival: AreaInput): FestivalArea {
  const city = CITIES[festival.city];
  const prefecture = PREFECTURES[festival.prefecture];
  const district = matchDistrict(festival);
  if (festival.launch) {
    return {
      coord: festival.launch,
      precision: "launch",
      zoom: ZOOM.launch,
      label: city?.ko
        ? { ko: city.ko, ja: city.ja, en: city.en }
        : { ko: festival.city, ja: festival.city, en: festival.city },
    };
  }
  if (district) {
    return { coord: district.coord, precision: "district", zoom: ZOOM.district, label: district };
  }
  if (city) {
    return { coord: city.coord, precision: "city", zoom: ZOOM.city, label: city };
  }
  if (prefecture) {
    return {
      coord: prefecture.coord,
      precision: "prefecture",
      zoom: ZOOM.prefecture,
      label: prefecture,
    };
  }
  throw new Error(`no approximate area for ${festival.prefecture} ${festival.city}`);
}

export function areaLabel(area: FestivalArea, lang: "ko" | "ja" | "en"): string {
  return area.label[lang];
}

export function festivalPlace(
  festival: Pick<Festival, "city" | "prefecture"> & Pick<AreaInput, "venueJa" | "venueKo">,
  lang: "ko" | "ja" | "en",
): string {
  const city = CITIES[festival.city];
  const prefecture = PREFECTURES[festival.prefecture];
  const district = matchDistrict(festival);
  if (lang === "ja") {
    return district ? `${festival.prefecture} ${district.ja}` : `${festival.prefecture} ${festival.city}`;
  }
  if (lang === "en") {
    const cityEn = city?.en ?? festival.city;
    const prefEn = prefecture?.en ?? festival.prefecture;
    if (district) return district.en.includes(prefEn) ? district.en : `${district.en}, ${prefEn}`;
    return cityEn === prefEn ? cityEn : `${cityEn}, ${prefEn}`;
  }
  if (district) return `${prefecture?.ko ?? festival.prefecture} ${district.ko}`;
  return `${prefecture?.ko ?? festival.prefecture} ${city?.ko ?? festival.city}`;
}
