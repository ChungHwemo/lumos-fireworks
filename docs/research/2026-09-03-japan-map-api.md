# 조사: 일본 불꽃 지도의 베이스맵은 어디서 받는가

조사일: 2026-09-03. 결론부터: **일본 구글 Maps API도, 야후 재팬 지도 SDK도 이 제품의 베이스맵이 아니다.**  
spotts와 같이 **MapLibre가 우리 레이어를 그리고, 배경 타일은 국토지리원(GSI)을 실시간으로 읽는다.**

질문의 함정은 "일본 지도 = 구글 재팬 또는 야후 재팬 API"라는 이분법이다. 2026년 기준으로 야후는 **지도를 그리는 SDK를 이미 끊었고**, 구글은 **그릴 수는 있지만 과금·약관이 스택 전체를 잠근다.**

## 결론 (잠금)

| 역할 | 선택 | 이유 |
| --- | --- | --- |
| 베이스맵 | **MapLibre + 地理院タイル 래스터** (`pale` 기본, `std`/`seamlessphoto` 전환) | 일본 공식 지형, 실시간 로드는 출처만 쓰면 신청 불필요, API 키·과금 없음, GeoJSON 통제 폴리곤을 우리가 그림 |
| 다크/야간 스타일 | v1 보류. 이후 **GSI 실험 벡터** 또는 Geolonia/OSM 벡터 | 래스터는 색을 못 바꿈. CSS invert는 쓰지 않음 |
| 장소 검색/지오코딩 | v1은 시드 좌표만. 필요하면 **Yahoo YOLP 지오코더** (데이터 API) | 야후 **지도 SDK는 종료**. 구글 지오코딩은 GSI 지도 위에 올리면 약관 위반 |
| 길찾기 | 앱 밖 딥링크 (Google / Apple / Yahoo 지도 앱) | PRD F3과 동일. 자체 라우팅 없음 |
| 쓰지 않음 | Google Maps JS를 베이스맵으로, Yahoo embed를 본지도로, 타일 스크레이핑/캐시 | 아래 약관 |

## 1. Yahoo! JAPAN — 지도 SDK는 이미 죽었다

공식 종료 공지 (2020-02-04, 시행 2020-10-31):

- [YOLP 일부 API·SDK 제공 종료](https://developer.yahoo.co.jp/changelog/2020-02-04-map.html)
- [Yahoo!マップ 블로그 동일 공지](https://map.yahoo.co.jp/blog/archives/20200116_yolp_close.html)

종료 대상:

- Yahoo! JavaScript 맵 API
- Yahoo! 스태틱 맵 API
- Yahoo! iOS / Android 맵 SDK
- 経路地図 API

남은 것 ([YOLP 목록](https://developer.yahoo.co.jp/webapi/map/), 2023-10-01 이용방법 개정):

- 로컬 서치, 지오코더, 리버스 지오코더, 우편번호, 장소정보, 표고, 기상, 2점 거리, 측지계 변환 등 **데이터 API**
- `appid` 필수, **1앱 24시간 5만 요청**, 초과는 유료 Premier
- **의도적 저장·캐시 금지**, 다운로드/외부출력 금지, 지도 위 표시 삭제 금지
- 턴바이턴 내비(맵매칭+음성+리루트) 금지

별도로 **블로그용 임베드**만 살아 있다.

- [地図の埋め込み](https://map.yahoo.co.jp/promo/embeddedmap/index.html) (2022-12-23 갱신)
- `<script src="https://map.yahoo.co.jp/embedmap/V3/?lat=…&lon=…">` 한 장
- 중심·줌·maptype(basic/satellite/twoTones 등)만 바꿈
- **우리 `ControlZone` 폴리곤·명당 마커 시트를 그리는 엔진이 아님**

판정: 야후는 **검색/주소 → 좌표**에는 쓸 수 있다. **본지도로는 쓸 수 없다.**

## 2. Google Maps Platform — 가능하지만 이 제품과 안 맞음

가능한 것:

- Maps JavaScript API로 다크 스타일 지도 + 폴리곤
- Embed SKU는 무제한이지만 iframe 위젯. 딥맵 오버레이에 부족
- Dynamic Maps 과금 ([공식 가격표](https://developers.google.com/maps/billing-and-pricing/pricing), 2026-09-01): Essentials **월 10,000 로드 무료**, 이후 **$7 / 1,000** (10만까지). 결제 계정·API 키 필수

막히는 것 ([Maps Platform ToS](https://cloud.google.com/maps-platform/terms)):

- **No Scraping**: 타일·지오코드·Places를 긁어 밖 사용 금지
- **No Caching**: 서비스 특정 조항이 허용한 것(주로 `place_id`) 외 캐시 금지
- **No Use With Non-Google Maps**: 구글 콘텐츠를 **비구글 지도 위/근처**에 쓰면 안 됨. 예: Places를 OSM/GSI 위에 올리기, 구글 지도를 비구글 지도에 링크
- JS 정책: API 결과는 구글 지도에 표시. 지도 없이 쓰면 별도 Google Maps 출처 ([policies](https://developers.google.com/maps/documentation/javascript/policies))

판정: 구글을 베이스맵으로 고르면 **검색·지오코딩·길찾기까지 전부 구글**이어야 한다. 우리는 이미 자체 시드 좌표·통제 폴리곤·외부 길찾기를 전제로 한다. 월 1만 뷰를 넘기면 바로 과금. spotts 스택(MapLibre + 자체/공개 타일)과도 어긋난다.

**허용하는 구글 사용**: 사용자가 「길찾기」를 눌렀을 때 `https://www.google.com/maps/dir/?api=1&destination=lat,lng` 로 **앱/웹을 연다.** 우리 페이지가 구글 타일을 받지 않는다.

## 3. 国土地理院 地理院タイル — 이 제품의 본지도

공식:

- [지리인 타일 목록·이용](https://maps.gsi.go.jp/development/ichiran.html)
- [타일 사양 (XYZ)](https://maps.gsi.go.jp/development/siyou.html)

핵심 문장 (목록 페이지 「ご利用について」):

> 지리인 타일을 웹사이트·소프트웨어·애플리케이션에서 **실시간으로 읽어** 쓰는 경우, **출처 명시만으로 신청 없이** 이용할 수 있다.  
> 출처는 「国土地理院」 또는 「地理院タイル」 등 + [목록 페이지](https://maps.gsi.go.jp/development/ichiran.html) 링크.

주의:

- 타일을 **받아 저장·재배포**하면 측량법 신청이 필요할 수 있다. 우리는 **브라우저가 GSI를 직접 요청**한다. 우리 서버가 타일을 프록시/캐시하지 않는다.
- 「地理院地図」「地理院タイル」는 등록상표.
- 일부 레이어는 추가 출처가 있다. v1은 `std` / `pale`만.

v1 URL (XYZ, 키 없음):

| 레이어 | URL | 용도 |
| --- | --- | --- |
| 담색 (`pale`) | `https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png` | 기본. 오버레이가 읽힘 |
| 표준 (`std`) | `https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png` | 지명 강조 |
| 사진 | `https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg` (목록에서 확인 후) | 해상 발사(熱海) 보조 |

영어 타일 `english`는 ZL 9–11 정도만이라 ko/en UI의 베이스로 쓰기 부족하다. 지명은 우리 마커 라벨로 푼다.

벡터 (야간 다크용, **제공 실험**):

- `https://cyberjapandata.gsi.go.jp/xyz/experimental_bvmap/{z}/{x}/{y}.pbf`
- [제공 실험 README](https://github.com/gsi-cyberjapan/gsimaps-vector-experiment): URL·스키마가 바뀔 수 있음. 출처는 「国土地理院ベクトルタイル提供実験」
- MapLibre/Mapbox GL 샘플: [gsivectortile-mapbox-gl-js](https://github.com/gsi-cyberjapan/gsivectortile-mapbox-gl-js)

v1은 실험 벡터에 의존하지 않는다. 래스터 + 우리 GeoJSON.

## 4. Geolonia / OSM — 다크 대체재, 1순위 아님

[Geolonia Maps](https://docs.geolonia.com/)는 MapLibre 호환 일본 OSM. API 키 필요.

[요금](https://www.geolonia.com/pricing/) (페이지 기준):

- Free: 월 표시 **20,000**
- Pro: 월 ¥3,980(세별) / **50,000** 표시, 초과 ¥0.40/회

일본어 라벨·다크 스타일은 잘 맞지만,  basemap을 유료 SaaS에 묶을 이유가 v1에는 없다. GSI가 공짜이고 일본 공식이다.

OSM 래스터(CARTO dark 등)는 예전 PRD의 「다크 OSM」이다. 일본 해안선·지명은 GSI가 낫다. OSM을 쓰면 `© OpenStreetMap contributors`가 추가로 필요하다.

## 5. spotts와 맞추는 법

spotts.kr/firework: MapLibre + 자체 타일 `tile.spotts.kr` + 다크 스타일. 구글/야후 SDK가 아니다.

우리는 자체 타일 서버를 v1에서 안 만든다. 같은 엔진(MapLibre) + 공개 GSI XYZ. 마커·통제 폴리곤·현위치는 우리 데이터.

## 6. 하지 말 것

- 구글/야후/GSI 타일을 받아 디스크에 쌓거나 우리 CDN에 재호스팅
- 구글 지오코딩·Places 결과를 GSI/OSM 지도 위에 올리기
- 야후 embed를 본지도로 쓰고 그 위에 HTML 오버레이로 통제구역을 흉내 내기
- 래스터를 CSS `filter: invert`로 다크 처리 (가독성·출처 훼손)

## 출처

- Yahoo 종료: https://developer.yahoo.co.jp/changelog/2020-02-04-map.html
- Yahoo YOLP: https://developer.yahoo.co.jp/webapi/map/
- Yahoo 임베드: https://map.yahoo.co.jp/promo/embeddedmap/index.html
- Google ToS 3.2.3: https://cloud.google.com/maps-platform/terms
- Google 가격: https://developers.google.com/maps/billing-and-pricing/pricing
- GSI 이용: https://maps.gsi.go.jp/development/ichiran.html
- GSI 사양: https://maps.gsi.go.jp/development/siyou.html
- Geolonia 요금: https://www.geolonia.com/pricing/
