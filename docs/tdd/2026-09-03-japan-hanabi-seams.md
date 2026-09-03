# TDD: 일본 불꽃놀이 지도

> PRD: [../prd/2026-09-03-japan-hanabi-map.md](../prd/2026-09-03-japan-hanabi-map.md)  
> 루프: red → green. 리팩터는 리뷰 단계.  
> 테스트는 공개 시임만. 내부 collaborator를 목하지 않는다.

## 확정할 시임

구현 전에 이 아홉 개만 테스트한다. 여기 없는 시임에는 테스트를 쓰지 않는다.

| # | 시임 | 공개 함수 | 왜 |
| --- | --- | --- | --- |
| S1 | 카탈로그 질의 | `listFestivals(catalog, query)` | 제품의 첫 화면. 날짜·확정 필터가 틀리면 지난 여름 대회가 다시 나온다. |
| S2 | 시리즈 묶기 | `listFestivalDates(catalog, seriesId)` | 열해처럼 같은 장소 여러 날. |
| S3 | 발사 거리 | `distanceMetersToLaunch(spot, launch)` | 원본 `distanceMeters` 계약. 저장값과 계산값이 같아야 한다. |
| S4 | 명당 정렬 | `sortSpots(spots)` | 설 수 있는 가까운 자리 먼저. 통제·앵커 없음은 맨 아래. |
| S5 | 행사일 | `isFestivalDay(festival, now)` | 타임존 `Asia/Tokyo`. UTC로 자르면 날짜가 하루 밀린다. |
| S6 | JSON 계약 | `assertCatalogIntegrity(data)` | 원본과 같이 없는 id를 적으면 실패. |
| S7 | 거리×통제 | `assessSpotAccess(spot, festival, controls)` | 직선 803m라도 반경 안이면 못 선다. 차량 규제만으로는 막지 않는다. |
| S8 | 우회 거리 | `assessSpotAccess` 의 `walkMeters` | 우회가 직선보다 짧으면 데이터가 아니다. |
| S9 | 통제 계약 | `assertCatalogIntegrity` | `launch_perimeter`에 반경 없고, 없는 명당을 잠그면 실패. |

시스템 경계(지도 타일, Web Share, 외부 길찾기)는 목한다. 도메인 함수는 목하지 않는다.

기대값은 리터럴이다. `haversine`을 다시 돌려 expected를 만들지 않는다.

## 디렉터리

```
src/domain/festival.ts          listFestivals, listFestivalDates, isFestivalDay
src/domain/spot.ts              distanceMetersToLaunch, sortSpots
src/domain/integrity.ts         assertCatalogIntegrity
src/domain/types.ts
data/festivals.json
data/spots.json
data/paid-seats.json
data/research-links.json
data/.schema/*.schema.json
tests/domain/list-festivals.test.ts
tests/domain/spot-distance.test.ts
tests/domain/integrity.test.ts
```

UI는 도메인 테스트가 초록이 된 뒤. UI 테스트는 이 문서 v1에 넣지 않는다.

## 픽스처 리터럴

`Asia/Tokyo`. 카탈로그 질의 테스트는 아래 4행만 사용한다.

```ts
const FIXTURE = [
  {
    id: "sakata-hanabi-2026",
    seriesId: "sakata-hanabi",
    date: "2026-09-12",
    prefecture: "山形県",
    city: "酒田市",
    confirmation: "confirmed",
    paidSeats: true,
    rainPolicy: "hold",
    launch: { lng: 139.843, lat: 38.914 },
  },
  {
    id: "atami-kaijo-2026-09-13",
    seriesId: "atami-kaijo",
    date: "2026-09-13",
    prefecture: "静岡県",
    city: "熱海市",
    confirmation: "confirmed",
    paidSeats: true,
    rainPolicy: "hold",
    launch: { lng: 139.077, lat: 35.096 },
  },
  {
    id: "atami-kaijo-2026-10-12",
    seriesId: "atami-kaijo",
    date: "2026-10-12",
    prefecture: "静岡県",
    city: "熱海市",
    confirmation: "confirmed",
    paidSeats: true,
    rainPolicy: "hold",
    launch: { lng: 139.077, lat: 35.096 },
  },
  {
    id: "sumida-2026",
    seriesId: "sumida",
    date: "2026-07-25",
    prefecture: "東京都",
    city: "墨田区",
    confirmation: "confirmed",
    paidSeats: true,
    rainPolicy: "postpone",
    launch: { lng: 139.81, lat: 35.7 },
  },
] as const;
```

열해 발사 좌표 `139.077, 35.096` 은 열해만 추정 앵커다. 공식 좌표가 아니다. 시드에 같은 면책을 넣는다.

## 사이클

### Cycle 1 — S1 기본 필터 (red)

```ts
// tests/domain/list-festivals.test.ts
test("2026-09-04 이후 확정 행사만 날짜순으로 돌려준다", () => {
  const result = listFestivals(FIXTURE, {
    from: "2026-09-04",
    confirmation: "confirmed",
  });
  expect(result.map((f) => f.id)).toEqual([
    "sakata-hanabi-2026",
    "atami-kaijo-2026-09-13",
    "atami-kaijo-2026-10-12",
  ]);
});
```

실패: `listFestivals` 없음.  
최소 구현: `date >= from && confirmation === query.confirmation` 후 `date` 정렬.

### Cycle 2 — S1 오늘 포함

```ts
test("from 당일 행사는 남긴다", () => {
  const result = listFestivals(FIXTURE, {
    from: "2026-09-12",
    confirmation: "confirmed",
  });
  expect(result.map((f) => f.id)).toEqual([
    "sakata-hanabi-2026",
    "atami-kaijo-2026-09-13",
    "atami-kaijo-2026-10-12",
  ]);
});
```

### Cycle 3 — S1 우천·유료

```ts
test("우천 hold 이고 유료석 있는 행사만 남긴다", () => {
  const result = listFestivals(FIXTURE, {
    from: "2026-01-01",
    confirmation: "confirmed",
    rainPolicy: "hold",
    paidSeats: true,
  });
  expect(result.map((f) => f.id)).toEqual([
    "sakata-hanabi-2026",
    "atami-kaijo-2026-09-13",
    "atami-kaijo-2026-10-12",
  ]);
});
```

스미다는 `from` 때문에가 아니라 `rainPolicy: postpone` 이라 빠진다. 이 테스트의 from은 1/1이다. 스미다가 안 나오는 이유는 `rainPolicy` 필터다.

### Cycle 4 — S2 시리즈

```ts
test("열해 시리즈는 날짜순 회차를 돌려준다", () => {
  const result = listFestivalDates(FIXTURE, "atami-kaijo");
  expect(result.map((f) => f.date)).toEqual(["2026-09-13", "2026-10-12"]);
});
```

### Cycle 5 — S5 타임존

```ts
test("도쿄 달력으로 행사일인지 본다", () => {
  const festival = FIXTURE[0]; // 2026-09-12
  expect(
    isFestivalDay(festival, new Date("2026-09-12T00:30:00+09:00")),
  ).toBe(true);
  expect(
    isFestivalDay(festival, new Date("2026-09-11T23:30:00+09:00")),
  ).toBe(false);
});

test("UTC 입력이어도 도쿄 날짜로 자른다", () => {
  const festival = FIXTURE[0];
  expect(isFestivalDay(festival, new Date("2026-09-11T15:30:00Z"))).toBe(true);
  expect(isFestivalDay(festival, new Date("2026-09-11T14:30:00Z"))).toBe(false);
});
```

`Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo" })` 로 날짜 문자열을 만든다. `getUTCDate` 로 자르지 않는다.

### Cycle 6 — S3 거리 리터럴

열해 앵커 `(139.077, 35.096)` 에서 열해역 근처 명당 `(139.0777, 35.1032)` 까지는 **803m**.

독립 계산(한 번만, 테스트 밖에 고정): 지구 반경 6,371,000m haversine 반올림. 테스트는 803만 본다.

```ts
test("열해 선착장 후보에서 발사 앵커까지 803m", () => {
  const meters = distanceMetersToLaunch(
    { lng: 139.0777, lat: 35.1032 },
    { lng: 139.077, lat: 35.096 },
  );
  expect(meters).toBe(803);
});
```

구현: haversine, 반올림 정수 m. 앵커 `null` 이면 `null`.

```ts
test("발사 앵커가 없으면 거리를 만들지 않는다", () => {
  expect(
    distanceMetersToLaunch({ lng: 139.0777, lat: 35.1032 }, null),
  ).toBeNull();
});
```

### Cycle 7 — S3 저장값 일치

```ts
test("시드 distanceMeters 는 런타임 계산과 같다", () => {
  for (const spot of seedSpots) {
    const festival = seedFestivals.find((f) => f.id === spot.festivalId);
    const computed = distanceMetersToLaunch(spot, festival?.launch ?? null);
    expect(spot.distanceMeters).toBe(computed);
  }
});
```

### Cycle 8 — S4 정렬

```ts
test("설 수 있는 자리를 가까운 순으로, 앵커 없는 자리는 맨 아래", () => {
  const sorted = sortSpots([
    { id: "far", distanceMeters: 1200, reachable: true },
    { id: "none", distanceMeters: null, reachable: true },
    { id: "near", distanceMeters: 400, reachable: true },
  ]);
  expect(sorted.map((s) => s.id)).toEqual(["near", "far", "none"]);
});

test("통제로 못 서는 가까운 자리는 설 수 있는 먼 자리보다 아래", () => {
  const sorted = sortSpots([
    { id: "blocked-near", distanceMeters: 80, reachable: false },
    { id: "open-far", distanceMeters: 1200, reachable: true },
  ]);
  expect(sorted.map((s) => s.id)).toEqual(["open-far", "blocked-near"]);
});
```

### Cycle 9 — S6 무결성

```ts
test("spot.festivalId 와 paidSeats.festivalId 는 카탈로그에 있다", () => {
  expect(() =>
    assertCatalogIntegrity({
      festivals: seedFestivals,
      spots: seedSpots,
      paidSeats: seedPaidSeats,
      researchLinks: seedLinks,
    }),
  ).not.toThrow();
});

test("없는 행사 id 를 가리키면 실패한다", () => {
  expect(() =>
    assertCatalogIntegrity({
      festivals: [],
      spots: [{ festivalId: "ghost", id: "x" }],
      paidSeats: [],
      researchLinks: [],
    }),
  ).toThrow(/ghost/);
});

test("researchLink.spotIds 가 카탈로그 밖이면 실패한다", () => {
  expect(() =>
    assertCatalogIntegrity({
      festivals: seedFestivals,
      spots: seedSpots,
      paidSeats: [],
      researchLinks: [{ spotIds: ["ghost-spot"], note: "x", id: "r" }],
    }),
  ).toThrow(/ghost-spot/);
});

test("note 없는 연구 링크는 데이터가 아니다", () => {
  expect(() =>
    assertCatalogIntegrity({
      festivals: seedFestivals,
      spots: seedSpots,
      paidSeats: [],
      researchLinks: [{ id: "r", spotIds: "*", note: "" }],
    }),
  ).toThrow(/note/);
});
```

`spotIds: "*"` 는 존재 검사를 건너뛴다. `note.trim() === ""` 는 실패.

### Cycle 10 — S7 발사 반경

열해 앵커 `(139.077, 35.096)`, 반경 300m. 선착장 `(139.0777, 35.1032)` 는 803m. 근거리 `(139.0772, 35.0961)` 는 21m.

```ts
test("발사 반경 안의 가까운 자리는 설 수 없다", () => {
  const access = assessSpotAccess(
    { id: "pad", lng: 139.0772, lat: 35.0961 },
    { id: "atami-kaijo-2026-09-13", launch: { lng: 139.077, lat: 35.096 } },
    [{
      id: "atami-pad",
      festivalId: "atami-kaijo-2026-09-13",
      kind: "launch_perimeter",
      radiusMeters: 300,
      center: null,
      spotIds: "*",
    }],
  );
  expect(access.crowFlyMeters).toBe(21);
  expect(access.insidePerimeter).toBe(true);
  expect(access.reachable).toBe(false);
  expect(access.controlIds).toEqual(["atami-pad"]);
});

test("반경 밖 803m 선착장은 설 수 있다", () => {
  const access = assessSpotAccess(
    { id: "sunbeach", lng: 139.0777, lat: 35.1032 },
    { id: "atami-kaijo-2026-09-13", launch: { lng: 139.077, lat: 35.096 } },
    [{
      id: "atami-pad",
      festivalId: "atami-kaijo-2026-09-13",
      kind: "launch_perimeter",
      radiusMeters: 300,
      center: null,
      spotIds: "*",
    }],
  );
  expect(access.crowFlyMeters).toBe(803);
  expect(access.insidePerimeter).toBe(false);
  expect(access.reachable).toBe(true);
});
```

### Cycle 11 — S7 차량 vs 보행

```ts
test("차량 규제만 걸린 자리는 걸어가서 설 수 있다", () => {
  const access = assessSpotAccess(
    { id: "swan", lng: 139.84, lat: 38.91 },
    { id: "sakata-hanabi-2026", launch: { lng: 139.843, lat: 38.914 } },
    [{
      id: "sakata-vehicle",
      festivalId: "sakata-hanabi-2026",
      kind: "vehicle",
      radiusMeters: 2000,
      center: { lng: 139.843, lat: 38.914 },
      spotIds: "*",
    }],
  );
  expect(access.vehicleRestricted).toBe(true);
  expect(access.reachable).toBe(true);
});

test("보행 통제에 걸린 자리는 설 수 없다", () => {
  const access = assessSpotAccess(
    { id: "bridge", lng: 139.84, lat: 38.91 },
    { id: "sakata-hanabi-2026", launch: { lng: 139.843, lat: 38.914 } },
    [{
      id: "sakata-ped",
      festivalId: "sakata-hanabi-2026",
      kind: "pedestrian",
      radiusMeters: 2000,
      center: { lng: 139.843, lat: 38.914 },
      spotIds: "*",
    }],
  );
  expect(access.pedestrianBlocked).toBe(true);
  expect(access.reachable).toBe(false);
});
```

다른 행사 통제는 무시한다. `spotIds`가 배열이면 그 명당만 잠근다.

### Cycle 12 — S8 우회

```ts
test("도보 우회가 있으면 직선과 함께 돌려준다", () => {
  const access = assessSpotAccess(
    { id: "detour", lng: 139.0777, lat: 35.1032, walkMeters: 1100 },
    { id: "atami-kaijo-2026-09-13", launch: { lng: 139.077, lat: 35.096 } },
    [],
  );
  expect(access.crowFlyMeters).toBe(803);
  expect(access.walkMeters).toBe(1100);
});
```

우회 < 직선은 integrity에서 실패. `assessSpotAccess`는 시드가 이미 맞다고 가정한다.

### Cycle 13 — S9 통제 계약

```ts
test("발사 반경에 미터가 없으면 실패한다", () => {
  expect(() =>
    assertCatalogIntegrity({
      festivals: [{ id: "a" }],
      spots: [],
      paidSeats: [],
      researchLinks: [],
      controls: [{ id: "c", festivalId: "a", kind: "launch_perimeter", radiusMeters: null, spotIds: "*" }],
    }),
  ).toThrow(/radiusMeters/);
});
```

## 구현 순서 (도메인만)

1. types + `listFestivals`  
2. `listFestivalDates`  
3. `isFestivalDay`  
4. `distanceMetersToLaunch`  
5. `assessSpotAccess`  
6. `sortSpots`  
7. JSON 시드 + `assertCatalogIntegrity`  
8. UI는 이 함수만 호출

한 사이클에 테스트 하나. 통과하기 전에 다음 테스트를 쓰지 않는다.

## 명시적 비시임

- MapLibre 렌더, 마커 클릭  
- 3D 뷰어, pick score  
- `/api/population` 대체  
- 제보 POST  
- i18n 사전 키 전수  
- 티켓 HTML 파싱  

## 도구

- 러너: Vitest  
- 언어: TypeScript  
- 검증: Zod는 integrity 다음. 도메인 테스트가 먼저 스키마를 이긴다.
