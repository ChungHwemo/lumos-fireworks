# CONTEXT

일본 불꽃놀이(花火大会) 비공식 지도. 기준일 2026-09-04 이후.

도메인 말:

- **festival** — 하루짜리 행사 row. 열해처럼 같은 장소 여러 날은 `seriesId`로 묶고 row는 날짜마다 둔다.
- **spot** — 관람 후보. 원본 spotts의 명당.
- **launch** — 발사 추정 앵커. 거리의 유일한 기준.
- **confirmed** — 공식/실행위원회 페이지로 날짜가 잠긴 행사. 목록 기본값.
- **rainPolicy** — `hold`(雨天決行) `cancel`(荒天中止) `postpone`(順延) `unknown`.
- **distanceMeters** — launch까지 직선 정수 미터. 앵커 없으면 null.
- **control** — 발사 반경·차량·보행·역·유료 게이트. 직선으로 가까워도 보행/반경에 걸리면 명당이 아니다.
- **reachable** — 그 자리에 서서 볼 수 있는가. 차량 규제만으로는 false가 되지 않는다.

공개 함수 이름은 TDD 문서의 시임을 따른다. `listFestivals`, `listFestivalDates`, `isFestivalDay`, `distanceMetersToLaunch`, `sortSpots`, `assertCatalogIntegrity`(`catalogIssues`).

- **basemap** — `night`(国土地理院 최적화 벡터타일 재색) · `photo`(空中写真 어둡게) · `pale`(淡色地図). URL `?map=`. 없으면 night.
- **shell** — 불꽃 한 발. `kind` 牡丹·菊·柳·輪·銀冠·椰子. 궤적·입자 방향·간격은 `src/domain/burst.ts` 순수 함수. 연출이며 데이터가 아니다.
- **sheet** — 지도 위 정보 패널. 모바일은 바텀시트, 880px 부터 오른쪽 패널.
