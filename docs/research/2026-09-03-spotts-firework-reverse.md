# spotts.kr/firework 리버스 엔지니어링

조사일: 2026-09-03  
대상: [https://spotts.kr/firework](https://spotts.kr/firework)  
목적: 동일 정보 구조를 2026-09-04 이후 일본 花火大会에 이식하기 위한 1차 출처 기록.

공식 앱이 아니다. 화면 하단 문구: "공식으로 제공하는 정보가 아닙니다. 사용에 참고해주세요."

## 제품 한 줄

단일 행사(서울세계불꽃축제 2026)의 **어두운 지도 + 명당 카탈로그 + 일정/선곡 + 현장 혼잡/제보** 웹앱.

카피: "불꽃축제 관람 지역을 둘러보고 친구와 정확한 위치를 공유해요."

## 스택 (관측)

- Next.js (App Router, Turbopack chunks, `__next_f`)
- MapLibre GL + 자체 타일(`tile.spotts.kr`, 다크 스타일 `/api/map/style/dark`)
- Three.js 3D 명당보기(DEM·위성 타일, `/models/63-building.glb`)
- Supabase (장소 카테고리, 스프라이트)
- PostHog, Zod, Pretendard, Cloudflare
- 서울 실시간 인구: `/api/population` ← `seoul-openapi.citydata_ppltn`

## 라우트

| 경로 | 역할 |
| --- | --- |
| `/firework` | 행사 홈. 지도 + 하단 시트 |
| `/firework/p/{spotId}` | 명당 상세. 예: `/firework/p/yeouido-hangang` |
| `/settings` 등 | robots.txt에 비공개 경로 존재 (`/my`, `/check-ins`, `/invite/`, `/place-submissions`) |

하단 탭 4개: 불꽃축제 행사 · 관람 Spot · 실시간 소식 · 설정.

## 데이터 파일과 스키마 (번들 내부)

원본은 JSON + JSON Schema로 도메인을 고정하고, **참조 id가 없으면 테스트가 실패**하도록 짜여 있다.

```
.schema/event.schema.json
.schema/spots.schema.json
.schema/facilities.schema.json
.schema/areas.schema.json
.schema/traffic-control.schema.json
.schema/traffic-control-endpoints.schema.json
```

관측된 런타임 식별자:

- `FIREWORK_EVENT`, `FIREWORK_SPOTS`, `FIREWORK_PAD_COORDS`
- `FIREWORK_VIEWING_AREAS`, `FIREWORK_TRAFFIC_CONTROL_GEOJSON`
- `FIREWORK_COORDINATES_BY_ID`
- `calculateFireworkPickScore`
- `findNearbyFireworkFacilities` / `findNearbyFireworkSubwayStations`
- `isFireworkEventDay` (달력 `start`의 날짜 == `Asia/Seoul` 오늘)

## Event 모델 (요약)

출처 메타: 한화 공식 + 서울경찰청 교통통제. 전야제 분 단위 분해와 선곡표는 공식에 없어 SNS 정리본을 옮기고, UI가 재확인을 강제한다.

```json
{
  "event": {
    "name": "서울세계불꽃축제 2026",
    "theme": "Your Infinite Colors",
    "date": "2026년 9월 5일 (토)",
    "hours": "13:00 - 22:00",
    "area": "여의도 한강공원 일대 · 마포대교–한강철교",
    "officialUrl": "https://www.hanwhafireworks.com/",
    "officialLiveUrl": "https://www.youtube.com/live/nLZKpuCxmpM",
    "calendar": { "start": "20260905T130000", "end": "20260905T220000", "timeZone": "Asia/Seoul" },
    "programs": ["eve", "main"],
    "schedule": ["pre-event", "official-event", "firework-show", "crowd-dispersal", "clean-campaign"],
    "setlist": { "sourceUrl": "...", "teams": ["uk", "us", "kr"] },
    "trafficNotices": ["yeouidong-ro-control", "..."],
    "orangeZone": { "ticketUrl": "https://ticket.orange-play.co.kr/" },
    "distanceDisclaimer": "불꽃까지 거리는 공식 지도 기반의 추정 앵커 기준이에요."
  }
}
```

본축제 불꽃쇼: 20:00–21:10. 영국 15분 → 휴식 5분 → 미국 15분 → 휴식 5분 → 한국 30분.

## Spot 모델 (요약)

좌표 소유권은 spots 파일이 갖는다. `distanceMeters`는 **공식 지도에서 잡은 발사 추정 앵커까지 최단거리(m)**. `isViewpoint`가 true인 지점만 관람 후보. `populationArea`는 그 자리가 실제로 속하거나 맞닿은 서울 인구 구역만 붙인다.

관측 필드:

| 필드 | 의미 |
| --- | --- |
| `id` | URL 슬러그. `yeouido-hangang` |
| `name`, `mapName` | 시트 제목 / 지도 라벨 |
| `lng`, `lat` | WGS84 |
| `roomId` | 채팅/제보 룸. `yeouido`, `mapo` |
| `populationArea` | `/api/population` 슬러그 |
| `aliases` | 검색 |
| `description` | 한 줄 설명 |
| `viewing` | 관람 포인트 |
| `restroom`, `food`, `transit` | 편의 |
| `crowd` | 예상 혼잡 문구 |
| `distanceMeters` | 발사 앵커까지 거리 |
| `isViewpoint` | 명당 후보 여부 |
| `accessNotice` | 입장·통제 |
| `visibilityNote` | 시야 한계, SNS 근거 한계 |
| `updatedAt` | `YYYY-MM-DD` |

관측된 명당 약 49곳. 무료 강변부터 유료 전망대·크루즈·등산 능선까지. 거리 범위 약 536m–8.7km.

## 화면별 기능

### 행사 탭

- 전야제(9/4) / 본축제(9/5) 토글
- 명당 미리보기 4곳(최근 무료 명당 10곳 중 무작위) + 3D 명당보기
- 공식 행사 정보, 친구 공유, 위치 공유
- 일정 타임라인, 선곡표(팀별 접기)
- SNS 후기 카드(제목·요약·한계 주석)
- 갤러리, 제보 메일

### 관람 Spot 탭

- `명당 탐색` / `통제 지역` 토글
- 거리순 리스트. 유료면 이름에 `유료`가 붙음
- 검색: "관람 지역 검색"

### 명당 상세

- 3D 명당보기, 위치 공유, 길찾기, 주변 명당
- 실시간 혼잡도 카드(구역 합산, 예측 시간대)
- 관람 포인트 / 예상 혼잡 / 화장실 / 먹거리 / 교통 / 입장·이동
- 리서치 출처 목록. 각 링크에 `note`(한계) 필수

### 실시간 소식

- 공식 소식 + 현장 제보
- 제보 분류: `crowd` `restroom` `food` `traffic` `firework` `other`
- 신고 사유: `wrong_info` `spam` `abuse`
- API: `GET /api/firework/reports` → `{ reports: [] }` (조사 시점 비어 있음)

### 설정

- 언어: 시스템 / 한국어 / English
- 피드백, 커피 후원

### 지도 오버레이

- 발사 앵커, 명당 마커, 지하철, 화장실·편의점
- 교통 통제 폴리곤
- 나침반, 현위치, 좋아요, LIVE 피드 버블
- 길게 눌러 장소 제보

### 3D 명당보기 (`FireworkViewer`)

- 명당 좌표 ↔ `FIREWORK_PAD_COORDS` 시선
- `spotViewFraming`, bearing/pitch/fov
- 도시·DEM·위성 타일, 63빌딩 GLB
- `calculateFireworkPickScore(point, facilities, stations)`
- 쿼리: `h`(지면/하늘), `embedded`, spotId, 임의 좌표

## 연구 링크 모델

```json
{
  "id": "instagram-top10-spot-ranking",
  "url": "https://www.instagram.com/p/...",
  "kind": "social",
  "fallbackTitle": "...",
  "fallbackDescription": "...",
  "note": "순위는 게시자의 기준이라 실제 시야와는 다를 수 있어요",
  "spotIds": ["ichon-hangang", "yeouido-hangang"]
}
```

`GET /api/firework/research?id=` 가 OG 미리보기를 보강한다. `spotIds: "*"` 는 전 명당 공통.

## 일본 이식 시 바로 깨지는 부분

1. **단일 행사 가정.** 9월 4일 이후 일본은 행사가 여러 개다.
2. **서울 인구 API.** 일본에는 동일 소스가 없다. v1에서 빼거나 대체 소스가 필요하다.
3. **한화/서울경찰청 공지 구조.** 일본은 실행위원회·관광협회·JR 공지가 쪼개진다.
4. **유료석이 예외가 아니라 기본.** 酒田만 해도 좌석 종류가 10종 넘는다.
5. **우천 정책.** 雨天決行 / 荒天中止 / 順延. 서울 앱에는 이 필드가 없다.
6. **3D·자체 타일·지하철 GeoJSON**은 서울 전용 자산이다.

## 출처

- 현장 UI: https://spotts.kr/firework , https://spotts.kr/firework/p/yeouido-hangang
- 공개 API: `/api/firework/reports`, `/api/population`, `/api/firework/research?id=`
- 클라이언트 번들 식별자: `3hcbnaczhkhsu.js` (event/spots JSON), `208u4twqtlfy_.js` (research links), `1gwibbqd77o1k.js` (뷰어/점수)
- robots.txt: https://spotts.kr/robots.txt
