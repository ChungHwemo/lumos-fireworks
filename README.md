# 일본 불꽃놀이 지도

2026-09-04 이후 일본 花火大会 비공식 지도. 공식 앱이 아닙니다.

공개 URL: https://chunghwemo.github.io/lumos-fireworks/

```
npm install
npm test
npm run dev
```

- 목록 `/` — `?from=2026-09-04`
- 행사 `/e/{festivalId}`
- 명당 `/e/{festivalId}/p/{spotId}`
- 시선 스케치 `/e/{festivalId}/p/{spotId}/3d`
- 임의 좌표 공유 `?lng=&lat=`

지도 배경은 국토지리원 [地理院タイル](https://maps.gsi.go.jp/development/ichiran.html)입니다. 지형 표고는 AWS Terrain Tiles(SRTM terrain data courtesy of the U.S. Geological Survey)입니다. 어느 쪽도 저장·재배포하지 않습니다.

지도 픽토그램은 [Material Symbols](https://github.com/google/material-design-icons) (Apache-2.0)입니다. 발사 지점 아이콘만 자체 제작입니다.

시선 스케치는 Three.js 바닥·바다·발사 마커입니다. DEM/GLB가 아닙니다. 혼잡은 시드+로컬 제보 예상값이며 실시간 인구가 아닙니다. 제보는 이 브라우저 `localStorage`에만 남습니다.
