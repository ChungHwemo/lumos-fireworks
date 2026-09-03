# PRD: 3D 지도와 발사 지점 불꽃

> 상태: 승인됨. 구현은 이 문서의 TDD 시임부터.
> 작성: 2026-09-03. 기준일: 2026-09-04 `Asia/Tokyo`.
> 원 PRD: [2026-09-03-japan-hanabi-map.md](./2026-09-03-japan-hanabi-map.md)
> 직전 사이클: [2026-09-03-remaining.md](./2026-09-03-remaining.md)
> 커밋 작성자 고정: `tolaria <tolaria@naver.com>`.

행사·명당 지도를 기울여 지형이 보이게 하고, 발사 추정 지점에서 불꽃이 터지게 한다.
같이 지도 핀의 한 글자 라벨을 픽토그램과 단어로 바꾼다.

## 1. 왜

세 가지가 지금 안 된다.

1. 지도가 평면이다. 熱海는 산이 바다로 떨어지는 지형이고, 명당이 보이느냐 안 보이느냐가 그 기복에 달려 있다. 위에서 내려다보는 평면 지도는 그 정보를 못 준다.
2. 발사 지점이 점 하나다. 「여기서 쏜다」가 그림으로 안 보인다.
3. 핀이 한 글자다. `打` `역` `St` `공` `L` `S`. 뜻이 안 통한다.

## 2. 결정

### D1. 엔진은 MapLibre를 유지한다

원 PRD F4가 「엔진은 MapLibre」로 못박혀 있고, 타일·마커·통제 폴리곤·URL 동기화가 전부 거기 붙어 있다.
Three.js는 MapLibre custom layer 안에서 **불꽃만** 그린다. 카메라·투영은 MapLibre 것을 그대로 쓴다.

기각한 것: Three.js 전면 교체. 타일 로더·카메라 컨트롤·피킹·폴리곤을 전부 다시 써야 하고 원 PRD F4 개정이 필요하다.

### D2. 지형 DEM은 AWS Terrain Tiles. 국토지리원 DEM은 쓸 수 없다

`https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png`.
MapLibre `raster-dem` + `encoding: "terrarium"` 네이티브 지원. 키 불필요.
2026-09-03 확인: `200` / `image/png` / `access-control-allow-origin: *`.
저장·재배포·프록시하지 않는다. 배경 래스터는 그대로 地理院タイル이다.

**국토지리원 DEM을 기각한 이유는 실측이다.** z13 타일에서 무효 화소를 셌다.

| 소스 | 熱海 | 酒田 | 諏訪 | 판정 |
| --- | --- | --- | --- | --- |
| GSI `dem_png` | 198 | 0 | 0 | 바다가 전부 무효 |
| GSI `dem5a_png` | 199 | 0 | 595 | 육지에도 구멍 |
| AWS terrarium | 0 | 0 | 0 | 깨끗. 바다는 실제 수심 |

국토지리원 DEM의 무효 화소는 `RGB(128,0,0)`이다. GSI 인코딩
(`h = 0.01 × (65536R + 256G + B)`)을 MapLibre custom encoding
(`redFactor 655.36, greenFactor 2.56, blueFactor 0.01`)으로 옮기면 그 화소가
`128 × 655.36 = 83,886m`가 된다. 熱海湾 전체가 84km 벽으로 선다.
MapLibre custom encoding은 고정 선형식이라 무효 화소를 거를 수 없고,
전처리하려면 타일을 프록시해야 하는데 그건 금지다.

`r = 128`은 무효 화소 전용이다. 그 값이 뜻하는 높이 범위는 `-83,886m ~ -83,230m`라
실제 지형에 존재하지 않는다. 그래도 MapLibre 쪽에서 분기할 방법이 없다.

출처 표기는 두 줄이 된다. 배경은 「地理院タイル」, 표고는 SRTM/USGS
(응답 헤더 `x-amz-meta-x-imagery-sources: srtm/N35E138.tif`로 확인).
문구는 tilezen/joerd `docs/attribution.md`가 요구하는 것을 쓴다.

### D3. 불꽃은 상시 재생, 끄기 토글

기준일이 2026-09-04라 시드 행사는 전부 미래다. 발사 시각에만 재생하면 지금은 어디서도 안 보인다.
지도에 들어오면 계속 터지고, 토글로 끈다. 기본은 켬.

기각한 것: 발사 시각 판정 로직. 지금 상태에서 항상 거짓이라 코드만 늘고 아무것도 안 보여 준다.

### D4. 핀은 픽토그램 + 단어. 한 글자 금지

`打` `역` `St` 같은 한 글자 라벨을 전부 없앤다. 모든 핀이 SVG 픽토그램과 **단어** 라벨을 같이 가진다.

### D5. 아이콘은 Material Symbols (Apache-2.0). JIS Z 8210은 쓰지 않는다

JIS Z 8210(案内用図記号)을 조사했고 쓰지 않기로 했다. 근거 세 가지.

1. 일본산업표준조사회 FAQ: 「図記号が規定されているJISの適用範囲においてその図記号を利用する場合は、利用許諾の確認の必要はございません」. 면제는 그 규격이 정한 적용범위(간판·표지·취급설명서) 안에서다. 웹 지도는 그 범위가 아니다.
2. 도기호 전자 데이터는 일본규격협회가 PDF·EPS로 **유상 판매**한다. 국토교통성이 배포하는 것도 PDF뿐이고 라이선스는 JISC로 넘긴다. 트레이싱해 리포지토리에 넣으면 재배포다.
3. JIS Z 8210에 花火 도기호가 없다.

Material Symbols는 Apache-2.0이고 SVG 원본을 준다. 출처는 README와 지도 출처 줄에 적는다.

| 용도 | 아이콘 | 비고 |
| --- | --- | --- |
| 발사 지점 | 자체 제작 버스트 | 花火 도기호가 어느 세트에도 없다. `celebration`은 크래커, `festival`은 텐트라 오독한다 |
| 발사 지점 미확정 | `not_listed_location` | 물음표가 박힌 지도 핀 |
| 가까운 역 | `directions_railway` | |
| 공유 위치 | `share` | |
| 유료 | `paid` | |
| 통제 | `block` | |
| 범례 | `info` | |

## 3. 기능 요구

### F1. 기울어지는 지도

프로토타입에서 맞춰 본 값이다. 그대로 쓴다.

- `maxPitch: 0` → `85`. 진입 pitch 83°, zoom 15.0. 하늘이 화면 위 절반을 차지해야 불꽃이 산다.
- 지도 생성 시 `canvasContextAttributes: { antialias: true }`.
- 지형은 D2의 AWS Terrain Tiles(`encoding: "terrarium"`), `exaggeration: 1.3`.
- 밤은 타일을 새로 받지 않고 래스터 paint로 만든다. 地理院タイル 원본 그대로다.
  `raster-brightness-max: 0.15`, `raster-brightness-min: 0`, `raster-saturation: -0.75`,
  `raster-contrast: 0.35`. 배경 `#060814`.
- `sky`는 레이어가 아니라 **스타일 루트 속성**이다. `type: "sky"` 레이어는 MapLibre 5가 거부한다.
  `sky-color #0a0f24`, `horizon-color #3a2140`, `fog-color #140b1c`, `sky-horizon-blend 0.8`.
- 카메라는 발사점을 중심으로 도는 오비트. 90°에 40초, `easing: (t) => t`.
- 출처 줄은 두 줄이 된다. 배경 「地理院タイル」 + 목록 페이지 링크는 그대로 두고, 표고 출처를 한 줄 더 붙인다. DEM은 다른 기관 것이다.

### F2. 발사 지점 불꽃

- 셸이 올라가고, 폭발하고, 떨어진다. 동시 최대 6셸, 셸당 340 입자.
- **셸은 지상 100m(`BASE_Y`)에서 뜬다.** 폭발 정점은 지상 720–1100m다. 熱海 능선이 400–500m라
  버스트가 산에 걸리지 않는다. 대신 지상에서 올라오는 발사 불빛은 없다. 의도한 맞바꿈이다.
- `THREE.Points` + `AdditiveBlending`, `depthWrite: false`, **`sizeAttenuation: false`**.
  MapLibre가 넘겨주는 투영 행렬 아래서 `sizeAttenuation: true`는 크기를 못 믿는다. 픽셀 크기로 고정한다.
- 스프라이트는 캔버스 radial gradient로 런타임 생성한다. 파일 없음.
- 발사 앵커가 있으면 그 좌표에서 터진다.
- 발사 앵커가 없으면 **지도 중앙 기준 반경 400m 안 무작위 지점**에서 터진다. 중앙은 `festivalArea`가 이미 내주는 `area.coord`(지구 또는 시 대략 좌표)다. 무작위 시드는 `festival.id`다 — 열 때마다 자리가 바뀌면 좌표를 읽는 것처럼 보이고, 고정하면 없는 앵커를 있는 것처럼 보인다. 행사마다 다르고 그 행사 안에서는 같은 자리가 절충이다. 핀은 「발사 지점 미확정」이고 범례도 그렇게 적는다. 거리는 여전히 표시하지 않는다 (원 PRD 제품 원칙 3).
- 토글로 끈다. 기본 켬.
- 다음 셋 중 하나면 멈춘다: 토글 off, 탭 숨김, `prefers-reduced-motion: reduce`.

### F3. 핀과 범례

- 핀 = 픽토그램 + 단어 라벨 칩. 한 글자 라벨은 세 언어 모두에서 없앤다.
- 명당 핀은 번호를 유지한다. 번호는 아래 목록 순서고 색은 접근성(설 수 있음·유료·통제)이다. 범례가 그렇게 설명한다.
- 범례는 접어 둔 상태로 시작하고 펼치면 각 픽토그램의 뜻을 단어로 적는다.
- 터치 타깃 44px 규칙은 지도 위 명당 핀에 적용하지 않는다. 360px에서 겹쳐 지도를 덮는다. 직전 사이클에서 정한 그대로다.

## 4. 하지 않음

- 건물 3D. 국토지리원이 주지 않는다.
- DEM 자체 호스팅, 타일 프록시·캐시.
- 불꽃 소리.
- 셸 종류별 연출(牡丹·菊·柳). 데이터가 없다.
- Three.js code-split. 이미 `LookViewer`가 같은 번들에 three를 넣고 있다.
- `/3d` 시선 스케치 화면 변경. 이번 범위 밖이다.
- 발사 시각 판정.

## 5. 조사로 정리된 것

**U1(GSI DEM 무효 화소)은 착수 전에 실측으로 닫았다.** 결론은 D2에 있다. 지형은 산다.

### 프로토타입이 잡아낸 함정

`load`가 아니라 **`style.load`에 붙인다.** 백그라운드 탭은 `document.hidden`이라
`requestAnimationFrame`이 멈추고, MapLibre는 첫 렌더를 못 해 `load`를 영원히 안 쏜다.
스타일도 CDN도 terrain도 무죄였다. 지금 `FestivalMap.tsx`가 `map.on("load")`에서
오버레이를 그리므로 같은 위험을 안고 있다. 이번에 같이 옮긴다.

### 불꽃 라이브러리는 쓰지 않는다

| 후보 | 라이선스 | 기각 사유 |
| --- | --- | --- |
| `three.quarks` | MIT | peer `three >= 0.182.0`인데 우리는 `^0.180.0`. unpacked 1.2MB |
| `fireworks-js` | MIT | 2D Canvas. WebGL custom layer 안에 못 들어간다 |
| `paullewis/Fireworks` | Apache-2.0 | 2D canvas. 2020년 이후 방치 |
| `wass08/wawa-vfx` | MIT | React Three Fiber 전용. 이 앱은 R3F를 쓰지 않는다 |

Three.js용으로 쓸 만한 불꽃 라이브러리가 없다. `THREE.Points` 하나로 직접 쓴다.

### 스프라이트는 파일로 넣지 않는다

three.js 리포에 MIT 스프라이트가 있다 (`spark1.png` 1,608B, `disc.png` 866B).
쓰지 않는다. 캔버스 radial gradient로 런타임에 만든다. 에셋 파일 0개, 라이선스 주석 0줄, 요청 0회다.

### 통합은 MapLibre 공식 예제를 따른다

`maplibre-gl-js` 리포의 `test/examples/adding-3d-models-using-threejs-on-terrain.html`이
지형 위 three.js라 우리 케이스와 같다. 설치된 `maplibre-gl@5.24.0`에 아래가 전부 있는 것을 확인했다.

```js
new THREE.WebGLRenderer({ canvas: map.getCanvas(), context: gl, antialias: true })
renderer.autoClear = false
scene.rotateX(Math.PI / 2)
scene.scale.multiply(new THREE.Vector3(1, 1, -1))   // x=동, y=위, z=북
// render(gl, args)
new THREE.Matrix4().fromArray(args.defaultProjectionData.mainMatrix)
MercatorCoordinate.fromLngLat(origin, elevation).meterInMercatorCoordinateUnits()
map.queryTerrainElevation(lngLat)
map.triggerRepaint()
```

지도 생성 시 `canvasContextAttributes: { antialias: true }`가 필요하다.

## 6. TDD 시임

새로 테스트하는 것은 아래 셋뿐이다. 여기 없는 것에는 테스트를 쓰지 않는다.
WebGL 렌더·MapLibre 카메라·Three.js 씬은 목하지 않고 테스트하지도 않는다. 실제 Chrome에서 눈으로 본다.

| # | 시임 | 공개 함수 | 왜 |
| --- | --- | --- | --- |
| B1 | 셸 궤적 | `shellAt(shell, tSeconds)` | 지상 100m에서 떠서 정점까지 올라간다. 폭발 뒤에는 null |
| B2 | 폭발 입자 | `burstParticles(shell, tSeconds)` | 폭발 순간 반경 0, 시간이 갈수록 커지고 중력에 처진다 |
| B3 | 미확정 위치 | `unknownLaunchOffset(center, seed)` | 같은 시드면 같은 좌표. 중심에서 400m 안 |

`shellAt`, `burstParticles`, `unknownLaunchOffset` 은 전부 순수 함수다.
표고 디코딩에는 테스트를 쓰지 않는다. `terrarium`은 MapLibre가 푼다 — 우리 코드가 아니다.
`Math.random`도 `Date.now`도 부르지 않는다. 시간과 시드는 인자로 받는다.

기대값은 리터럴이다. 같은 공식을 다시 돌려 expected를 만들지 않는다.

### 디렉터리

```
src/domain/burst.ts             shellAt, burstParticles, unknownLaunchOffset
src/ui/map/fireworks-layer.ts   MapLibre custom layer + Three.js
src/ui/map/icons.tsx            SVG 픽토그램
src/ui/map/MapLegend.tsx        범례
src/ui/map/gsi-style.ts         terrain 소스
src/ui/map/FestivalMap.tsx      pitch·terrain·레이어 배선, 핀 교체
tests/domain/burst.test.ts      B1 B2 B3
```

`FestivalMap.tsx`는 지금 366줄이다. 핀 생성과 범례를 빼내면 줄어든다.

## 7. 성공 기준

- 熱海 행사 지도가 기울어지고 熱海湾을 둘러싼 산의 기복이 보인다. 바다에 벽이 서지 않는다.
- 발사 앵커가 있는 행사에서 그 좌표 위로 불꽃이 터진다. 지도를 돌리면 불꽃도 같이 돈다.
- 발사 앵커가 없는 행사에서 「발사 지점 미확정」 핀이 뜨고, 거리는 어디에도 없다.
- 세 언어 어디에도 한 글자 핀 라벨이 없다.
- 360px에서 가로 스크롤이 없고 범례가 지도를 덮지 않는다.
- `prefers-reduced-motion: reduce`에서 불꽃이 멈춘다.
- 기존 테스트 56개가 그대로 초록이다.

## 8. 리스크

- 표고를 미국 SRTM(30m)에 의존한다. 국토지리원 5m DEM보다 거칠다. 눈으로 보는 기복에는 충분하지만 정밀 표고가 아니다. 거리·가시성 판정에는 쓰지 않는다.
- AWS Terrain Tiles는 무료 공개 데이터셋이고 SLA가 없다. 죽으면 지형만 빠지고 나머지는 산다.
- 상시 `requestAnimationFrame`은 배터리를 쓴다. F2의 정지 조건 셋이 완화책의 전부다.
- 저사양 단말에서 프레임이 떨어진다. 입자 수를 화면 폭과 `devicePixelRatio`로 줄인다.
- 발사 앵커는 여전히 추정이다. 불꽃이 그 위에서 터진다고 정확도가 올라가지 않는다. 면책 문구는 그대로 둔다.
