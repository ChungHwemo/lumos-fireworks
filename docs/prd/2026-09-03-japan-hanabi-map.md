# PRD: 2026년 9월 4일 이후 일본 불꽃놀이 지도

> 상태: 초안. 구현은 이 문서 승인 후 TDD로 시작한다.  
> 기준일: 2026-09-04 (포함) 이후. 작성일: 2026-09-03.  
> 원본 IA: [spotts.kr/firework 리버스](../research/2026-09-03-spotts-firework-reverse.md)  
> 일정 조사: [9/4 이후 일본 花火](../research/2026-09-03-japan-hanabi-after-sep4.md)  
> 통제 시드: [controls.seed.json](../data/controls.seed.json)

## 1. 한 줄

한국 여행자가 **2026년 9월 4일 이후 남아 있는 일본 花火大会**를 고르고, 각 행사에서 **발사 지점까지의 거리·유료/무료·우천·교통**을 보고 자리를 정하는 비공식 지도.

## 2. 왜 이 제품인가

spotts.kr/firework는 서울세계불꽃축제 **하루(9/5, 전야 9/4)** 에 모든 화면을 고정한다. 같은 날짜대 일본은 행사가 흩어져 있다. 여름 성수기(스미다·나가오카 등)는 이미 끝났고, 남은 것은 가을·겨울 대회와 열해처럼 여러 번 쏘는 온천 도시다.

여행자가 실제로 묻는 질문은 세 개다.

1. 오늘 이후 뭐가 남았나.
2. 그 자리에서 불꽃이 얼마나 가까운가. 돈 내야 하나.
3. 비 오면 어떻게 되나. 전철로 빠질 수 있나.

## 3. 사용자

- 1순위: 한국어 UI를 쓰는 방일 여행자. 도쿄·온천·도호쿠를 9–12월에 도는 사람.
- 2순위: 같은 데이터를 영어로 보는 여행자 (원본과 같이 `ko` / `en` / 시스템).
- 비사용자: 주최 측 운영 콘솔, 티켓 결제, 공식 대행.

## 4. 접근 세 가지와 결정

| | A. 카탈로그 + 행사별 딥맵 | B. 행사 하나 클론 | C. 정적 가이드 |
| --- | --- | --- | --- |
| 맞는 점 | 9/4 이후 일본의 실제 형태 | 원본과 화면이 1:1 | 빨리 씀 |
| 안 맞는 점 | 행사마다 명당을 채워야 함 | 다음 주 행사가 바뀜 | 지도·거리·공유가 없음 |
| 결정 | **A** | 기각 | 기각 |

A의 첫 딥맵은 **열해 해상 불꽃(熱海海上花火大会)**. 2026 일정이 공식 관광 사이트에 이미 박혀 있고, 9/13부터 12/25까지 반복된다. 두 번째는 공식 페이지가 두꺼운 **酒田の花火(9/12)**.

서울 인구 API, 3D 명당보기, 자체 타일 서버는 v1에서 뺀다. 원본의 **정보 구조와 문구 습관**(비공식 고지, 출처 한계 `note`, 거리 면책)만 옮긴다.

## 5. 제품 원칙

1. 공식 사이트가 아니다. 모든 행사·명당 화면에 고지를 고정한다.
2. 날짜·시간·우천·유료석은 공식 URL을 이기고, SNS는 후보 발굴용이다. 각 링크에 한계 `note`가 없으면 데이터가 아니다.
3. `distanceMeters`는 그 행사의 **발사 추정 앵커**까지 직선거리다. 앵커가 없으면 거리를 보여주지 않는다. 직선으로 가까워도 통제면 명당이 아니다.
4. 확정(`confirmed`)과 예년 추정(`unconfirmed`)을 섞지 않는다. 목록 기본값은 `confirmed`만.
5. 기준 시각은 `Asia/Tokyo`. 필터 `from` 기본값은 `2026-09-04`.
6. 통제는 종류를 섞지 않는다. 차량 규제는 걸어갈 수 있고, 발사 반경·보행 통제·역 출입 통제는 그 자리에 설 수 없다. 유료 게이트는 설 수 있으나 표가 필요하다.

## 6. 범위

### v1 (이번 TDD 사이클)

- 행사 목록: 2026-09-04 이후, 확정분만. 현·날짜·우천 정책 필터.
- 행사 상세: 일정, 발사 앵커, 우천, 공식 링크, 유료석 요약, 교통 한 줄.
- 명당 목록/상세: 원본 Spot 필드 중 일본에 남는 것. 지도(MapLibre + 地理院タイル) + 검색 + 거리 정렬.
- 친구와 좌표 공유 (Web Share / 쿼리 `?lng=&lat=`).
- 언어 `ko` / `en`.
- 데이터는 리포지토리 JSON. 런타임에 스크레이프하지 않는다.

### v1에서 하지 않음

- 3D 명당보기, DEM, GLB
- 서울/일본 실시간 인구 히트맵
- 현장 제보 저장소 (스키마만 예고)
- 티켓 결제, 좌석 재고
- 계정, 좋아요 동기화
- 전 일본 화장실 POI 전수
- 선곡표 (대부분의 가을 대회는 공개하지 않음. 필드만 optional)

### v2

- 현장 제보 (`crowd|restroom|food|traffic|firework|other`)
- 행사별 통제 폴리곤
- 연구 링크 OG 미리보기
- 열해처럼 같은 장소 여러 날짜를 한 행사 시리즈로 묶기 (v1은 date row)

## 7. 정보 구조

```
/                         카탈로그. 다가오는 행사
/e/{festivalId}           행사 홈 = 원본 /firework
/e/{festivalId}/p/{spotId} 명당 상세 = 원본 /firework/p/{id}
```

행사 홈 탭: 행사 · 관람 Spot · (v2 실시간) · 설정.

카탈로그 카드 한 장에 들어가는 것:

- 날짜, 요일, 현, 도시
- 한국어·일본어 이름
- 발사 시각
- `rainPolicy`: `hold` | `cancel` | `postpone` | `unknown`
- `confirmation`: `confirmed`
- 유료석 여부
- 가장 가까운 역 한 줄

## 8. 도메인 모델

### Festival

```ts
type RainPolicy = "hold" | "cancel" | "postpone" | "unknown";
type Confirmation = "confirmed" | "unconfirmed";

type Festival = {
  id: string;                    // atami-kaijo-2026-09-13
  seriesId: string;              // atami-kaijo
  nameKo: string;
  nameJa: string;
  prefecture: string;            // 静岡県
  city: string;                  // 熱海市
  date: string;                  // 2026-09-13
  startTime: string;             // 20:20
  endTime: string;               // 20:40
  timeZone: "Asia/Tokyo";
  venueKo: string;
  venueJa: string;
  launch: { lng: number; lat: number } | null;
  rainPolicy: RainPolicy;
  rainNoteKo: string;
  officialUrl: string;
  confirmation: Confirmation;
  shellsApprox: number | null;
  paidSeats: boolean;
  nearestStationKo: string;
  disclaimerKo: string;
};
```

같은 시리즈(열해)는 `seriesId`로 묶고, 날짜마다 row를 둔다. 카탈로그는 row 단위로 보여 준다.

### Spot

원본 필드를 유지한다. `roomId` / `populationArea` 는 v1에서 제거한다.

```ts
type Spot = {
  id: string;
  festivalId: string;
  nameKo: string;
  nameJa: string;
  lng: number;
  lat: number;
  aliases: string[];
  descriptionKo: string;
  viewingKo: string;
  restroomKo: string;
  foodKo: string;
  transitKo: string;
  crowdKo: string;
  distanceMeters: number | null; // launch가 있을 때만 계산·저장
  isViewpoint: true;
  paid: boolean;
  accessNoticeKo: string;
  visibilityNoteKo?: string;
  updatedAt: string;
};
```

`distanceMeters`는 저장값과 런타임 계산이 1m 이상 어긋나면 테스트가 실패한다. 원본과 같은 계약이다.

직선거리만으로 순위를 매기지 않는다. 원본의 「통제 지역」탭과 같이, 가까워도 못 가는 자리를 걸러야 한다.

### ControlZone

일본 대회에서 거리가 통제와 어긋나는 전형적인 경우:

- 발사 지점 일정 반경 출입금지 (熱海는 정오부터 발사 지점 출입금지)
- 특정 정(町) 차량 진입 규제 (酒田 堤町·若原町 등). 걸어가면 됨
- 강변·다리 보행 정지
- 역 출구 임시 통제
- 유료석 게이트. 표 없으면 그 구역에 못 들어감

```ts
type ControlKind =
  | "launch_perimeter"
  | "vehicle"
  | "pedestrian"
  | "station"
  | "paid_gate";

type ControlZone = {
  id: string;
  festivalId: string;
  kind: ControlKind;
  titleKo: string;
  scheduleKo: string;
  detailKo: string;
  officialUrl: string | null;
  center: { lng: number; lat: number } | null; // 없으면 festival.launch
  radiusMeters: number | null;                 // launch_perimeter는 필수
  spotIds: string[] | "*";                     // station/paid_gate가 특정 명당만 잠글 때
};
```

`assessSpotAccess(spot, festival, controls)` 가 공개 결과다.

```ts
type SpotAccess = {
  crowFlyMeters: number | null;
  walkMeters: number | null;       // 우회가 있으면 시드값. 없으면 null
  insidePerimeter: boolean;
  vehicleRestricted: boolean;
  pedestrianBlocked: boolean;
  ticketRequired: boolean;
  stationControlled: boolean;
  reachable: boolean;              // 그 자리에 서서 볼 수 있는가
  controlIds: string[];
};
```

- `reachable === false` ⇔ 발사 반경 안이거나 보행/역 통제에 걸림
- 차량 규제만 걸린 자리는 `reachable === true`, `vehicleRestricted === true`
- `walkMeters`가 있으면 직선보다 짧을 수 없다 (우회)

### PaidSeat (행사 요약, 전 좌석 복제가 아님)

```ts
type PaidSeat = {
  festivalId: string;
  zoneKo: string;
  priceJpy: number | null;
  noteKo: string;
  ticketUrl: string | null;
};
```

### ResearchLink

원본과 동일. `spotIds: string[] | "*"`. `note` 필수.

## 9. v1 시드 행사 (confirmed만)

날짜는 공식 또는 실행위원회 페이지 기준. 미확인 행사는 데이터에 넣지 않는다.

| 날짜 | id | 이름 | 근거 |
| --- | --- | --- | --- |
| 2026-09-12 | `sakata-hanabi-2026` | 酒田の花火 | https://sakata-hanabi.com/summary/ 19:00–20:00, 雨天決行·荒天中止·순연 없음. 最上川河川公園. 약 10,000발. 유료석+무료(スワンパーク). |
| 2026-09-12 | `joso-kinugawa-2026` | 常総きぬ川花火大会 | https://joso-hanabi.jp/ 개최일 2026-09-12. 당일 07:00 태도 결정. |
| 2026-09-13 | `atami-kaijo-2026-09-13` | 熱海海上花火大会 | https://www.ataminews.gr.jp/event/8/ 20:20–20:40, 雨天決行, 熱海湾, 가을 약 3,000발. |
| 2026-10-12 | `atami-kaijo-2026-10-12` | 熱海海上花火大会 | 동일 공식 |
| 2026-10-25 | `atami-kaijo-2026-10-25` | 熱海海上花火大会 | 동일 공식 |
| 2026-11-08 | `atami-kaijo-2026-11-08` | 熱海海上花火大会 | 동일 공식 |
| 2026-11-23 | `atami-kaijo-2026-11-23` | 熱海海上花火大会 | 동일 공식 |
| 2026-12-06 | `atami-kaijo-2026-12-06` | 熱海海上花火大会 | 동일 공식 |
| 2026-12-25 | `atami-kaijo-2026-12-25` | 熱海海上花火大会 | 동일 공식 |

v1 딥맵 명당을 채우는 행사: `atami-kaijo-2026-09-13`, `sakata-hanabi-2026`. 나머지 열해 날짜는 같은 `seriesId`의 명당을 공유한다.

카탈로그에만 있고 명당이 0인 행사는 상세에서 일정·우천·공식 링크만 보여 주고, "명당 조사 전"을 명시한다.

시드에 아직 넣지 않는 것 (공식 URL을 잠그면 추가):

- 北海道芸術花火 2026-09-05
- 片貝まつり奉納大煙火 2026-09-11–12
- 沼田花火大会 2026-09-12
- 沖縄かなさ花火 2026-09-19
- 大洗海上花火大会 2026-09-26
- 大曲の花火―秋の章― 2026-10-03

추정(`unconfirmed`)으로 목록에 섞지 않는다.

## 10. 기능 요구

### F1. 카탈로그

- `from=2026-09-04` 기본. 지난 날짜 row는 숨긴다. 오늘이 행사일이면 남긴다.
- 정렬: 날짜 오름차순, 같은 날 도시명.
- 현 필터, 유료석 있음 필터, 우천 `hold`만 보기.
- `confirmation !== confirmed` 는 기본 목록에 없다.

### F2. 행사 홈

- 원본 행사 탭과 같은 위계: 제목, 날짜, 시간, 장소, 공식 링크, 우천, 유료석 요약, 일정.
- 선곡표는 데이터가 있을 때만 섹션을 그린다.
- 명당 미리보기: 그 행사 `isViewpoint` 중 거리 가까운 4곳.
- 면책 + 공식 재확인 CTA.

### F3. 명당

- 정렬: 설 수 있는 자리(`reachable`)를 직선거리 오름차순으로 먼저, 통제로 못 서는 자리와 앵커 없는 자리는 맨 아래.
- 유료 게이트면 `유료` 뱃지. 발사 반경/보행/역 통제면 `통제` 뱃지. 차량 규제만이면 `차량규제` (걸어갈 수 있음).
- 상세 6칸: 관람 포인트, 예상 혼잡, 화장실, 먹거리, 교통, 입장·이동.
- 입장·이동 칸에 걸린 통제 제목과 일정을 붙인다. 직선거리와 도보 우회가 다르면 둘 다 보여 준다.
- 길찾기는 외부 지도 URL만 연다 (Google / Apple). 자체 라우팅 없음.
- 지도 「명당 탐색 / 통제 지역」 토글은 원본과 같다. 통제 레이어는 `ControlZone`이다.

### F4. 지도

- 엔진은 MapLibre. 배경은 国土地理院 地理院タイル를 **브라우저가 실시간으로** 읽는다. 기본 `pale`, 전환 `std`. 우리 서버는 타일을 프록시·캐시하지 않는다.
- 구글 Maps JS / 야후 JS맵 SDK / 야후 embed는 본지도로 쓰지 않는다. 근거: `docs/research/2026-09-03-japan-map-api.md`.
- 발사 앵커 1개, 명당 N개, `ControlZone` 폴리곤은 우리 GeoJSON.
- 선택 시 시트와 URL이 동기화된다.
- 현위치, 나침반. 장소 검색은 v1에서 시드 좌표만. 구글 지오코딩을 GSI 지도 위에 올리지 않는다.
- 출처: 「地理院タイル」+ https://maps.gsi.go.jp/development/ichiran.html 링크. 야간 다크 벡터는 v1 이후.

### F5. 공유

- 행사 URL, 명당 URL, 임의 좌표 URL.
- 카피: "친구에게 위치 공유하고 명당 찾기".

### F6. i18n

- 지명 `nameJa`는 두 언어 모두 병기.
- UI 문자열만 `ko`/`en`.

## 11. 비기능

- 모바일 360px 첫 타깃. 하단 시트 + 지도.
- 정적 데이터는 빌드에 포함. 목록 필터는 클라이언트 순수 함수로도 돌아가야 한다 (TDD 시임).
- 외부 요청: 지도 타일, 공유, 길찾기뿐.
- 접근성: 탭·검색·리스트는 버튼명/heading이 원본처럼 읽혀야 한다.
- 라이선스: 地図は「地理院タイル」출처 + 목록 페이지 링크. 불꽃 사진은 직접 찍거나 라이선스 있는 것만. 구글/야후 타일을 저장·재배포하지 않는다.

## 12. 성공 기준

- 2026-09-04 00:00 `Asia/Tokyo` 기준으로 카탈로그에 9/3 행사가 0건.
- 酒田 9/12, 熱海 9/13이 목록 상단에 보인다.
- 熱海 명당 상세에서 발사 앵커까지 거리가 시드와 일치한다.
- 아무 화면에서나 "공식 정보가 아님"이 보인다.
- 스키마 참조가 깨지면 CI가 빨갛다.

## 13. 리스크

- 일정이 갑자기 바뀐다. `officialUrl`과 `updatedAt`으로만 대응. 크롤링 자동 갱신 없음.
- 발사 좌표는 추정이다. 원본과 같은 면책 문장을 쓴다.
- 유료석 가격은 금방 달라진다. 가격은 참고, 구매는 공식 URL.
- 원본 3D/인구를 기대하면 실망한다. v1 카피에 "실시간 인구·3D는 없음"을 설정 화면에 적는다.
