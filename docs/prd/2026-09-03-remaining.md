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

## 사람 눈으로 본 것

- R1 **통과** (2026-09-03, macOS Chrome, 배포본 https://chunghwemo.github.io/lumos-fireworks/).
  熱海(`atami-kaijo-2026-09-13`)·酒田(`sakata-hanabi-2026`) 둘 다 `cyberjapandata.gsi.go.jp/xyz/pale`
  타일이 그려진다. 등고선·역명·해안선까지 읽힌다. 타일 응답은 200 / `image/png` /
  `access-control-allow-origin: *`. WebGL 컨텍스트 손실 없음.
  주의: 페이지 전체 스크린샷은 WebGL 캔버스가 합성되기 전에 찍히는 경우가 있어 지도가
  빈 칸으로 나온다. 확인은 영역 확대 캡처로 한다.

## 2026-09-03 검수 사이클에서 고친 것

PRD 요구 단위별 감사 8건 → 후보 5건 → 반증 통과 4건. 여기에 직접 찾은 정렬 문제 1건.

- `/e/{id}/p/{id}/3d` 화면에 비공식 고지가 없었다. 제품 원칙 1·성공 기준 위반. (`LookPage.tsx`)
- 영어에서 지구(district) 라벨을 쓰면 현이 통째로 사라졌다. `Yodo River park` → `Yodo River park, Osaka`. 淀川·万博 라벨에 시를 넣었다. (`area.ts`)
- 언어 전환을 따르지 않던 UI 문자열 4개. 시선 스케치 `aria-label`, 명당 화면 역 핀 이름, 탭 `aria-label="sections"`, 목록 머리말 `from`. (`LookViewer.tsx`, `SpotPage.tsx`, `FestivalPage.tsx`, `CatalogPage.tsx`)
- `ResearchLink`에 원본 IA의 `fallbackDescription`이 없었다. optional로 추가. (`types.ts`)
- `Hwemo-Chung.github.io` 미러에서 딥링크가 목록으로 떨어졌다. 사용자 사이트는 루트 `404.html`만 쓰므로 하위 폴더 `404.html`이 무시된다. 루트 404가 `sessionStorage`에 넘겨준 경로를 `index.html`이 되돌린다. (`index.html`)
- 360px에서 터치 타깃이 작았다. 언어 버튼 37px, 필터 체크박스 라벨 21px, 시트 링크 14–24px, 지도 컨트롤 29px. `(max-width: 640px), (pointer: coarse)`에서 44px로 올렸다. 지도 위 명당 핀은 뺐다. 44px로 키우면 360px 화면을 덮는다. (`styles.css`)
- 시즌 행사(`dateEnd`)가 이미 지난 시작일로 목록 맨 위에 고정됐다. 정렬 키를 `max(date, from)`으로 바꿨다. 기간 행이 시작일 요일을 표시하던 것도 뺐다. (`festival.ts`, 두 화면)

반증으로 기각한 것: `distanceMeters` null 방향 불변식에 테스트가 없다는 지적. PRD 161행은
두 수의 1m 오차 조항이고, 성공 기준의 CI 항목은 스키마 **참조** 무결성이다. 값 불변식 테스트를
PRD가 요구하지 않는다.

## 2026-09-23 사이클: 프로덕션 정리와 벤치마크 재대조

spotts.kr 을 다시 놓고 봤을 때 세 가지가 뒤처졌다. UI 결이 거칠고, 지도가 읽히지 않고, 불꽃이 심심했다. 같이 프로덕션 결함도 걷어냈다.

- **지도 가독성.** 래스터 淡色地図를 밝기 0.15 로 눌러 쓰던 밤 지도는 글자도 도로도 죽었다. 国土地理院 最適化ベクトルタイル(`optimal_bvmap-v1`, XYZ, CORS `*`)로 바꾸고, 공개 표준지도풍 스타일(121 레이어)을 벤더링해 색만 역할별로 밤 팔레트로 바꾼다(`gsi-style.ts`). 등고선은 질감만 남기고 물러선다. 위성 야경(シームレス空中写真)·담색은 선택지로 남는다. 원 PRD F4「야간 다크 벡터는 v1 이후」를 여기서 닫았다.
- **불꽃.** `PointsMaterial` 하나(단색·균일 크기)에서 `ShaderMaterial` 로. 입자마다 색·크기·알파, 안팎 두 색, 해석적 꼬리(위치가 닫힌식이라 과거 시각을 다시 계산한다), 폭발 플래시, 8발마다 볼리, 마지막 1초의 잔불 색. 셸 종류 여섯(牡丹·菊·柳·輪·銀冠·椰子)은 `burst.ts` 순수 함수로 고정. `depthTest: false` 라 능선에 가려지지 않으므로 지상(0m)에서 뜬다 — `BASE_Y 100` 맞바꿈(map-3d PRD F2)은 이걸로 해소됐다.
- **UI/UX.** 유리·오로라·세리프를 버리고 벤치마크와 같은 결의 어두운 표면 3단계 + 주황 강조. 바텀시트(손잡이로 접고 펼침, 880px 부터 오른쪽 패널), 세그먼트 탭, 아이콘 메타 줄, 액션 필(명당 찾기·공식·캘린더 ICS·공유), 지도 위 레이어 칩(통제·혼잡·불꽃·배경), 명당 정보 카드 2열, 목록 달 묶음과 날짜 블록. UI 선 아이콘은 자체 제작.
- **프로덕션 결함.** ErrorBoundary·404·라우트 지연 로드(목록은 지도·three 를 내려받지 않는다), `document.title`, 안전한 `localStorage`(깨진 제보 행만 버림), 공유 취소·실패 처리, 매 렌더 지도 전체 재그리기 버그(`labels`·`area`·`sharePin` 새 객체) 수정, 렌더 중 ref 쓰기 제거, WebGL2 없는 브라우저 안내. `maplibre-gl` 5→6(DOM.sanitize XSS 권고), `vitest` 3→5. ESLint(react-hooks 포함)·`noUnusedLocals`·CI `check`. 무결성 검사에 id 중복·날짜/시각·좌표 범위·crowdLevel·URL 스킴 추가. UI 스모크 테스트(jsdom)·ICS·스타일 재색 테스트.

확인: macOS Cursor 내장 Chromium(WebGL2)에서 熱海·酒田 야경 지도 타일·글리프·스프라이트 200, 불꽃 6종 렌더, 390px 바텀시트, 데스크톱 패널. 배포본은 아직 이 사이클을 받지 않았다.

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
