# 일본 불꽃놀이 지도

2026-09-04 이후 일본 花火大会 비공식 지도. 공식 앱이 아닙니다.

공개 URL: https://chunghwemo.github.io/lumos-fireworks/

```
npm install
npm run check     # typecheck + lint + test
npm run dev
npm run build     # dist/ + GitHub Pages 용 404.html
```

- 목록 `/` — 필터는 전부 쿼리다. `?from=2026-09-04&hold=1&paid=1&pref=静岡県`
- 행사 `/e/{festivalId}` — `?tab=spots|reports|settings`, 레이어 `ctl|crowd|fw=0`, 배경 `map=photo|pale`
- 명당 `/e/{festivalId}/p/{spotId}`
- 시선 스케치 `/e/{festivalId}/p/{spotId}/3d`
- 임의 좌표 공유 `?lng=&lat=`

## 지도

엔진은 MapLibre GL JS 6. 배경은 셋이고 어느 쪽도 저장·프록시하지 않습니다.

- **야경 지도(기본)** — 국토지리원 [最適化ベクトルタイル](https://github.com/gsi-cyberjapan/optimal_bvmap)을 브라우저가 직접 읽습니다. 국토지리원이 공개한 표준지도풍 스타일을 `src/ui/map/gsi-optimal-std.json`에 두고, `gsi-style.ts`가 색만 밤 팔레트로 바꿉니다. 글꼴·스프라이트도 국토지리원 것입니다.
- **위성 야경** — [地理院タイル](https://maps.gsi.go.jp/development/ichiran.html) シームレス空中写真을 어둡게 눌러 표시합니다.
- **담색 지도** — 地理院タイル 淡色地図.

조작은 시트 위 오른쪽 묶음에서 합니다: 컴패스(탭 = 북쪽, 끌기 = 회전·기울기), 45° 회전, 2D/3D, 자동 회전 재생/정지, 현위치, 확대/축소. 우클릭·Ctrl 드래그·두 손가락 회전과 `Shift`+방향키도 그대로 됩니다. 진입 시 자동으로 90°/40초 돌고, 지도를 만지면 멈춥니다.

지형 표고는 AWS Terrain Tiles(SRTM terrain data courtesy of the U.S. Geological Survey)입니다. 국토지리원 DEM을 쓰지 않는 이유는 `docs/prd/2026-09-03-map-3d-fireworks.md` D2에 있습니다.

지도 핀 픽토그램은 [Material Symbols](https://github.com/google/material-design-icons) (Apache-2.0)이고 발사 지점 아이콘과 UI 선 아이콘(`src/ui/Icon.tsx`)은 자체 제작입니다.

## 불꽃

발사 추정 앵커 위에서 Three.js 입자가 터집니다. 牡丹·菊·柳·輪·銀冠·椰子 여섯 종류를 돌며, 셸 궤적·입자 방향·발사 간격은 `src/domain/burst.ts`의 순수 함수라 테스트로 고정되어 있습니다. 토글로 끄고, 탭이 숨겨지거나 `prefers-reduced-motion`이면 멈춥니다. 연출이지 발사 데이터가 아닙니다.

## 데이터

행사·명당·통제·유료석·연구 링크는 `docs/data/*.seed.json`입니다. `assertCatalogIntegrity`가 참조·거리·좌표·날짜·URL 을 검사하고 CI 가 막습니다. 시선 스케치는 Three.js 바닥·바다·발사 마커이며 DEM/GLB가 아닙니다. 혼잡은 시드+로컬 제보 예상값이며 실시간 인구가 아닙니다. 제보는 이 브라우저 `localStorage`에만 남습니다.
