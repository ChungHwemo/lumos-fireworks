import type { Lang } from "./i18n.ts";

type FestivalCopy = {
  nameEn: string;
  venueEn: string;
  stationJa: string;
  stationEn: string;
  rainJa: string;
  rainEn: string;
};

type Text3 = Record<Lang, string>;

const FESTIVALS: Record<string, FestivalCopy> = {
  "sakata-hanabi": {
    nameEn: "Sakata Fireworks",
    venueEn: "Mogami River park (Ryoba–Dewa bridges)",
    stationJa: "JR酒田駅",
    stationEn: "JR Sakata Station",
    rainJa: "雨天決行。荒天は中止、順延なし。",
    rainEn: "Held in rain. Cancelled in a storm. No postponement.",
  },
  "joso-kinugawa": {
    nameEn: "Joso Kinugawa Fireworks",
    venueEn: "Kinugawa riverbank upstream of Hosei Bridge",
    stationJa: "関東鉄道水海道駅",
    stationEn: "Kanto Railway Mitsukaido Station",
    rainJa: "当日午前7時に開催可否を判断する。",
    rainEn: "Go / no-go is decided at 7:00 on the day.",
  },
  "atami-kaijo": {
    nameEn: "Atami Marine Fireworks",
    venueEn: "Atami Bay",
    stationJa: "JR熱海駅",
    stationEn: "JR Atami Station",
    rainJa: "雨天決行。",
    rainEn: "Held in rain.",
  },
  "hokkaido-geijutsu": {
    nameEn: "Hokkaido Artistic Fireworks",
    venueEn: "Moerenuma Park",
    stationJa: "地下鉄栄町駅からバス",
    stationEn: "Subway Sakaemachi, then bus",
    rainJa: "雨天決行、荒天中止。開演時刻は公園案内19:30と主催報道19:15が食い違う。公式を再確認。",
    rainEn: "Held in rain, cancelled in a storm. Start time differs (19:30 park vs 19:15 organizer). Recheck official pages.",
  },
  "suwako-shinsaku": {
    nameEn: "National New Fireworks Challenge Cup",
    venueEn: "Lake Suwa",
    stationJa: "JR上諏訪駅",
    stationEn: "JR Kami-Suwa Station",
    rainJa: "雨天決行。回次の時刻は公式概要を見る。",
    rainEn: "Held in rain. Check the official overview for each round's time.",
  },
  "katakai-matsuri": {
    nameEn: "Katakai Festival Dedicatory Fireworks",
    venueEn: "Katakai, Ojiya",
    stationJa: "JR小千谷駅",
    stationEn: "JR Ojiya Station",
    rainJa: "雨天決行。荒天は順延。",
    rainEn: "Held in rain. Postponed in a storm.",
  },
  "chofu-hanabi": {
    nameEn: "Chofu Fireworks",
    venueEn: "Tama River floodplain, Chofu",
    stationJa: "京王調布駅",
    stationEn: "Keio Chofu Station",
    rainJa: "荒天は中止。",
    rainEn: "Cancelled in a storm.",
  },
  "tohoku-mirai": {
    nameEn: "Tohoku Mirai Artistic Fireworks",
    venueEn: "Torinoumi multipurpose plaza",
    stationJa: "JR亘理駅",
    stationEn: "JR Watari Station",
    rainJa: "雨天決行、荒天中止。開演18:45、打上げ約1時間。",
    rainEn: "Held in rain, cancelled in a storm. Start 18:45, about one hour of shells.",
  },
  "kamioka-nangai": {
    nameEn: "Kamioka Nangai Fireworks",
    venueEn: "Kamioka / Nangai, Daisen",
    stationJa: "JR大曲駅",
    stationEn: "JR Omagari Station",
    rainJa: "順延日は09-15。",
    rainEn: "Backup date: 15 Sep.",
  },
  "tonegawa-hanabi": {
    nameEn: "Tonegawa Grand Fireworks",
    venueEn: "Tone River bank, Sakai",
    stationJa: "JR古河駅からバス",
    stationEn: "JR Koga Station, then bus",
    rainJa: "荒天中止。順延なし。",
    rainEn: "Cancelled in a storm. No postponement.",
  },
  "doshin-akihanabi": {
    nameEn: "Doshin Autumn Fireworks",
    venueEn: "Sapporo Dome",
    stationJa: "地下鉄福住駅",
    stationEn: "Subway Fukuzumi Station",
    rainJa: "雨天決行。荒天は09-22順延。",
    rainEn: "Held in rain. Storm backup: 22 Sep.",
  },
  "iizuka-noryo": {
    nameEn: "Iizuka Noryo Fireworks",
    venueEn: "Iizuka",
    stationJa: "JR飯塚駅",
    stationEn: "JR Iizuka Station",
    rainJa: "予備日は09-28。",
    rainEn: "Backup date: 28 Sep.",
  },
  "oarai-kaijo": {
    nameEn: "Oarai Marine Fireworks",
    venueEn: "Oarai Sun Beach",
    stationJa: "大洗駅",
    stationEn: "Oarai Station",
    rainJa: "花火のみ09-27順延。09-25 15:00発表。",
    rainEn: "Fireworks only may move to 27 Sep. Announced 25 Sep 15:00.",
  },
  "toya-longrun": {
    nameEn: "Lake Toya Long-run Fireworks",
    venueEn: "Lake Toya",
    stationJa: "洞爺湖温泉バス",
    stationEn: "Toyako Onsen bus",
    rainJa: "雨天決行。船舶が出なければ中止。",
    rainEn: "Held in rain. Cancelled if boats cannot go out.",
  },
  "omagari-aki": {
    nameEn: "Omagari Fireworks Autumn Chapter",
    venueEn: "Omagari riverbank",
    stationJa: "JR大曲駅",
    stationEn: "JR Omagari Station",
    rainJa: "10-04または10-10に順延。",
    rainEn: "Backup: 4 Oct or 10 Oct.",
  },
  "kawasaki-tamagawa": {
    nameEn: "Kawasaki City Tama River Fireworks",
    venueEn: "Tama River floodplain, Kawasaki",
    stationJa: "京急小島新田駅",
    stationEn: "Keikyu Kojimashinden Station",
    rainJa: "荒天中止。順延なし。",
    rainEn: "Cancelled in a storm. No postponement.",
  },
  "onna-churaumi": {
    nameEn: "Onna Churaumi Fireworks",
    venueEn: "Onna coast",
    stationJa: "恩納バス",
    stationEn: "Onna bus",
    rainJa: "荒天中止。予備日なし。",
    rainEn: "Cancelled in a storm. No backup date.",
  },
  "joyo-aki": {
    nameEn: "Joyo Autumn Fireworks",
    venueEn: "Joyo",
    stationJa: "近鉄寺田駅",
    stationEn: "Kintetsu Terada Station",
    rainJa: "雨天決行、荒天中止。返金なし。",
    rainEn: "Held in rain, cancelled in a storm. No refunds.",
  },
  "yonezawa-sengoku": {
    nameEn: "Yonezawa Sengoku Fireworks",
    venueEn: "Yonezawa",
    stationJa: "JR米沢駅",
    stationEn: "JR Yonezawa Station",
    rainJa: "雨天決行。不可能なら中止。",
    rainEn: "Held in rain. Cancelled if it cannot run.",
  },
  "yodogawa-hanabi": {
    nameEn: "Naniwa Yodogawa Fireworks",
    venueEn: "Yodo River park",
    stationJa: "JR新大阪駅",
    stationEn: "JR Shin-Osaka Station",
    rainJa: "雨天決行、荒天中止。",
    rainEn: "Held in rain, cancelled in a storm.",
  },
  kukinoumi: {
    nameEn: "Kukinoumi Fireworks Festival",
    venueEn: "Kitakyushu Wakamatsu",
    stationJa: "JR若松駅",
    stationEn: "JR Wakamatsu Station",
    rainJa: "荒天中止。当日13時発表。",
    rainEn: "Cancelled in a storm. Announced at 13:00 on the day.",
  },
  "osaka-geijutsu": {
    nameEn: "Osaka Artistic Fireworks",
    venueEn: "Osaka",
    stationJa: "公式の交通案内",
    stationEn: "See official transit notes",
    rainJa: "雨天決行、荒天中止。",
    rainEn: "Held in rain, cancelled in a storm.",
  },
  "tsuchiura-zenkoku": {
    nameEn: "Tsuchiura National Fireworks Competition",
    venueEn: "Kasumigaura shore, Tsuchiura",
    stationJa: "JR土浦駅",
    stationEn: "JR Tsuchiura Station",
    rainJa: "順延日は11-14。",
    rainEn: "Backup date: 14 Nov.",
  },
  "obu-higashiura": {
    nameEn: "Obu / Higashiura Fireworks",
    venueEn: "Obu / Higashiura",
    stationJa: "JR大府駅",
    stationEn: "JR Obu Station",
    rainJa: "雨天は公式ページを再確認。",
    rainEn: "Recheck the official page for rain.",
  },
  "huistenbosch-kyushu": {
    nameEn: "Kyushu Grand Fireworks Festival",
    venueEn: "Huis Ten Bosch",
    stationJa: "JRハウステンボス駅",
    stationEn: "JR Huis Ten Bosch Station",
    rainJa: "雨天はハウステンボス公式を見る。",
    rainEn: "Check the Huis Ten Bosch official page for rain.",
  },
  "banpaku-hanabi": {
    nameEn: "Expo Night Sky Art Day",
    venueEn: "Osaka Expo area",
    stationJa: "公式の交通案内",
    stationEn: "See official transit notes",
    rainJa: "トップページに雨天の記載がない。公式を再確認。",
    rainEn: "Rain is not on the top page. Recheck official notes.",
  },
};

export function festivalCopy(seriesId: string): FestivalCopy {
  return (
    FESTIVALS[seriesId] ?? {
      nameEn: "",
      venueEn: "",
      stationJa: "",
      stationEn: "",
      rainJa: "",
      rainEn: "",
    }
  );
}

type SpotPack = {
  nameEn: string;
  description: Text3;
  viewing: Text3;
  crowd: Text3;
  restroom: Text3;
  food: Text3;
  transit: Text3;
  access: Text3;
  visibility?: Text3;
};

const SPOTS: Record<string, SpotPack> = {
  "atami-sunbeach": {
    nameEn: "Atami Sun Beach",
    description: {
      ko: "공식 관광 사이트가 권하는 모래사장. 제1공구보다 한 발 물러나 만 전체가 보인다.",
      ja: "公式観光サイトが勧める砂浜。第1工区より少し下がって湾全体が見える。",
      en: "The official tourist site's beach. One step back from Zone 1, the whole bay is in view.",
    },
    viewing: {
      ko: "해상 발사와 피날레 공중 나이아가라가 정면. 모래에 앉을 수 있다.",
      ja: "海上打上げとフィナーレの空中ナイアガラが正面。砂に座れる。",
      en: "Sea launch and the finale Niagara face you. You can sit on the sand.",
    },
    crowd: {
      ko: "19시 이후 해안 일대가 가득 찬다. 가장자리 모래가 조금 낫다.",
      ja: "19時以降は海岸一帯が埋まる。端の砂が少し楽。",
      en: "The waterfront fills after 19:00. Edge sand is a bit easier.",
    },
    restroom: {
      ko: "선비치·역 방면 공중화장실. 개최일 저녁부터 줄이 길다.",
      ja: "サンビーチ・駅方面の公衆トイレ。開催夜は列が長い。",
      en: "Public toilets toward the beach and station. Long lines on the night.",
    },
    food: {
      ko: "해안 상점가·노점. 모래사장 반입은 주최 공지를 따른다.",
      ja: "海岸商店街・露店。砂浜への持込みは主催の案内に従う。",
      en: "Waterfront shops and stalls. Follow the organizer on bringing food onto the sand.",
    },
    transit: {
      ko: "JR 아타미역에서 도보 약 15분. 개최일 해안 도로는 혼잡하다.",
      ja: "JR熱海駅から徒歩約15分。開催日の海岸道路は混む。",
      en: "About 15 minutes on foot from JR Atami. Coast roads jam on the night.",
    },
    access: {
      ko: "발사 지점 정오 출입금지와는 별개. 해변은 열려 있다.",
      ja: "打上地点の正午以降立入禁止とは別。ビーチは開いている。",
      en: "Separate from the noon launch closure. The beach stays open.",
    },
    visibility: {
      ko: "제1공구가 너무 붐비면 이곳 모래사장이 공식 추천이다.",
      ja: "第1工区が混みすぎたら、ここの砂浜が公式の勧め。",
      en: "If Zone 1 is packed, this beach is the official fallback.",
    },
  },
  "atami-shinsui-1": {
    nameEn: "Shinsui Park Zone 1",
    description: {
      ko: "선비치 쪽 친수공원. 휠체어 관람 공간이 여기 있다. 가장 붐빈다.",
      ja: "サンビーチ側の親水公園。車椅子観覧はここ。いちばん混む。",
      en: "Shinsui Park on the Sun Beach side. Wheelchair viewing is here. Busiest spot.",
    },
    viewing: {
      ko: "발사까지 가깝고 소리가 몸으로 온다. 스카이데크 시야가 넓다.",
      ja: "打上げが近く、音が体に来る。スカイデッキの視界が広い。",
      en: "Close to the launch; the sound hits you. The sky deck is wide.",
    },
    crowd: {
      ko: "공식도 밀집을 경고한다. 일찍 오지 않으면 설 자리가 없다.",
      ja: "公式も混雑を警告する。早く来ないと立つ場所がない。",
      en: "Even the official page warns about crowds. Come early or you cannot stand.",
    },
    restroom: {
      ko: "공원 내 화장실. 개장 직후가 아니면 대기.",
      ja: "園内トイレ。開場直後以外は待ち。",
      en: "Park toilets. Wait unless you arrive right at opening.",
    },
    food: {
      ko: "해안 노점. 공원 잔디에 자리를 깔면 통로를 막기 쉽다.",
      ja: "海岸露店。園内の芝にシートを敷くと通路を塞ぎやすい。",
      en: "Coast stalls. Sheets on the grass easily block paths.",
    },
    transit: {
      ko: "JR 아타미역에서 도보 약 20분.",
      ja: "JR熱海駅から徒歩約20分。",
      en: "About 20 minutes on foot from JR Atami.",
    },
    access: {
      ko: "발사 선착장 출입금지(정오~)와 붙어 있으나 공원은 관람 구역이다.",
      ja: "打上船着場の立入禁止（正午〜）に隣接するが、公園は観覧エリア。",
      en: "Next to the noon launch closure, but the park is a viewing zone.",
    },
  },
  "atami-shinsui-2": {
    nameEn: "Shinsui Park Zones 2–3",
    description: {
      ko: "예년 유료석·온천 조합 숙박자 전용 구역. 일반 입장은 막혀 있을 수 있다.",
      ja: "例年は有料席・温泉組合宿泊者専用。一般入場は止められることがある。",
      en: "Usually paid seats or hotel-union guests only. Walk-ins may be turned away.",
    },
    viewing: {
      ko: "해상에 가장 가깝다. 표 또는 조합 숙소 증이 없으면 들어가지 못한다.",
      ja: "海上にいちばん近い。券か組合宿泊の証明がなければ入れない。",
      en: "Closest to the water. No ticket or union stay proof, no entry.",
    },
    crowd: {
      ko: "입장 통제가 있어 안은 상대적으로 한산하다.",
      ja: "入場規制があるので、中は比較的すいている。",
      en: "Gates keep it relatively quiet inside.",
    },
    restroom: {
      ko: "구역 안 시설은 입장객만.",
      ja: "区画内の設備は入場者のみ。",
      en: "Facilities inside are for ticketed guests.",
    },
    food: {
      ko: "구역 밖 해안 노점을 이용.",
      ja: "区画の外の海岸露店を使う。",
      en: "Use coast stalls outside the zone.",
    },
    transit: {
      ko: "제1공구에서 남쪽으로 해안을 따라 이동.",
      ja: "第1工区から南へ海岸沿い。",
      en: "South along the coast from Zone 1.",
    },
    access: {
      ko: "숙박자 전용·유료석. 당일 운영은 공식·조합 공지를 본다.",
      ja: "宿泊者専用・有料席。当日運営は公式・組合の案内を見る。",
      en: "Guest-only / paid. Check official and union notices that day.",
    },
  },
  "atami-port": {
    nameEn: "Atami Port shore",
    description: {
      ko: "발사 구간(안벽~해낚시 시설)과 같은 항. 선착장 자체는 정오부터 출입금지.",
      ja: "打上区間（岸壁〜海釣り施設）と同じ港。船着場自体は正午から立入禁止。",
      en: "Same harbor as the launch (quay to the fishing deck). The pier itself closes at noon.",
    },
    viewing: {
      ko: "항 바깥 해안에서 옆모습. 정면은 선비치·친수공원이 낫다.",
      ja: "港の外側の海岸から横顔。正面はサンビーチ・親水公園がよい。",
      en: "Side view from the outer shore. Front view is better at Sun Beach or the park.",
    },
    crowd: {
      ko: "발사 지점 접근을 막아서 끝자락만 사람이 선다.",
      ja: "打上地点への接近を止めるので、端だけ人が立つ。",
      en: "Launch access is blocked, so only the edge fills.",
    },
    restroom: {
      ko: "항 주변 공공 화장실은 제한적.",
      ja: "港周辺の公衆トイレは少ない。",
      en: "Few public toilets around the port.",
    },
    food: {
      ko: "항 쪽보다 선비치 쪽이 가게가 많다.",
      ja: "港よりサンビーチ側に店が多い。",
      en: "More shops toward Sun Beach than the port.",
    },
    transit: {
      ko: "선비치에서 해안을 따라 남하.",
      ja: "サンビーチから海岸を南下。",
      en: "South along the coast from Sun Beach.",
    },
    access: {
      ko: "정오 이후 발사 지점 반경은 설 수 없다. 항 외곽만 후보.",
      ja: "正午以降、打上地点半径には立てない。港の外周だけ候補。",
      en: "After noon you cannot stand in the launch radius. Only the outer harbor.",
    },
  },
  "atami-sanremo": {
    nameEn: "Sanremo Park",
    description: {
      ko: "선비치와 친수공원 사이 작은 공원. 모래사장보다 한 단 높다.",
      ja: "サンビーチと親水公園のあいだの小さな公園。砂浜より一段高い。",
      en: "A small park between Sun Beach and Shinsui Park. One step above the sand.",
    },
    viewing: {
      ko: "만 쪽 시야. 나무와 난간에 가릴 수 있다.",
      ja: "湾側の視界。木や手すりに隠れることがある。",
      en: "Bay view. Trees and rails can block it.",
    },
    crowd: {
      ko: "선비치보다 적다. 공간이 좁다.",
      ja: "サンビーチより少ない。スペースは狭い。",
      en: "Fewer people than Sun Beach. Tight space.",
    },
    restroom: {
      ko: "선비치 화장실을 쓴다.",
      ja: "サンビーチのトイレを使う。",
      en: "Use the Sun Beach toilets.",
    },
    food: {
      ko: "선비치·상점가.",
      ja: "サンビーチ・商店街。",
      en: "Sun Beach and the shopping street.",
    },
    transit: {
      ko: "선비치에서 도보 수 분.",
      ja: "サンビーチから徒歩数分。",
      en: "A few minutes on foot from Sun Beach.",
    },
    access: {
      ko: "공원 폐쇄 공지가 있으면 해안으로 내려간다.",
      ja: "公園閉鎖の案内があれば海岸へ降りる。",
      en: "If the park is closed, drop down to the shore.",
    },
  },
  "atami-pad": {
    nameEn: "Near the launch point",
    description: {
      ko: "추정 앵커 바로 옆. 직선은 가깝지만 정오부터 출입금지라 명당이 아니다.",
      ja: "推定アンカーのすぐそば。直線は近いが正午から立入禁止で見物場所ではない。",
      en: "Right by the estimated anchor. Close on paper, closed from noon. Not a viewing spot.",
    },
    viewing: {
      ko: "설 수 없다. 거리 비교용 자리.",
      ja: "立てない。距離比較用。",
      en: "You cannot stand here. Distance comparison only.",
    },
    crowd: {
      ko: "경비.",
      ja: "警備。",
      en: "Security.",
    },
    restroom: { ko: "없음.", ja: "なし。", en: "None." },
    food: { ko: "없음.", ja: "なし。", en: "None." },
    transit: {
      ko: "접근 금지.",
      ja: "接近禁止。",
      en: "No access.",
    },
    access: {
      ko: "개최일 정오부터 종료까지 출입금지.",
      ja: "開催日の正午から終了まで立入禁止。",
      en: "Closed from noon until the show ends.",
    },
    visibility: {
      ko: "지도에서 반경을 보여 주기 위한 자리. 가지 마세요.",
      ja: "地図で半径を示すための地点。行かないでください。",
      en: "On the map only, to show the radius. Do not go.",
    },
  },
  "sakata-swan": {
    nameEn: "Mogami River Swan Park",
    description: {
      ko: "2026 공식 무료 관람 구역. 표 없이 설 수 있다.",
      ja: "2026公式の無料観覧エリア。券なしで立てる。",
      en: "Official free viewing in 2026. No ticket needed.",
    },
    viewing: {
      ko: "하천 공원에서 발사 쪽을 본다. 유료석 정면보다는 옆·조금 멀다.",
      ja: "河川公園から打上側を見る。有料席の正面より横・少し遠い。",
      en: "River park looking toward the launch. Side-on and farther than paid seats.",
    },
    crowd: {
      ko: "무료 공식 자리라 일찍 채워진다.",
      ja: "公式の無料席なので早く埋まる。",
      en: "Official and free, so it fills early.",
    },
    restroom: {
      ko: "하류 녹지 화장실. 개최일 줄이 길다.",
      ja: "下流緑地のトイレ。開催日は列が長い。",
      en: "Toilets in the downstream green. Long lines on the night.",
    },
    food: {
      ko: "노점·키친카는 표 없이 이용 가능하다고 공식 안내.",
      ja: "露店・キッチンカーは券なしで利用可と公式案内。",
      en: "Official note: stalls and food trucks do not need a ticket.",
    },
    transit: {
      ko: "JR 사카타역에서 도보 약 45분. 셔틀이 있으면 그것을 탄다.",
      ja: "JR酒田駅から徒歩約45分。シャトルがあればそれに乗る。",
      en: "About 45 minutes on foot from JR Sakata. Take a shuttle if one runs.",
    },
    access: {
      ko: "주변 정(町)은 차량 규제. 걸어가면 된다. 유료 게이트와는 별 구역.",
      ja: "周辺の町は車両規制。歩けば観覧できる。有料ゲートとは別。",
      en: "Nearby blocks ban cars. Walking is fine. Separate from the paid gate.",
    },
  },
  "sakata-paid": {
    nameEn: "River park paid viewing",
    description: {
      ko: "양우교~데와오하시 사이 유료 구역. 표 없으면 입장할 수 없다.",
      ja: "両羽橋〜出羽大橋の有料区画。券がなければ入れない。",
      en: "Paid zone between Ryoba and Dewa bridges. No ticket, no entry.",
    },
    viewing: {
      ko: "발사에 가장 가깝다. 좌석 종류가 여러 개다.",
      ja: "打上げにいちばん近い。座席の種類が複数ある。",
      en: "Closest to the launch. Several seat types.",
    },
    crowd: {
      ko: "지정석·자유석에 따라 다르다. 16:00 개장.",
      ja: "指定席・自由席で違う。16:00開場。",
      en: "Depends on reserved vs open seating. Gates at 16:00.",
    },
    restroom: {
      ko: "구역 안 임시 화장실.",
      ja: "区画内の仮設トイレ。",
      en: "Temporary toilets inside the zone.",
    },
    food: {
      ko: "장내 노점은 표 없어도 이용 가능. 좌석은 표 필요.",
      ja: "場内露店は券なしでも利用可。座席は券が必要。",
      en: "Stalls inside can be used without a seat ticket. Seats need a ticket.",
    },
    transit: {
      ko: "공식 유료 주차장 또는 셔틀. 역에서 걸어가면 길다.",
      ja: "公式の有料駐車場かシャトル。駅から歩くと長い。",
      en: "Official paid parking or shuttle. A long walk from the station.",
    },
    access: {
      ko: "유료 게이트. 초등학생 이상은 표. 차량 규제 안이지만 걸어 입장.",
      ja: "有料ゲート。小学生以上は券。車両規制の中だが歩いて入場。",
      en: "Paid gate. Elementary age and up need a ticket. Inside the car ban; walk in.",
    },
  },
  "sakata-dewa": {
    nameEn: "Dewa Bridge downstream green",
    description: {
      ko: "하천공원 남쪽 끝. 예년 무료 관람으로 열리는 녹지.",
      ja: "河川公園の南端。例年は無料観覧で開く緑地。",
      en: "South end of the river park. Usually opened for free viewing.",
    },
    viewing: {
      ko: "다리·제방에서 원경. 스완파크보다 발사와 각도가 다르다.",
      ja: "橋・堤防から遠景。スワンパークより打上げの角度が違う。",
      en: "Long view from the bridge and bank. A different angle than Swan Park.",
    },
    crowd: {
      ko: "스완파크보다 한산할 수 있으나 2026 공식 문구를 다시 본다.",
      ja: "スワンパークより空いていることがある。2026公式の文言を再確認。",
      en: "May be quieter than Swan Park. Recheck the 2026 official wording.",
    },
    restroom: {
      ko: "녹지 쪽 시설은 적을 수 있다.",
      ja: "緑地側の設備は少ないことがある。",
      en: "Fewer facilities on this green.",
    },
    food: {
      ko: "메인 회장 노점까지 되돌아가야 한다.",
      ja: "メイン会場の露店まで戻る。",
      en: "Walk back to the main-site stalls.",
    },
    transit: {
      ko: "차량 규제 안. 도보 또는 규제 밖 주차 후 이동.",
      ja: "車両規制の中。徒歩、または規制外に停めて移動。",
      en: "Inside the car ban. Walk, or park outside and walk in.",
    },
    access: {
      ko: "차량 규제. 보행 가능. 당일 폐쇄면 스완파크로.",
      ja: "車両規制。歩行は可。当日閉鎖ならスワンパークへ。",
      en: "Cars banned, walking OK. If closed that day, go to Swan Park.",
    },
    visibility: {
      ko: "2026 공식 무료 안내는 스완파크가 분명하다. 여기는 예년 보조.",
      ja: "2026公式の無料案内はスワンパークが明確。ここは例年の補助。",
      en: "2026 official free viewing is Swan Park. This is a usual backup.",
    },
  },
};

export function spotCopy(id: string): SpotPack | undefined {
  return SPOTS[id];
}

export function spotNameEn(id: string, fallbackJa: string): string {
  return SPOTS[id]?.nameEn ?? fallbackJa;
}

export const CONTROL_COPY: Record<string, { title: Text3; schedule: Text3; detail: Text3 }> = {
  "atami-launch-perimeter": {
    title: {
      ko: "열해 발사 지점 출입금지",
      ja: "熱海打上地点の立入禁止",
      en: "Atami launch closed zone",
    },
    schedule: {
      ko: "개최일 정오부터 종료까지",
      ja: "開催日の正午から終了まで",
      en: "From noon until the show ends",
    },
    detail: {
      ko: "열해만 발사 선착장·선박 일대는 정오부터 출입금지. 친수공원·선비치는 관람 구역이다. 반경 80m는 선착장 추정.",
      ja: "熱海湾の打上船着場・船舶一帯は正午から立入禁止。親水公園・サンビーチは観覧エリア。半径80mは船着場の推定。",
      en: "The bay launch pier and boats close at noon. Shinsui Park and Sun Beach stay open for viewing. The 80 m radius is a pier estimate.",
    },
  },
  "atami-hotel-gate": {
    title: {
      ko: "친수공원 숙박자·유료 구역",
      ja: "親水公園の宿泊者・有料区画",
      en: "Shinsui Park guest / paid zone",
    },
    schedule: { ko: "개최 저녁", ja: "開催の夜", en: "Evening of the show" },
    detail: {
      ko: "제2·3공구는 예년 숙박자 전용 또는 유료석. 표·숙소증 없이 들어가지 못한다.",
      ja: "第2・3工区は例年宿泊者専用または有料席。券・宿証がなければ入れない。",
      en: "Zones 2–3 are usually guest-only or paid. No ticket or hotel proof, no entry.",
    },
  },
  "sakata-vehicle": {
    title: {
      ko: "사카타 차량 진입 규제",
      ja: "酒田の車両進入規制",
      en: "Sakata vehicle ban",
    },
    schedule: { ko: "2026-09-12 당일", ja: "2026-09-12当日", en: "12 Sep 2026" },
    detail: {
      ko: "제초·와카하라·와카타케·료바 정(町) 차량 진입 규제. 걸어가면 관람 가능하다.",
      ja: "瀬越・若原・若竹・両羽の町は車両進入規制。歩けば観覧できる。",
      en: "Cars banned in Segoshi, Wakahara, Wakatake, and Ryoba. Walking in is fine.",
    },
  },
  "sakata-paid-gate": {
    title: {
      ko: "사카타 유료 관람 구역",
      ja: "酒田の有料観覧区画",
      en: "Sakata paid viewing zone",
    },
    schedule: { ko: "16:00 개장", ja: "16:00開場", en: "Opens 16:00" },
    detail: {
      ko: "유료 관람 구역은 표 없이 입장할 수 없다. 스완파크는 무료.",
      ja: "有料観覧区画は券がなければ入れない。スワンパークは無料。",
      en: "No ticket, no entry to the paid zone. Swan Park is free.",
    },
  },
};

export const SEAT_COPY: Record<string, { zone: Text3; note: Text3 }> = {
  "sakata-hanabi-2026": {
    zone: {
      ko: "유료 관람 구역 (좌석 종류 복수)",
      ja: "有料観覧区画（座席の種類は複数）",
      en: "Paid viewing (several seat types)",
    },
    note: {
      ko: "C자유석·제방석 등이 3,000엔대부터. 종류·재고는 공식·로손 티켓을 본다.",
      ja: "C自由席・堤防席などが3,000円台から。種類・在庫は公式・ローソンチケットを見る。",
      en: "C open seats and bank seats from about ¥3,000. Types and stock: official / Lawson Ticket.",
    },
  },
  "atami-kaijo-2026-09-13": {
    zone: {
      ko: "숙박자 전용 관람석 (제2·3공구)",
      ja: "宿泊者専用観覧席（第2・3工区）",
      en: "Guest-only seats (Zones 2–3)",
    },
    note: {
      ko: "온천 조합 가입 숙소 투숙객 전용인 해가 있다. 일반 매표가 아닐 수 있다.",
      ja: "温泉組合加盟宿の宿泊者専用の年がある。一般販売ではないことがある。",
      en: "Some years are hotel-union guests only. May not be a public sale.",
    },
  },
};
