# 2026-09-03 일본 불꽃놀이 지도 설계

승인용 짧은 설계. 자세한 요구는 PRD, 테스트는 TDD.

- PRD: `docs/prd/2026-09-03-japan-hanabi-map.md`
- TDD: `docs/tdd/2026-09-03-japan-hanabi-seams.md`
- 리버스: `docs/research/2026-09-03-spotts-firework-reverse.md`

## 무엇을 만드는가

spotts.kr/firework의 **정보 구조**를 일본 가을·겨울 花火에 옮긴다. 단일 행사 앱이 아니라 **카탈로그 + 행사별 딥맵**.

첫 딥맵: 熱海海上花火大会(시리즈), 酒田の花火(2026-09-12).

## 경계

하는 것: 확정 일정 목록, 명당, 발사 앵커 거리, 우천, 유료석 요약, 공식 링크, 좌표 공유, ko/en.

안 하는 것: 3D 뷰어, 실시간 인구, 제보 백엔드, 티켓 결제, 스크레이핑, 구글/야후 지도 SDK, 타일 재호스팅.

베이스맵: MapLibre + GSI `pale`/`std`. 조사: `docs/research/2026-09-03-japan-map-api.md`.

## 아키텍처

JSON 시드 → 순수 도메인 함수 → 나중에 UI. 도메인이 UI를 모른다. 참조 id가 없으면 테스트가 실패한다.

타임존은 항상 `Asia/Tokyo`. 기본 `from`은 `2026-09-04`.

## 단위

- `listFestivals` — 카탈로그 질의
- `distanceMetersToLaunch` / `sortSpots` — 명당
- `isFestivalDay` — 행사일
- `assertCatalogIntegrity` — 데이터 계약
