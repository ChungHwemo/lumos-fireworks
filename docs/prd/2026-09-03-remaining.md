# PRD: 남은 처리 (MVP 이후)

> 상태: 2026-09-03 사이클에서 구현함.  
> 작성: 2026-09-03. 기준일: 2026-09-04 `Asia/Tokyo`.  
> 원 PRD: [2026-09-03-japan-hanabi-map.md](./2026-09-03-japan-hanabi-map.md)  
> 코드: https://github.com/ChungHwemo/lumos-fireworks  
> 공개 URL: https://chunghwemo.github.io/lumos-fireworks/  
> 커밋 작성자 고정: `tolaria <tolaria@naver.com>`.

한국 여행자가 9/4 이후 일본 花火를 고르고, 직선거리와 통제를 같이 보고 자리를 정하는 비공식 지도.

## 끝난 것

- 카탈로그 `/`, 행사 `/e/{id}`, 명당 `/e/{id}/p/{id}`, 시선 `/e/{id}/p/{id}/3d`
- `?from=` 기본 `2026-09-04`. 시즌 행사는 `dateEnd`가 from 이후면 남김
- 명당 이름/`aliases` 검색. 구글 지오코딩 없음
- 행사·명당 화면에 공유 카피
- 탭 `aria-current="page"` 한 개
- 영어는 UI만. 본문은 한국어 + `nameJa`
- CI `npm test` + `tsc`. GitHub Pages
- 공식 URL이 잠긴 행사 시드. 沼田/沖縄かなさ는 URL 미잠금이라 없음
- 시선 스케치(Three.js). 예상 혼잡 레이어. 로컬 제보

## 아직 사람 눈으로 볼 것

- R1: 실제 Chrome/Safari에서 熱海·酒田 지도에 地理院タイル이 보이는지. Cursor 내장 브라우저는 WebGL 합성이 검게 나올 수 있다.

## 하지 않음

- 서울 63 GLB/DEM 클론, 지리원 타일 재호스트
- 일본 실시간 인구 API (동급 공개 API 없음. 가짜 실시간 금지)
- 제보 서버·계정·좋아요
- 티켓 결제·재고
- 전 일본 화장실 POI
- 구글/야후 지도 SDK
- 일정 크롤링

## 리스크

- 일정이 바뀐다. 공식 URL을 이긴다.
- 발사 앵커는 추정이라 거리가 틀릴 수 있다.
- GitHub Pages URL은 Actions 배포가 한 번 성공한 뒤에 산다.
