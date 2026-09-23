# 조사: TypeSafe Jev — 상품 검색·고객 문의 처리에 무엇을 응용할 수 있는가

조사일: 2026-09-23. 발단: Threads [@h2smusic 포스트](https://www.threads.com/@h2smusic/post/DdkPlckE9YS) ("JEV 생태계가 빠르게 커지는 중" + 프로젝트 5개). 초점: **자유서술 메모에서 복합조건을 뽑아 DB 상품을 추천하는 검색**, 그리고 **고객 문의 처리**.

결론부터: **Jev는 "LLM보다 항상 더 똑똑한 분류기"가 아니다. "LLM과 동급의 좁은 판단을, 3~8배 빠르게, 1/4~1/12 비용으로, 보정된 확률과 함께 돌려주는 부품"이다.** 우리 시나리오(메모 → 복합조건 → DB 추천)에서 Jev가 맡을 자리는 두 곳이다: **① 메모를 DB 스키마의 닫힌 속성 슬롯으로 판정하는 단계(1콜 팬아웃, 속성마다 `not_stated` 포함)**, **② DB가 돌려준 후보를 메모 전체에 대해 다시 채점하는 단계.** 숫자·수량·날짜·가격 비교, SQL 생성, 하드/소프트 필터 결정은 코드가 한다. Jev는 텍스트를 생성하지 않으므로 **"단어 조합을 추출"하는 게 아니라 "우리가 정해 둔 값 중 무엇에 해당하는지 고르고, 정규식이 찍어 둔 후보 중 무엇이 예산·수량인지 고른다."** 브랜드명처럼 열린 어휘는 사전·정규식·소형 LLM이 후보를 만들고 Jev가 고르거나 검증한다. 고객 문의 트리아지·답변 근거 검증·카탈로그 동일성 판정도 바로 PoC할 가치가 있다. 단, **한국어 정확도는 공식적으로 "영어보다 낮다"고만 되어 있고 공개 벤치마크가 없다.** 임계값은 우리 라벨 데이터 100~200건으로 직접 재야 한다.

검증 방식: 인세인서치(공식 문서 25여 페이지, 블로그, GitHub API, HN Firebase/Algolia, PyPI/npm 레지스트리, OpenRouter/Cloudflare/Vercel 문서, 제3자 벤치 5건)로 1차 소스를 직접 열었고, 악마변호인 절(§6)에서 주장별로 반증을 붙였다. **실 API 호출은 하지 않았다** (`TYPESAFE_API_KEY` 미보유). 샘플 페이로드 4종은 표준 라이브러리로 API 명세(타입·Choice ≤255·Score 2~10·탈출구 옵션·컨텍스트 한도)에 대해 검증만 통과시켰다(§5).

## 결론 (잠금)

| 영역 | 응용 형태 | 판정 | 근거 |
| --- | --- | --- | --- |
| **메모 → 복합조건 슬롯** (카테고리·소재·색·용도·제외조건·커스터마이즈 등 DB 닫힌 속성) | 속성마다 Choice(+`not_stated`) 또는 Noul, 1콜 팬아웃 10~20질문. confidence로 하드/소프트 필터 결정 | **Jev의 정중앙.** 공식 function-calling 쿡북이 같은 형태(문장 → 닫힌 인자 + `stated` Noul, 14명령 confidence 0.53~1.00) | function_calling·fan-out·smart-home |
| **메모 → 숫자·수량·날짜·가격** | 정규식이 후보 스팬을 찍고 Jev는 "어느 스팬이 예산/수량인가"와 "이하/이상/정도"만 고름. 비교·환산·리드타임은 코드 | **필수 분업.** Jev는 계산·날짜 비교 불가(공식 #2·#3). 날짜는 성분 Choice로 6/6 정답 사례 | pre_parsed·date_extraction·jaggedness |
| **메모 → 열린 어휘** (브랜드·모델명·고유명) | 사전/정규식/소형 LLM이 후보 생성 → Jev가 선택 또는 필드별 검증(P(wrong)) → 실패만 상위 LLM | **Jev 단독 불가.** 생성 못 함(공식 #9). 하이브리드가 정답 | pre_parsed·SDE cascade |
| **DB 후보 → 메모 전체 대비 재채점** | 후보당 Noul "메모의 모든 명시 조건을 충족하는가" + 조건별 Noul(설명) + `exists` Noul("만족 상품 없음" 판정) | **유망.** 리랭크 top-1 5%→18%, 1,200콜 $0.065 | rerank·semantic_find |
| 고객 문의 트리아지 (부서·긴급·환불요청·감정·주문참조) | 1콜에 원자 질문 5~7개, 코드가 임계값으로 분기 | **PoC 즉시 가능.** 영어 기준 정확도 LLM 동급(92.2% vs 93.6%), 콜당 비용 Haiku 1/35, p50 ~240ms | Suraj CLINC150, Qiita banking77, 공식 Choice 페이지 |
| 답변 근거 검증 (FAQ/헬프센터 RAG) | 저가 LLM 초안 → Jev `supported/unsupported/declined` → 실패만 상위 모델 | **유망.** 50문항에서 오답 0건·비용 7% | OpenRouter 캐스케이드 쿡북, goodstartlabs |
| 챗봇 입·출력 가드레일 | Noul 배터리(탈옥·위해·의료·자해) + Score 심각도 | 유망. 단 **적대 입력에 취약**(공식 인정) | guardrails 쿡북, jaggedness #6 |
| 상품 검색 2차 리랭크 | BM25/벡터 상위 K개 → 쿼리-후보 쌍별 Noul → 정렬 | **유망(2차 랭커).** 임베딩·키워드 검색을 대체하지 않는다 | rerank 쿡북(top-1 5%→18%) |
| 문서/목록 내 위치 찾기 | 행 ID를 Choice 옵션(≤255)으로, `exists` Noul 동반 | 유망. 255 한도 → 2단계 | semantic_find 쿡북 |
| 카테고리 자동 분류 | 계층별 Choice + 빔서치(K=3) | 유망. Shopify 택소노미 4/4(단 n=4) | hierarchical 쿡북 |
| 카탈로그 동일 상품·중복 판정 | Score 3단(다름/유사/동일) + 필드별 Noul → 큐레이터 큐 | **강력 후보.** 450쌍 자동 처리 88.9% | entity_alignment 쿡북, Southbridge ER |
| 상품 속성 추출 | 정규식으로 후보 스팬 → Choice로 선택(`none` 포함) | 유망. 모델이 값을 "생성"하지 않아 오타 불가 | pre_parsed 쿡북 |
| 한국어 | — | **자체 평가 필수.** 공식 "CJK는 영어만큼은 아님", 공개 한국어 벤치 없음 | models.md, Qiita(일본어만) |
| **"경험 축적 → 분배 효율" 가설** (§8) | 경험은 Jev가 아닌 질문 세트·임계값·코드·다운스트림 ML·평가셋에 쌓임. confidence 게이팅으로 자동/이관 분배 | **H1 거짓 · H2 참 · H3 조건부 참.** 파인튠 없음(공식). 게이팅 실측: conf≥0.9 → 90% vs 40%; top-p≥0.6 → 자동 74% @ 일치 99%. 조건: 분리력(AUROC)·held-out·밴드·버전 고정 | models.md, classification_using_confidence, consistency 쿡북, Archestra, autoresearch |
| 접근 경로 | TypeSafe 콘솔(대기열) / OpenRouter Decisions(alpha) / Cloudflare Workers AI / Vercel AI Gateway | **대기열 없이 OpenRouter·Cloudflare로 시작 가능** | 각 문서 |
| 쓰지 않을 곳 | 텍스트 생성·요약·답변 작성, 산술·개수·날짜 비교, 시스템 2 추론, 이미지 | 공식 jaggedness 9항 | model-jaggedness |

## 1. Jev가 무엇인가 (사실만)

- 출시 2026-09-15, TypeSafe AI(Diogo Almeida, 전 OpenAI RLHF 연구자). 시드 $40M(DCVC 리드). 텍스트를 생성하지 않고 **`state`(문자열/JSON) + 타입 질문 → 타입 답 + 확률**을 돌려주는 "System One" 모델. 학습법 RLCD(Reinforcement Learning for Calibrated Decisions). 가중치·논문 비공개.
- 엔드포인트 `POST https://api.typesafe.ai/v1/systemone`, `Authorization: Bearer`. 현행 모델 `jev-1.13.0`; `jev-latest`·`jev-preview` 모두 여기로 해석(운영은 버전 고정 권고).
- 질문 3종: **Choice**(옵션 1~255개, `choice`+`probabilities`+`confidence`), **Score**(레벨 2~10, `score`는 레벨 사이 소수 가능), **Noul**(예/아니오 확률 0~1, `confidence` 없음). 한 요청의 질문들은 **병렬·독립** 평가 — 질문을 더해도 지연이 거의 늘지 않는다.
- 가격 입력 $0.042/Mtok(= $42/Btok), **출력 무료**. 한도 250,000 tok/s·1,200 req/min("수요 따라 예고 없이 변동"). 컨텍스트 64k(state+전 질문), 32k(state+가장 긴 질문). 입력은 텍스트만.
- 언어: "영어가 주 학습 언어이고 정확도도 영어에서 최고. CJK 등은 처리되지만 같은 수준 아님. 자기 콘텐츠로 시험하고 Confidence를 주의해서 라우팅하라."
- 고객 데이터로 학습하지 않음, 계정별 파인튠 없음(도메인은 `state`·`instructions`·`criteria`로 반영). ZDR은 엔터프라이즈.
- 에러 401/422/429/529. SDK: PyPI `typesafe-sdk` 0.7.1(첫 업로드 2026-09-09, Python ≥3.10), npm `@typesafe-ai/sdk` 0.6.0(2026-09-12). Playground는 로그인 필요.
- 공식 약점 목록(jev-1.13, 2026-09-17 검토): ① 문자 그대로 읽음 ② 산술·개수 불가 ③ 날짜 비교 불가 ④ 다단 간접 참조 약함 ⑤ 무관한 state가 많으면 정확도 하락 ⑥ 적대적 내용에 끌려감 ⑦ instructions↔criteria 모순 시 혼란 ⑧ 구조적 불변식 없음(Noul과 Choice `yes` 확률은 비교 불가, `P(A)+P(not A)≠1`) ⑨ 생성 불가.

접근 경로 4종(2026-09-23 확인):

| 경로 | 모델 ID | 비고 |
| --- | --- | --- |
| TypeSafe 직접 | `jev-1.13.0` | 콘솔 키 발급은 **대기열(early access)** |
| OpenRouter Decisions API | `typesafe/jev-1.13` | `POST https://openrouter.ai/api/alpha/decisions` (**alpha, /api/v1 아님**). 9/18 등록, 7일 83.7M 토큰 처리, P50 0.27s, 가용성 99.88% |
| Cloudflare Workers AI | `typesafe/jev` | `env.AI.run('typesafe/jev', {state, questions})`, 32k |
| Vercel AI Gateway | `typesafe-ai/jev` | AI SDK ≥7.0.105 `experimental_evaluate`, 질문 타입명이 `boolean`(=noul), 요청 단위 ZDR |

## 2. Threads 포스트 5개 프로젝트 검증 (GitHub API, 2026-09-23)

| # | 포스트 주장 | 레포 | ★ / 생성일 | 검증 결과 |
| --- | --- | --- | --- | --- |
| 1 | 브라우저 행동을 JEV가 즉시 결정 | `browser-use/jev-ultrafast` | 17,729 / 2026-09-16 | **사실.** README에 Jev 21회 언급, `TYPESAFE_API_KEY` 필요, TYPE_TEXT만 소형 LLM. 단 browser-use 브랜드 효과 + "waitlist" 마케팅 페이지 동반. 스타 ≠ 운영 사용 |
| 2 | Claude Code 컨텍스트 압축 | `tamaratran/fast-jev-compaction` | 6,248 / 2026-09-17 | **사실.** 툴 호출/결과마다 Noul 2개, 30k 요청 한도 |
| 3 | UI 컴포넌트·배치를 JEV가 선택 | `vercel-labs/json-render` | 18,066 / **2026-01-14** | **과장.** Jev 출시 8개월 전 레포("The Generative UI framework"). Jev는 9/18 커밋 1건 "experimental composition APIs", README 1줄 "**Unreleased**". 18k★는 Jev와 무관 |
| 4 | Choice/Score를 MCP로 호출 | `itsmostafa/typesafe-mcp` | 252 / 2026-09-17 | **사실.** Go, OpenRouter 키로도 동작 |
| 5 | jev-mcp | (포스트에서 잘림) | — | 확정 불가. 후보: `tumf/jev-cli`(PyPI `jev-cli` 0.6.2, `jev-mcp` stdio 서버 포함, 12★) |

공식 조직 `typesafe-ai`: `skills` 1,764★(2026-08-24), `typesafe-sdk-python` 199★, `typesafe-sdk-js` 224★, `system-one-adapter-python` 256★("LLM API로 TypeSafeClient를 대체하는 드롭인" — 키 없이 패턴을 시험할 때 유용). 기타 생태계: `Nasrallah-AL/jev-cli`(npm `jevctl`), `maayanlevy/mysql-ailike`(MySQL 행을 의미로 필터, 4★), `qibinlou/jev-chess`, `madewithjev.com`, LangChain `TypeSafeClassifier`(X 글 언급, 미검증), Elixir/Rust 클라이언트.

## 3. 고객 문의 처리 — 응용과 실증

### 3.1 패턴

1. **트리아지(공식 권장 형태).** `state = {ticket, customer.open_orders, policy}`. 질문: 부서 Choice(+`other`), 긴급 Noul, 환불요청 Noul, 열린 주문 참조 Noul, 감정 Score 3단, 인젝션 Noul. **부서 confidence < 0.3~0.5 → 사람**, 2위 부서 확률 > 0.25 → 사본 통지, 요청 해결책 confidence < 0.5 → "묻고 추측하지 않기". 공식 Choice 페이지 예제 그대로.
2. **정책 대조.** `refund_policy`·`order.charges`를 state에 넣고 "정책이 이 환불을 지지하는가?" Noul. Cloudflare 예제: `refund_requested 0.99`, `policy_supports_refund 0.98`.
3. **답변 근거 검증 캐스케이드.** 저가 LLM이 헬프센터 발췌로 초안 → Jev Choice `supported/unsupported/declined` → `supported ∧ confidence ≥ 0.8`만 발송, `declined`는 즉시 상담원 이관, 나머지는 상위 모델 1회 재시도.
4. **가드레일.** 입력·출력 양쪽에 Noul 배터리(탈옥/위해/의료/자해) + Score 심각도, 코드가 pass/review/block/support 결정.
5. **라우팅.** intent 확신 낮으면 사람, `order_status`는 DB 조회(결정적 코드), `product_question`은 전문 LLM, `complaint`는 complexity Score > 1이면 사람.

### 3.2 실증 수치

| 출처 | 설정 | 결과 |
| --- | --- | --- |
| Suraj Phanindra (2026-09-21, [jev-triage-bench](https://suraj-website-eta.vercel.app/blog/what-a-correct-decision-costs)) | CLINC150 은행 30 인텐트+catch-all, 300건×3회, 도착률 2~40/s, 마감 2s, jev 1.13 vs Haiku 4.5·GPT-5.6 Luna·DeepSeek V4/V4.1 Flash | **정확·정시 결정 1,000건당 $0.048로 부하 무관.** 타 모델 $0.09~$1.72에서 시작해 큐가 쌓이며 상승(Haiku 40/s에서 $24.48). 콜당 비용 Haiku의 1/35. **정확도는 jev 92.2% vs Luna·Haiku 93.6%(n=249, p≈0.09) — 열세 아님, "묶여 있음".** jev가 catch-all을 5.0% 과발동(타 3.3~3.4%) |
| 같은 글, 정직한 주석 | 워커 32개로 늘리면 | Luna 대비 우위 45x→**3.3x**, Haiku 510x→35x. 캐시 단가 적용 시 DeepSeek V4.1 Flash가 2~20/s 구간에서 jev보다 저렴. jev는 티켓당 질문 1개(가장 불리한 구성)로 측정 |
| Qiita skrtk98 (821건, jev-1.13) | banking77 77클래스 Choice, 200건 | **jev 0.790 최고**(gpt-4.1-mini 0.760, qwen3.8 0.725, gpt-5.4-nano 0.715; nano·qwen 대비 p<0.05). p50 244ms vs 611~2,067ms. $/1k건 0.043 vs 0.227~0.425. ECE(conf) 0.080 최저 |
| 같은 글 | 5질문 묶음(문의 난문 16건) | jev 247ms(1질문 240ms와 동일) vs gpt-4.1-mini 800→1,528ms. 3,284콜 실패 0 |
| 같은 글, 반대 결과 | 영어 트윗 풍자 Noul | qwen3.8 0.870 > jev 0.805(p=0.031). **Bonferroni 보정 후 12쌍 모두 유의차 없음** |
| OpenRouter 캐스케이드 쿡북 | 헬프센터 발췌 3개, 50문항(답 가능 27/불가 23), Opus 채점 | **캐스케이드 오답 0건 $0.012 vs Astra 전건 오답 2건 $0.175** vs Luna 단독 0건 $0.004. 이전 실행에서는 Luna 단독 2건 오답 — 캐스케이드만 두 번 다 0건. 답 가능 2건을 불필요 이관(1건은 confidence < 0.8) |
| Good Start Labs (6,003 루브릭 검사) | Jev vs Fable 5.1·Astra·Luna·Gemini 3.8 Flash·DeepSeek V4.1 Flash, 임계값 0.70 | Fable과 **일치 91.5%**, 각 LLM과 86~92%(평균 90%), LLM 간 88~95%. "프론티어와 실제 격차가 있다." 백만 검사당 $160 vs $33,000. 10,500콜 실패 0, ~0.5s/콜 |
| 공식 Choice 페이지 | 신발 매장 티켓(사이즈 오배송 + 이중결제, 요구 불명) 5질문 | `department` returns 0.61/billing 0.35 → confidence **0.42**; `requested_resolution` confidence 0.20 → 코드가 고객에게 질문. 589 입력 토큰 |
| HN silbercue | 접근성 트리 10~40개 클릭 후보 중 선택 | 21~23 결정 전부 정답, 총 ~$0.001 (자기 보고) |

### 3.3 한국어 문의에 대한 판단

- 공식: CJK는 "처리되지만 동일 수준 아님". **공개된 한국어 벤치마크는 없다.** 이번 조사에서 웹 검색 요약이 "한국어 리뷰 200건 Jev 82.5%"라고 제시했으나 **원문(Qiita)은 `ja_sentiment`(일본어 Amazon 리뷰)였다 — 오역이므로 폐기.** 일본어 3클래스 감정에서 jev 0.825 vs gpt-4.1-mini 0.840(무의미한 차이)이 CJK 유일 근거.
- Laya(오픈소스 대안)의 경고가 그대로 적용된다: 영어 인코더는 비라틴 문자에서 정확도 0~10%인데 **confidence는 0.885~0.964로 높게 나왔다.** 즉 "confidence 게이팅이 언어 실패를 걸러주지 않는다." Jev가 같은 실패를 보이는지는 미측정 — **그래서 자체 평가가 필수다.**
- 실무 제안(일본 Oflight 글의 미검증 제안과 동일): instructions·criteria는 영어로, state는 한국어 원문 그대로 → 100~200건 라벨로 정확도-confidence 곡선 → 저확신은 LLM/사람 → 기계번역 state 변형과 비교.

## 4. 상품 검색 — 핵심 시나리오: 자유서술 메모 → 복합조건 → DB 상품 추천

### 4.1 파이프라인 (무엇을 Jev가 하고, 무엇을 코드가 하는가)

메모 예: "회사 워크숍 기념품으로 30명분 준비. 개당 2만원 안쪽으로, 로고 인쇄 가능한 텀블러나 보온병. 스테인리스가 좋고 플라스틱은 피하고 싶음. 색은 검정이나 네이비 계열. 다음 주 금요일까지는 받아야 함."

| 단계 | 담당 | 무엇을 | 근거 패턴 |
| --- | --- | --- | --- |
| A. 후보 스팬 찍기 | 코드 | 정규식·단위 사전으로 숫자(`30명`, `2만원`), 날짜 표현, 브랜드 사전 매치를 **과잉 추출**. state에 `number_spans_found_by_regex`로 동봉 | pre_parsed 쿡북 ("과잉 추출하라") |
| B. 조건 슬롯 판정 | **Jev 1콜** | DB 스키마의 닫힌 속성마다 Choice(카테고리·소재·색 계열·용도, 각각 `not_stated`/`multiple` 탈출구) + Noul(제외조건 "플라스틱 피함", 커스터마이즈 "로고 인쇄", 카테고리 OR "텀블러나 보온병", 다중 요청 여부, 인젝션) + 스팬 선택 Choice("어느 스팬이 개당 예산인가", "어느 스팬이 수량인가") + 방향 Choice(`at_most/at_least/around`) + 날짜 성분 Choice(`mode/weekday/week_offset`). §5.4 페이로드: 15질문, ≈1.4k 토큰, **콜당 ≈ $0.00006** | function_calling(닫힌 인자 + `stated`), fan-out, smart-home, date_extraction |
| C. 질의 조립 | 코드 | 각 슬롯의 confidence로 **하드 필터**(≥0.8 → `WHERE`), **소프트 선호**(0.5~0.8 → 랭킹 가중), **무시/재질문**(<0.5). 숫자 파싱·단위 환산·`price <= 20000`·수량 ≥ 30 재고·`다음 주 금요일` → 날짜 → 리드타임 비교는 **전부 코드**. `multiple_requests` 참이면 LLM으로 메모를 원자 요청으로 분할 후 각각 B 재실행 | how-to-build("Math in code"), smart-home(LLM 분할) |
| D. 후보 재채점 | **Jev 후보당 1콜(병렬)** 또는 후보 ≤255면 **Choice 1콜** | 후보마다 Noul "이 상품이 메모의 모든 명시 조건을 충족하는가" + 조건별 Noul(색·소재·커스터마이즈… 설명·디버깅용) → 정렬. `exists` Noul로 "조건을 다 만족하는 상품이 없다"를 별도 판정(Choice 확률은 합이 1이라 최선의 오답도 1위가 됨) | rerank, semantic_find |
| E. 열린 어휘 보강(선택) | 소형 LLM → **Jev 검증** | 브랜드·모델명·자유 속성이 많으면 LLM이 JSON 추출 → Jev가 필드별 Noul "값이 메모에 없거나 무관한 곳에서 끌어왔는가"(P(wrong)) → 어느 하나라도 >0.7이면 상위 LLM 재추출 | SDE cascade(`any_flag` max 게이트, 임계값 0.7) |

핵심 분업 원칙:

- **Jev는 "추출"이 아니라 "선택·판정"이다.** 우리가 옵션에 넣지 않은 값은 절대 나오지 않는다. 그래서 DB 속성 사전이 곧 질문의 `criteria`가 되고, 사전에 없는 값(신규 브랜드)은 `other`로 떨어져 코드가 사전 보강 큐로 보낸다.
- **부정·제외는 별도 Noul로.** "플라스틱은 피하고 싶음"을 소재 Choice 하나에 맡기면 `stainless_steel`은 맞추더라도 "플라스틱 금지"라는 하드 필터가 사라진다. 공식 약점 #1(문자 그대로 읽음)·#7(기준 정렬) 때문에 "무엇을 원하나"와 "무엇을 배제하나"를 분리한다.
- **숫자는 스팬 선택 + 방향까지만.** `2만원`이 예산이고 `at_most`라는 판정은 Jev, `20000`으로 환산하고 `<=`를 거는 건 코드. 날짜도 `relative/Friday/next` 성분까지만 Jev, 달력 계산은 코드(쿡북에서 6/6 정답, 미기재 날짜는 confidence 0.46으로 리뷰 큐).
- **팬아웃은 한 번에.** 15~20질문을 1콜로. 병렬 질문 쿡북 기준 분리 호출 대비 12.2x 저렴·10.0x 빠름. `category`가 `multiple`이면 `category_alternatives` Noul을 읽고, 아니면 무시하는 식으로 코드가 답을 골라 쓴다.
- **신뢰도를 필터 강도로 번역.** function-calling 쿡북처럼 호출 전체 confidence = 사용한 슬롯 중 **최소값**(곱이 아님). 최소값이 낮으면 사용자에게 "예산이 개당 2만원 이하 맞나요?" 한 줄 확인이 추천 오류보다 싸다.

이 시나리오에 대한 직접 실증은 없다(아래 §4.3은 인접 과제의 수치). 가장 가까운 공식 사례는 function-calling 쿡북: 자연어 14문장 → 함수 10개·닫힌 인자 28개, 4인자 문장("nvda와 spy의 지난 한 달 롤링 상관")을 인자 네 개 모두 정답으로 채움(confidence 0.91), "lately"처럼 미명시 인자는 `stated` Noul이 걸러 기본값 유지(0.96·0.99). **한국어 메모·우리 속성 사전으로 200건을 라벨해 재야 한다.**

### 4.2 일반 패턴

1. **2차 리랭크.** 검색 엔진(BM25/벡터)이 상위 K(20~30) 후보를 만들고, 쿼리-후보 쌍마다 Noul "이 후보가 쿼리 의도(상품 유형+명시 속성)를 충족하는가?" → noul로 정렬. **가격·재고·배송 가능 등 수치 제약은 코드에서 필터**(공식: "Math in code"). 액세서리/부품 오염은 별도 Noul.
2. **목록 내 위치 찾기.** 행에 `L001|` ID를 붙여 state로, Choice 옵션을 ID로(≤255), 같은 요청에 `exists` Noul. Choice 확률은 합이 1이라 "가장 덜 틀린 행"이 항상 1위가 되므로 `exists`로 "답이 있는가"를 따로 본다(쿡북: 중재 조항 질문 → 1위 0.86이지만 exists 0.14 → "문서에 없음").
3. **카테고리 분류.** 택소노미 각 노드를 Choice로, 빔서치 K=3(기하평균 경로 점수). Shopify 택소노미에서 탐욕 탐색은 "Pet Chairs"로 오분류, 빔은 "Cat Window Beds & Perches" 정답.
4. **동일 상품·중복 판정.** 두 상품을 `entity_a/entity_b`로 한 state에, Score 3단(다름/관련·불확실/동일) + 필드별 Noul(이름·브랜드·스타일). 가운데 레벨이 큐레이터 큐. 알코올 도수 같은 숫자는 Noul 대상에서 제외(코드 비교).
5. **속성 추출.** 정규식/파서로 후보 스팬 과잉 추출 → Choice가 "이 중 무엇이 모델명인가"를 선택(`none` 탈출구 포함) → 코드가 그대로 복사·정규화. 모델은 값을 만들지 않으므로 숫자 전치 불가.
6. **의미 필터.** `mysql-ailike`처럼 SQL 결과 행을 Noul로 필터(초기 프로젝트, 4★ — 아이디어 참고용).

### 4.3 실증 수치 (인접 과제)

| 출처 | 설정 | 결과 |
| --- | --- | --- |
| function_calling 쿡북 (jev-1.12) | 트레이딩 명령 14문장 → 함수 10개, 닫힌 인자 28개, 1콜 54질문 | 14/14 의도한 함수·인자. confidence 0.53~1.00(최소 인자 기준). 미명시 인자는 `stated` Noul로 생략 → 기본값 |
| date_extraction 쿡북 (jev-1.12) | 문서 4개·질문 6개, 7 Choice(mode/월/일/연/anchor/요일/주) | 6/6 정답. 미기재 날짜는 `absolute date incomplete`·conf 0.46 → 리뷰 |
| SDE cascade 쿡북 (jev-1.12, 100 프롬프트) | gpt-5.4-mini 추출 → Jev 필드별 P(wrong) → gpt-5.5 에스컬레이션 | 캐스케이드 파레토 곡선이 단일 모델 4개보다 위·왼쪽. mini의 "그럴듯한 조작값"을 Jev가 잡아 상위 모델이 빈값으로 정정 |
| rerank 쿡북 (jev-1.12) | CLERC 판례 3,565문단, 40쿼리, BM25 상위 30 → Noul 1,200콜 | **top-1 5%→18%, top-5 15%→35%, top-10 38%→62%.** 1,536,002 입력 토큰 **$0.0645** |
| semantic_find 쿡북 | GitHub ToS 218행, Choice 218옵션 + exists Noul, 1요청 | "누가 코드 소유?" L052 0.95·exists 0.98; "중재?" 1위 0.86이나 exists 0.14 → 없음 판정 |
| hierarchical 쿡북 | CPC 특허·Shopify 상품·MeSH·코드베이스 4예 | 빔 K=3 **4/4**, 탐욕 2/4. (n=4 — 방법 시연이지 정확도 통계가 아님) |
| entity_alignment 쿡북 (jev-1.12, 2026-08-11) | Magellan Beer 450쌍, Score 3단 + Noul 3 | 자동 병합 40(8.9%)·큐레이터 50(11.1%)·미연결 360(80.0%). 임계값 상수 없음 — 레벨 문구가 곧 결정 |
| Southbridge.AI (2026-09-20) | 오하이오 선거자금 기부자·위원회 엔티티 해소 | Jev 워크호스 + Luna 5가족 리뷰: **비용 −99.56%, 처리량 7.35x, Fable 대비 정확도 −0.5pp 이내.** **Jev 단독 판정은 "정확도가 크게 떨어진다."** 기준을 "무엇이 아닌가"에서 "무엇이면 충분한가"로 바꾸자 13/13 반전 |
| 병렬 질문 쿡북 | GDPR 위키 54,000자에 13질문 | 1요청 $0.000497·0.27s vs 13요청 $0.006090·2.71s → **12.2x 저렴·10.0x 빠름**, 답 변화 없음 |
| Sean Goedecke (2026-09-18) | Wikiracing, 링크 1,000+ | 255 한도 → **토너먼트 샘플링**(100개씩 Choice → 승자 재대결) 권장. "LLM은 절대 평가보다 상대 판단이 훨씬 낫다" |

### 4.4 설계 제약(상품 검색 특유)

- **후보 커버리지.** 모델은 주어진 옵션 밖을 고를 수 없다. 리랭크는 1차 검색이 정답을 K 안에 넣었을 때만 의미가 있다(CLERC는 100%가 top-30 안). 슬롯 판정도 같다 — **속성 사전에 없는 값은 존재하지 않는 값**이다.
- **메모의 모호어.** "안쪽", "계열", "적당한", "너무 싸지 않은"은 `at_most/around` 같은 방향 옵션과 색 **계열** 옵션으로 흡수한다. 흡수되지 않는 표현은 `not_stated`로 떨어지게 두고 사용자에게 되묻는다. 모델에 해석을 맡기지 말라(공식 #1).
- **255 한도·32k state.** 대카탈로그는 2단(코스→파인) 또는 토너먼트. 옵션 하나에 토큰 몇 개씩 붙는다(banking77 77옵션에서 Jev 입력이 LLM보다 ~150토큰 많았고, 출력 토큰은 평균 828 — 무료지만 지연엔 반영).
- **판매자 텍스트는 적대적일 수 있다.** "정품·최고·1위" 같은 자기 분류 유도 문구에 끌려갈 수 있다(공식 #6). 기준에 "제목의 주장 아닌 속성 필드 기준" 명시, 스팸성 Noul 동반.
- **한국어 상품명은 CJK+영문 모델코드 혼합.** 위 §3.3과 동일한 자체 평가.

## 5. 샘플 (명세 검증만 통과, 실호출 미실행)

네 페이로드는 `python3` 표준 라이브러리로 검증했다: 최상위 `model/state/questions` 존재, 타입 ∈ {noul, choice, score}, Choice 옵션 1~255, 모든 Choice에 탈출구(`not_stated/none/other/multiple`), Score 레벨 2~10, Noul criteria 키 true/false, 대략 토큰 260~1,400(한도 64k/32k 내). 결과 `ALL VALID`. **Jev의 실제 답·정확도는 이 조사에서 확인하지 않았다.** 키를 받으면 §5.4부터 그대로 던져 §3.3의 평가를 시작한다.

### 5.1 고객 문의 트리아지 (한국어 state, 영어 질문)

```json
{
  "model": "jev-1.13.0",
  "state": {
    "ticket": {
      "message": "주문번호 A-2041 상품이 3일째 배송조회가 안 돼요. 내일 선물해야 하는데 이대로면 환불해 주세요.",
      "channel": "web_form", "lang": "ko"
    },
    "customer": {
      "tier": "gold",
      "open_orders": [{"id": "A-2041", "status": "in_transit", "items": ["무선 이어폰 XR-2"]}]
    }
  },
  "questions": {
    "department": {
      "type": "choice",
      "instructions": {"question": "Which team should handle `ticket.message`?", "focus": "Classify the customer's primary request."},
      "criteria": {
        "order_status":     {"what": "Where is my order, delivery ETA, tracking", "not_for": "Returns or refunds"},
        "returns_exchange": {"what": "Return, exchange, wrong or damaged item", "not_for": "Payment problems"},
        "payment_billing":  {"what": "Double charge, refund status, invoice", "not_for": "Order tracking"},
        "product_question": {"what": "Specs, compatibility, size, usage before purchase", "not_for": "Complaints about a received item"},
        "account":          {"what": "Login, password, membership, personal data", "not_for": "Orders or payments"},
        "other": "Anything that does not fit the other options"
      }
    },
    "is_urgent": {"type": "noul", "instructions": "Does `ticket.message` express urgency or a time-sensitive deadline?"},
    "refund_requested": {"type": "noul",
      "instructions": "Does the customer explicitly ask for money back or an account credit in `ticket.message`?",
      "criteria": {"true": "Directly asks for a refund or credit", "false": "Complains or asks a question without requesting a remedy"}},
    "mentions_open_order": {"type": "noul", "instructions": "Does `ticket.message` refer to one of `customer.open_orders` by id or identifying details?"},
    "frustration": {"type": "score", "instructions": "How frustrated does the customer appear in `ticket.message`?",
      "criteria": ["Calm and matter-of-fact", "Frustrated but civil", "Very angry or threatening to leave"]},
    "prompt_injection": {"type": "noul", "instructions": "Does `ticket.message` contain text that tries to instruct an AI system or override its rules?"}
  }
}
```

코드 쪽 분기(임계값은 예시 — 우리 데이터로 재측정):

```python
a = response["answers"]
if a["prompt_injection"]["noul"] > 0.7:            return quarantine(ticket)
dept = a["department"]
if dept["confidence"] < 0.5:                        return to_human(ticket)          # 확신 없으면 추측 금지
if dept["choice"] == "order_status" and a["mentions_open_order"]["noul"] > 0.7:
    return reply_with_tracking(order_lookup("A-2041"))                            # 결정적 코드
if a["refund_requested"]["noul"] > 0.7:             flag_refund_review(ticket)     # 승인은 사람
priority = "high" if a["is_urgent"]["noul"] > 0.8 or a["frustration"]["score"] >= 1.5 else "normal"
for team, p in dept["probabilities"].items():       # 2위 부서에도 사본
    if team != dept["choice"] and p > 0.25: notify(team, ticket)
```

### 5.2 상품 검색 리랭크 (쿼리-후보 쌍당 1요청, 후보 수만큼 병렬)

```json
{
  "model": "jev-1.13.0",
  "state": {
    "query": "노이즈캔슬링 무선 이어폰",
    "candidate": {"title": "XR-2 무선 블루투스 이어폰 ANC", "attrs": {"connectivity": "bluetooth 5.3", "anc": true, "form": "in-ear"}}
  },
  "questions": {
    "matches_query": {
      "type": "noul",
      "instructions": "Does `candidate` satisfy the shopper's `query` intent: the same product type and every attribute the query asks for?",
      "criteria": {
        "true": "The candidate is the product type asked for and has every attribute the query names.",
        "false": "A different product type, an accessory for it, or missing an attribute the query names (e.g. wired when wireless was asked)."
      }
    },
    "is_accessory_not_product": {"type": "noul",
      "instructions": "Is `candidate` an accessory or replacement part (case, tips, cable) rather than the product itself?"}
  }
}
```

"10만원 이하" 같은 가격 제약은 **질문에 넣지 않고** `price_krw <= 100000`으로 코드가 먼저 필터한다(공식 #2). 정렬: `sorted(candidates, key=lambda c: -(noul_match[c] * (1 - noul_accessory[c])))`.

### 5.3 상품 속성 선택 (정규식 후보 → Choice)

```json
{
  "model": "jev-1.13.0",
  "state": {
    "listing_title": "[정품] 삼성 갤럭시 버즈3 프로 실버 SM-R630 + 전용 케이스 세트 (버즈2 프로 호환 불가)",
    "candidates_found_by_regex": ["갤럭시 버즈3 프로", "버즈2 프로", "SM-R630"]
  },
  "questions": {
    "model_name": {"type": "choice",
      "instructions": "Which of the candidate spans is the model name of the product actually being sold in `listing_title`?",
      "criteria": {"갤럭시 버즈3 프로": null, "버즈2 프로": null, "SM-R630": null, "none": "None of the candidates is the product's model name."}},
    "bundle_included": {"type": "noul", "instructions": "Does `listing_title` state that an extra item is bundled with the main product?"},
    "color": {"type": "choice", "instructions": "Which color does `listing_title` state for the product?",
      "criteria": {"silver": null, "black": null, "white": null, "not_stated": "The title does not state a color"}}
  }
}
```

### 5.4 핵심 시나리오: 메모 → 복합조건 슬롯 (B 단계, 1콜 15질문)

```json
{
  "model": "jev-1.13.0",
  "state": {
    "memo": "회사 워크숍 기념품으로 30명분 준비. 개당 2만원 안쪽으로, 로고 인쇄 가능한 텀블러나 보온병. 스테인리스가 좋고 플라스틱은 피하고 싶음. 색은 검정이나 네이비 계열. 다음 주 금요일까지는 받아야 함.",
    "number_spans_found_by_regex": ["30명", "2만원"],
    "today": "2026-09-23 (Wednesday)"
  },
  "questions": {
    "category": {"type": "choice",
      "instructions": "Which product category does `memo` ask for? Pick `multiple` if it names more than one acceptable category.",
      "criteria": {"tumbler": "Insulated tumbler or travel cup", "thermos": "Vacuum flask / thermal bottle", "mug": "Ceramic or glass mug",
                   "water_bottle": "Non-insulated bottle", "multiple": "More than one of the above is acceptable to the writer",
                   "not_stated": "The memo does not name a drinkware category"}},
    "category_alternatives": {"type": "noul",
      "instructions": "Does `memo` say that either a tumbler or a thermos would be acceptable (an OR between categories)?"},
    "material_preferred": {"type": "choice", "instructions": "Which material does `memo` prefer for the product?",
      "criteria": {"stainless_steel": null, "plastic": null, "glass": null, "ceramic": null, "not_stated": "No material preference is stated"}},
    "material_excluded_plastic": {"type": "noul", "instructions": "Does `memo` say plastic should be avoided or excluded?",
      "criteria": {"true": "The writer wants to avoid plastic", "false": "Plastic is not mentioned, or is acceptable"}},
    "color_family": {"type": "choice",
      "instructions": "Which color family does `memo` ask for? Pick `dark_neutral` if it names black or navy or similar dark tones.",
      "criteria": {"dark_neutral": "Black, navy, charcoal, dark tones", "white_light": "White, ivory, light tones", "bright": "Red, yellow, bright colors",
                   "pastel": null, "metallic": "Silver, gold finishes", "not_stated": "No color is stated"}},
    "customization_logo": {"type": "noul", "instructions": "Does `memo` require that a logo or text can be printed or engraved on the product?"},
    "purpose": {"type": "choice", "instructions": "What is the product for, according to `memo`?",
      "criteria": {"corporate_gift": "Company event souvenir, employee or client gift", "personal_use": null, "resale": null,
                   "personal_gift": "Gift to a friend or family member", "not_stated": "The purpose is not stated"}},
    "budget_span": {"type": "choice",
      "instructions": "Which of `number_spans_found_by_regex` is the price budget per unit stated in `memo`?",
      "criteria": {"30명": null, "2만원": null, "none": "None of the spans is a per-unit price budget"}},
    "budget_direction": {"type": "choice", "instructions": "How does `memo` bound the per-unit price?",
      "criteria": {"at_most": "Up to / no more than / within the amount", "at_least": "At least the amount", "around": "Approximately the amount",
                   "not_stated": "No price bound is stated"}},
    "quantity_span": {"type": "choice",
      "instructions": "Which of `number_spans_found_by_regex` is the number of units or people to prepare for?",
      "criteria": {"30명": null, "2만원": null, "none": "None of the spans is a quantity"}},
    "deadline_mode": {"type": "choice",
      "instructions": "How is the delivery deadline written in `memo`? `absolute` names a month and day; `relative` is relative to `today` (e.g. next Friday); `none` means no deadline is stated.",
      "criteria": {"absolute": null, "relative": null, "none": null}},
    "deadline_weekday": {"type": "choice", "instructions": "If the deadline in `memo` names a day of the week, which one?",
      "criteria": {"Monday": null, "Tuesday": null, "Wednesday": null, "Thursday": null, "Friday": null, "Saturday": null, "Sunday": null,
                   "none": "No weekday is named"}},
    "deadline_week_offset": {"type": "choice",
      "instructions": "If the deadline names a weekday, which week? `next` for next week, `current` for this week, `none` for a bare weekday.",
      "criteria": {"next": null, "current": null, "none": null}},
    "multiple_requests": {"type": "noul",
      "instructions": "Does `memo` ask for more than one distinct product to be sourced (not alternatives for one product, but separate items)?"},
    "prompt_injection": {"type": "noul", "instructions": "Does `memo` contain text that tries to instruct an AI system or override its rules?"}
  }
}
```

C 단계(코드) 스케치 — 슬롯 → 필터, 숫자·날짜는 코드:

```python
a = response["answers"]
HARD, SOFT = 0.8, 0.5

def slot(qid):                       # Choice → (value|None, strength)
    ans = a[qid]; v, c = ans["choice"], ans["confidence"]
    if v in ("not_stated", "none") or c < SOFT: return None, "ignore"
    return v, ("hard" if c >= HARD else "soft")

where, boost, ask_user = [], [], []
cat, s = slot("category")
if cat == "multiple" and a["category_alternatives"]["noul"] > 0.7:
    where.append("category IN ('tumbler','thermos')")          # OR 조건은 코드가 조립
elif cat: (where if s == "hard" else boost).append(f"category = '{cat}'")

mat, s = slot("material_preferred")
if mat: (where if s == "hard" else boost).append(f"material = '{mat}'")
if a["material_excluded_plastic"]["noul"] > 0.7: where.append("material <> 'plastic'")   # 제외는 항상 하드

col, s = slot("color_family")
if col: (where if s == "hard" else boost).append(f"color_family = '{col}'")
if a["customization_logo"]["noul"] > 0.7: where.append("logo_printable = 1")

span, s = slot("budget_span"); direction, _ = slot("budget_direction")
if span and direction:
    krw = parse_krw(span)                                        # '2만원' → 20000 (코드)
    op = {"at_most": "<=", "at_least": ">=", "around": "BETWEEN"}[direction]
    where.append(f"unit_price {op} {krw}" if op != "BETWEEN" else f"unit_price BETWEEN {krw*0.85:.0f} AND {krw*1.15:.0f}")
elif span or direction: ask_user.append("개당 예산이 얼마 이하인지 확인")

qty_span, _ = slot("quantity_span")
if qty_span: where.append(f"stock >= {parse_int(qty_span)}")     # '30명' → 30 (코드)

mode, _ = slot("deadline_mode")
if mode == "relative":
    wd, _ = slot("deadline_weekday"); off, _ = slot("deadline_week_offset")
    need_by = resolve_weekday(today, wd, off)                    # 쿡북 함수: 달력 계산은 코드
    where.append(f"lead_time_days <= {(need_by - today).days}")

if a["multiple_requests"]["noul"] > 0.7: split_with_llm_and_rerun(memo)   # smart-home 패턴
if a["prompt_injection"]["noul"] > 0.7: quarantine(memo)

candidates = db.query(where, order_by=boost)[:30]               # D 단계로: 후보당 Noul 재채점(§5.2 형태)
```

호출 예(대기열 없이):

```bash
# OpenRouter Decisions (alpha) — /api/v1 이 아니라 /api/alpha 임에 주의
curl -X POST https://openrouter.ai/api/alpha/decisions \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" -H "Content-Type: application/json" \
  -d @payload_inquiry.json   # "model": "typesafe/jev-1.13" 로 바꿔서

# TypeSafe 직접 (키 발급 후)
curl -X POST https://api.typesafe.ai/v1/systemone \
  -H "Authorization: Bearer $TYPESAFE_API_KEY" -H "Content-Type: application/json" \
  -d @payload_inquiry.json
```

## 6. 악마변호인 교차검증

| 주장 (누가) | 반증·한계 (출처) | 판정 |
| --- | --- | --- |
| "환각하지 않는다" (TypeSafe 블로그) | 타입 오류가 없을 뿐, **틀린 유효값**은 낸다. The Register: "공정한 비교가 아니다… 틀릴 가능성을 배제하지 않는다." HN 최상위 댓글 동일. 약관도 "부정확할 수 있으니 독립 평가하라"(토큰포스트) | **마케팅 표현.** "스키마 위반 0"으로 읽어야 함 |
| "40~200배 빠름, 193.6x/444.6x" (홈) | 회사 스스로 "상위 끝단", 워크플로 평가는 자사 팀이 제작, 참조 정답은 Astra·Fable 평균. 제3자: Suraj **부하 하에서만 수백 배, 용량 충분하면 3.3x**; Qiita 2.5~3.7x(OpenAI), 6~8x(로컬 qwen) | **속도 우위는 실재하나 배수는 조건 의존.** 비용 우위가 더 안정적(1/4~1/35) |
| "LLM과 동급 지능" | Qiita: 4데이터셋 중 1승 1패 2무, **보정 후 유의차 0**. Suraj: 92.2 vs 93.6. goodstartlabs: 프론티어와 일치 86~92%, LLM 간 88~95% → "실제 격차" | **동급~약간 아래.** "더 똑똑함"이 아님 |
| 문서대로 원자 질문으로 쪼개면 잘 된다 | 포커 평가(backnotprop): 솔버 대비 단일질문 63%, 6판단+코드 57%, 쟁점 스팟만 38~44%; **"체크 가능하면 체크" 규칙이 72%.** 넛츠를 들고 16/16회 올인. 상대 플러시를 카드로 보여줘도 0.62~0.84로 "앞선다" — `hand_rank` 문구를 넣어야 반전 | **상태를 "결론 직전"까지 코드로 계산해 줘야 한다.** 다단 추론·숨은 상태가 있는 도메인엔 부적합 |
| 캘리브레이션이 좋다 | Qiita: 4데이터셋 중 3에서 ECE 최저 — 지지. Laya 페이지: "Jev ECE 0.246"(제3자 AbdelStark·nibzard 인용, 원문 미확인) | **대체로 지지되나 데이터셋 의존.** 우리 데이터로 재측정 |
| 새로운 종류의 모델 | HN: 인코더 분류기·BART 제로샷은 수년 전부터; Laya(ConvAI)는 arXiv 2503.23303(2025-03)·2510.01237로 선행 주장, Apache-2.0 가중치 공개, 32.8ms. 단 Laya는 77옵션에서 0.425(Jev 0.870), 제로샷 ~0.35(파인튠 후 0.766) | **개념은 선행 존재.** Jev의 차별점은 "제로샷·최대 255옵션·보정된 confidence·관리형 API" |
| 생태계가 빠르게 커진다 (Threads) | 5개 중 3개 사실, 1개(json-render) 과장, 1개 확정 불가. jev-ultrafast 17.7k★는 browser-use 브랜드. OpenRouter 7일 83.7M 토큰은 실사용 신호이지만 규모는 소형(LLM 대비) | **커지는 중은 맞음, "이미 검증된 생태계"는 아님.** 출시 8일차 |
| 한국어도 된다 | 공식 "영어만큼은 아님". **공개 한국어 벤치 없음.** 검색 요약의 "한국어 82.5%"는 일본어 오역(원문 확인) | **미검증.** 가장 큰 도입 리스크 |
| 가격 $0.042/무료 출력 | 회사: "보조금 아님을 증명할 수 없다. 장기적으로 지속성 입증 필요." HN: "출력 무료가 언제까지?" 한도는 "예고 없이 변동" | **현재 가격을 장기 계약 전제로 삼지 말 것.** 콜당 토큰이 LLM보다 많을 수 있음(짧은 입력에서 +150) |
| 접근 용이 | 콘솔 키는 **대기열**. 가중치 비공개, 온프렘 불가. 우회: OpenRouter(alpha 계약, 변경 가능), Cloudflare, Vercel | PoC는 가능, **프로덕션은 SLA·계약 확인 필요** |
| 적대 입력 안전 | 공식 #6: "state를 적대적으로 취급하지 않는다." 고객 문의·판매자 제목은 사용자 생성 텍스트 | **인젝션 Noul을 반드시 동반**, 그것도 모델이므로 100%는 아님 |
| Noul 0.5 = 중간 강도 | 공식: 0.5는 "예/아니오 확률이 비슷함". Noul↔Choice 확률 비교 불가, 임계값 이전 불가 | 질문 타입을 바꾸면 임계값을 다시 잰다 |
| Doom·체스 데모 | HN: 체스 봇 "말을 매 수 헌납" | 데모는 지연 시연이지 지능 증명이 아님 |
| **메모에서 "단어 조합을 추출"할 수 있다** (우리 기대) | Jev는 문자열을 만들지 못한다(공식 #9). 옵션에 없는 브랜드·모델명·신조어는 **절대 출력되지 않는다.** LLM JSON 모드는 열린 어휘 추출이 한 콜에 되지만 Jev는 안 됨 | **"추출"을 "닫힌 선택 + 스팬 선택"으로 재정의해야 성립.** 열린 어휘는 사전/LLM 후보 → Jev 검증(§4.1 E) |
| 슬롯 15~20개를 한 콜에 물으면 다 잘 나온다 | 팬아웃은 공식 권장이지만, 각 질문은 독립 평가라 "텀블러**나** 보온병"(OR)·"플라스틱**은** 피함"(부정)을 한 Choice가 알아서 합치지 않는다. 포커 평가: 상태에 결론 직전 정보를 넣어야 반전 | OR·부정·제외는 **별도 Noul**로 질문에 미리 새겨야 한다. 질문 설계가 곧 정확도 |
| 숫자 조건은 Jev가 처리 | 공식 #2·#3: 계산·개수·날짜 비교 불가. 포커 평가: 아웃츠·팟오즈를 코드로 줘도 판단은 틀림 | **정규식 스팬 + 방향 판정까지만.** `<=`·환산·리드타임은 코드. 스팬이 정규식에 안 잡히면(예: "이만원") Jev도 못 고른다 → 정규식 커버리지가 곧 리콜 |
| function-calling 쿡북이 우리 시나리오를 입증 | 영어 14문장, 티커 6개·인자 값 2~5개짜리 닫힌 집합. 우리 메모는 한국어·속성 수십 개·값 수십 개, 상품 카테고리는 "텀블러/보온병" 경계가 모호 | **형태만 같고 난도는 다르다.** 200건 라벨 없이는 confidence 임계값 하나도 정할 수 없음 |
| 메모 1건 = Jev 1콜이면 끝 | B(슬롯) 1콜 + D(후보 K개 재채점) K콜(또는 ≤255면 1콜) + 다중 요청 분할 시 LLM 1콜 + 열린 어휘 시 LLM 1콜 | 비용은 여전히 낮다(B ≈ $0.00006, D 30후보 ≈ $0.001)지만 **지연은 D의 병렬도와 LLM 분할 여부**에 달림 |

미해결·미검증으로 남긴 것:

- Jev의 **한국어 실측**(정확도·confidence 분포·인젝션 민감도). 이 보고서의 가장 큰 공백.
- 우리 문의·상품 데이터에서의 **임계값**(문서·쿡북 값은 전부 예시).
- OpenRouter Decisions API의 alpha 계약 안정성, TypeSafe 대기열 통과 소요 시간.
- HN 댓글 "DeepSeek V4.1 Flash 대비 2.6배만 저렴"(goodstartlabs 인용) — 원문에서 해당 수치 미확인.
- Laya가 인용한 Jev ECE 0.246·AG News 0.910의 원출처(AbdelStark, nibzard) 미열람.
- 상품 리랭크는 법률 문단(CLERC) 결과를 전이한 추정 — 상품 데이터 실측 없음.
- **메모 → 슬롯 시나리오의 실측 자체가 없다.** function-calling 쿡북(영어·닫힌 집합 소규모)에서 형태만 확인. 한국어 메모의 OR·부정·모호어("안쪽", "계열")에서 Jev가 어떻게 답하는지, `not_stated`를 과발동하는지(Suraj: catch-all 5.0% 과발동) 전부 미측정.
- 정규식이 놓치는 숫자 표기("이만원", "만 원 정도", "20k")의 실제 비율 — 스팬 선택 패턴의 리콜 상한.

## 7. 하지 말 것 / 할 것

하지 말 것:

- Jev에 답변·요약·문장 생성을 시키기. 가격 비교·개수·날짜 순서를 묻기.
- "이 티켓은 스팸인가?" 같은 광역 질문 하나로 끝내기. 질문을 쪼개고 코드로 합친다.
- `jev-latest`로 운영하며 임계값을 튜닝하기. **`jev-1.13.0`을 고정**하고 응답의 `model`을 로그.
- Noul에서 잰 임계값을 Choice에 옮기기. 두 질문의 확률로 산술 항등식을 기대하기.
- 영어 벤치 수치를 한국어 운영 기대치로 쓰기.
- 브라우저에서 키를 직접 쓰기(서버 사이드 전용).

할 것:

- 시작은 **메모 → 슬롯(§5.4) 1건**: 실제 메모 200건에 속성 슬롯 정답을 라벨 → 슬롯별 정확도 vs confidence 곡선 → `HARD/SOFT` 임계값 → 하드 필터 오탐률(정답 상품을 잘라내는 비율)을 먼저 본다. 슬롯 하나라도 하드 필터가 정답을 자르면 추천은 실패이므로, **초기엔 소프트 가중만 쓰고 하드 필터는 confidence ≥ 0.9에서만** 켠다.
- 같은 200건에서 정규식 스팬 커버리지(숫자·날짜 표기 리콜)를 따로 잰다 — Jev 이전 단계의 상한이다.
- 다음이 **DB 후보 재채점(§5.2 형태)**: 후보 30개 × 메모 50건 정답 순위로 top-1/top-5 개선폭.
- 고객 문의는 **트리아지(§5.1)**: 라벨 200건 → 자동화율/정확도 트레이드오프 표.
- 상품 카탈로그 정제는 **동일 상품 판정(§4.2-4)**. 정답 세트가 이미 있는 쪽부터.
- 모든 판정에 `other/none/not_stated` 탈출구, 인젝션 Noul, 2위 확률 로그. 속성 사전에 없는 값이 `other`로 떨어진 메모는 사전 보강 큐로.
- 비용은 입력 토큰으로 사전 계산(출력 무료): 메모 슬롯 1콜 ≈ 1.4k 토큰 ≈ $0.00006; 후보 30개 재채점 ≈ $0.001; 문의 1건 ~500~700토큰 → 1,000건 ≈ $0.02~0.03.
- 이 저장소(하나비 지도)와의 접점은 작다: 공식 페이지 텍스트에서 `rainPolicy`(hold/cancel/postpone/unknown) Choice 추출, 로컬 제보 텍스트의 모더레이션 Noul 정도. 별도 과제로.

## 8. 가설 검증 — "조합을 많이 테스트해 경험을 쌓고, 엣지 케이스 데이터를 더하면 분배처리가 더 효율적이 된다"

여기서 **분배처리**는 두 뜻을 다 포함한다: ① 항목을 자동 처리 / 확인 질문 / LLM·사람 이관으로 나누는 것, ② 메모를 카테고리·필터 슬롯으로 배분하는 것. 가설을 셋으로 쪼개면 판정이 갈린다.

| 하위 명제 | 판정 | 한 줄 근거 |
| --- | --- | --- |
| H1. 경험이 **Jev에** 쌓인다 (데이터를 더 보내면 모델이 나아진다) | **거짓** | 공식 models.md: "고객 데이터로 파인튠·LoRA하지 않는다. 같은 가중치가 모든 계정을 서빙한다. 도메인은 요청(state·instructions·criteria)으로 반영한다." 호출 간 기억 없음. 매 콜이 제로샷 |
| H2. 경험이 **우리가 소유한 산출물에** 쌓인다 (질문 세트·임계값·코드 규칙·다운스트림 모델·평가셋) | **참** | Southbridge: 기준 문구만 바꿔 0/13 → 13/13. Archestra: 9-shot 예시로 93% → 95%. autoresearch 쿡북: 질문 탐색 루프로 RMSE 1.87 → 1.77. Archestra: 오답 분석이 **스펙 불명확(63/400)** 을 드러내 스펙을 고침 |
| H3. 그 결과 분배가 **더 효율적**이 된다 | **조건부 참** | confidence 게이팅이 자동/이관을 나눈다: SIC 60건 conf≥0.9 → 확신 절반 90% vs 나머지 40%; 모더레이션 top-p≥0.60 → 자동 74.2% @ 일치 99.2%; Archestra conf≥0.7 구간 무오류. **조건**: confidence가 정답/오답을 실제로 분리해야 하고(한국어 미측정), 천장은 모델 고유 정확도(포커: 튠해도 65%) |

### 8.1 경험은 어디에 쌓이는가

| 저장 위치 | 무엇이 개선되나 | 실측 | 비용·주의 |
| --- | --- | --- | --- |
| **질문 문구·criteria 구조** (`what/not_for/examples`) | 경계가 헷갈리는 옵션 분리, 부정·OR 명시 | Southbridge 가구 링크 Noul: "무엇이 증거가 아닌가" → "무엇이면 충분한가"로 바꾸자 0/13 → 13/13 (개발셋). 공식 advanced.md: 구조화 기준이 "옵션 간 경계를 날카롭게" | 토큰 몇 개. 가장 싼 레버. 단 문구 변경 = 임계값 재보정 |
| **criteria 안의 예시(few-shot)** | 엣지 케이스를 옵션 설명에 박아 넣기 | Archestra 337판정: Jev 0-shot 93% → 9-shot 95% (+2pt). 소형 디코더는 +20~34pt, 인코더(Laya)는 −2(무효) | **Jev에선 효과가 작다.** 매 콜 토큰 증가, 32k(state+최장 질문) 한도. 예시 9개로 2pt면 문구 정리가 더 남 |
| **옵션 사전 확장** (`other`로 떨어진 값 수집) | 커버리지(모델은 옵션 밖을 못 고름) | Suraj: Jev가 catch-all을 5.0% 과발동(타 모델 3.3%) — `other` 로그가 사전 보강 후보 | 옵션당 토큰 소폭. Choice ≤255 |
| **임계값·밴드** | 자동 비율 ↔ 정확도 트레이드오프의 무릎 위치 | Qiita 200건: 0.05 차이 확정에 검출력 부족. Wilson 95% 구간 폭(정확도 0.9): n=50 ±8pt, n=200 ±4pt, n=1000 ±2pt | 라벨 비용만. **held-out 없이 튜닝하면 과적합**(포커: 구성 변경 47건 중 12 고침·21 깨짐) |
| **코드 선행 규칙·정규식·사전** | 결정적으로 처리 가능한 클러스터를 Jev 앞에서 제거 | Archestra: 79%가 무해한 로컬 명령 → 상수가 79%. 포커: "체크 가능하면 체크" 규칙 72% > Jev 63% | 무료·즉시. 단 취약(표기 변형) |
| **다운스트림 고전 ML** (Jev 확률을 피처로) | 질문 조합·가중치를 데이터로 학습 | autoresearch 쿡북(와인 2,000건, held-out 800): 평균 예측 3.09 → 단어수 CatBoost 2.47 → Jev에 점수 직접 질문 2.15 → 질문 18개 1콜 1.87 → 5라운드 38질문 1.77 | LLM 제안 콜 + Jev 콜 + 학습. **이득의 대부분은 첫 질문 설계**(2.15→1.87), 이후 4라운드는 1.87→1.77 |
| **평가셋·스펙** | 무엇이 정답인지 자체가 정교해짐 | Archestra: 판정자 3가족 불일치 63/400 → "규칙이 불명확했다" → 스펙 명문화 + 위험 사례 층화 수집 예정. goodstartlabs: 불일치가 "다른 검토자나 더 명확한 루브릭이 필요한 곳"을 알려줌 | 사람 시간. 가장 근본적 |

### 8.2 분배 효율의 실측 (confidence 게이팅)

| 출처 | 게이트 | 자동 처리 비율 | 자동 구간 성능 | 이관 구간 성능 |
| --- | --- | --- | --- | --- |
| classification_using_confidence (SIC 75그룹, 60건, jev-1.12) | conf ≥ 0.9 → 그룹, 미만 → 상위 부문 | 50% | 27/30 = **90%** | 12/30 = 40% → 상위 레벨로 보고하면 **70%**. 전체 유용 답 39/60 → 48/60 |
| consistency_choice (모더레이션 8 Choice ×15회, jev-latest 2026-09-11) | top-p ≥ 0.60, 미만 → `uncertain` 사람 | **74.2%** | 일치 90.8% → **99.2%**(정확도 아님, 재현성) | — |
| consistency_noul (보험 14 Noul ×15회) | 0.30~0.70 → `uncertain` | — | `covered`가 0.43~0.53으로 0.5를 넘나듦 → 밴드가 흡수. 평균 std 0.0102 | — |
| Archestra (337판정) | conf ≥ 0.7 | 미공개 | **무오류** | — |
| Qiita banking77 (200건) | 상위 80% conf | 80% | 0.790 → **0.875** | 하위 20% ≈ 0.45 (역산) |
| Qiita ja_sentiment (200건) | 상위 80% | 80% | 0.825 → 0.894 | ≈ 0.55 (역산) |
| Southbridge ER (오하이오) | Jev 판정 → Luna 5가족 리뷰 | Jev가 워크호스 | Fable 대비 −0.5pp 이내, 비용 1/226 | Jev **단독**은 "정확도가 크게 떨어짐" |
| LangChain (에이전트 평가 500판정) | — | — | 이진 500/500 오라클 일치, 분산 LLM의 1/92~1/913 | — |

읽는 법: 게이트는 **자동 비율을 내주고 정확도를 산다.** 그 곡선의 모양(어느 비율에서 정확도가 얼마인가)은 모델+질문+데이터 분포가 정하는 고정 성질이고, 데이터를 쌓아서 할 수 있는 일은 (a) 무릎 위치를 정확히 찍기, (b) 질문을 고쳐 곡선 자체를 위로 밀기, (c) 식별 가능한 실패 클러스터를 코드로 빼서 `uncertain` 버킷을 줄이기 — 셋뿐이다.

### 8.3 반복 루프의 수익 곡선

- **첫 설계가 가장 크다.** autoresearch: 질문 없이 Jev에 점수를 직접 묻기 2.15 → 잘 설계한 18질문 1.87 (−0.28), 이후 4라운드 −0.10. Suraj도 "jev 요청을 먼저 린트했다 — 잘못 놓인 질문은 모델이 아니라 질문을 측정한다."
- **비용은 사실상 0이라 많이 돌릴 수 있다.** 포커 300콜 363k 토큰 ≈ 1.5센트; Qiita 821건 $0.019; LangChain 500판정 $0.34(Claude $28.17); 우리 §5.4 페이로드 200건 × 1.4k 토큰 ≈ **$0.012, 병렬 1분**. "많은 경험을 쌓는" 비용이 라벨링 비용으로만 환원된다 — 이것이 Jev가 실험 루프에 유리한 진짜 이유다.
- **held-out이 없으면 루프가 해를 끼친다.** 포커: 6판단+코드 구성 변경이 47건을 뒤집었는데 12건은 맞게, 21건은 틀리게. 절반으로 튠·절반으로 채점하니 65%(무튠 57~63%). autoresearch도 800건 held-out을 루프가 절대 보지 않게 했다.
- **엣지 케이스는 양이 아니라 층화다.** Archestra: 무작위 100건 중 위험 사례 10건 → "상수 79% 함정". 다음 벤치는 "무작위 샘플링이 만드는 것보다 많은 위험 사례"를 넣는다. 우리도 200건 무작위 + 엣지 100건(OR·부정·모호어·숫자 표기 변형·다중 요청·인젝션) 층화가 맞다.

### 8.4 임계값이 약해지는 조건

- **확률 드리프트.** Archestra 5회 반복(400판정): 라벨 동일 394~398/400이지만 확률이 bit-identical한 건 35~39%, |Δp| p95 0.05 · 최대 0.17. 팽팽한 임계값(0.69 vs 0.71)은 노이즈를 재는 것. consistency_noul의 **밴드**(0.30~0.70 → 사람)가 처방.
- **옵션 순서.** 3지선다 Choice에서 키 순서를 뒤집으면 100건당 5~7건 뒤집힘, 순서 효과만 ≈4/100, 정확도 −1.5~2pt. 한 건은 0.83 internal → 0.48 public. 이진 Noul/Choice는 0건. **옵션 순서는 프롬프트 포맷이 아니라 버전 관리 대상**(KKamJi 동일 지적).
- **버전·문구 변경 = 재보정.** 별칭 이동 시 답이 바뀔 수 있음(models.md). 문구·옵션·파서·정책을 바꾸면 이전 임계값 재사용 금지.
- **분리 실패 시 게이팅 무효.** Laya 51개 언어 실측: 영어 인코더는 크메르어 정확도 0.000에서 confidence 0.952. "모델 confidence는 입력을 못 읽을 때 경고하지 않는다." Jev가 한국어에서 같은지 **미측정** — 정확도만이 아니라 **AUROC/ECE(분리·보정)** 를 재야 게이팅을 믿을 수 있다.

### 8.5 우리 시나리오의 실험 설계 (가설을 참으로 만드는 절차)

1. **라벨**: 실제 메모 200건 무작위 + 엣지 100건 층화. 슬롯별 정답(`not_stated` 포함), 추천 정답 상품 ID.
2. **분할**: dev 200 / held-out 100. held-out은 루프가 보지 않는다.
3. **1콜 15질문 실행**(§5.4) → 슬롯별 정확도·**AUROC·ECE**·`not_stated`/`other` 발동률. 비용 ≈ $0.02.
4. **게이트 곡선**: 슬롯별 confidence 컷을 0.5~0.95로 스윕 → 자동 비율 vs 정확도 → **하드 필터 오탐률**(정답 상품을 잘라내는 비율)이 1% 미만인 컷만 하드로.
5. **실패 클러스터 분류**(dev 오답 전수): (a) 문구·기준 → 수정 (b) 옵션 누락 → 사전 추가 (c) 정규식 미포착 → 코드 (d) OR·부정 미분리 → Noul 추가 (e) 진짜 모호 → 사람/확인 질문. Archestra처럼 **정답 자체가 불명확한 건은 스펙을 고친다.**
6. **재실행 → held-out 채점.** 개선이 held-out에서 유지될 때만 채택. 포커식 과적합 방지.
7. **고정**: `jev-1.13.0`, 질문 JSON, 옵션 순서, 임계값을 한 커밋에 버전 태깅. 응답 `model` 로그.
8. **운영 루프**: `uncertain`·`other` 로그 → 월 1회 라벨 추가 → 3~6 반복. 별칭 이동·문구 변경 시 4부터 재실행.

### 8.6 이 가설에 대한 악마변호인

| 반론 | 판정 |
| --- | --- |
| "데이터를 쌓아도 모델은 그대로면 결국 모델 천장에 막힌다" | **맞다.** 포커 쟁점 스팟 38~44%는 어떤 튜닝으로도 규칙 이하. 우리 슬롯 중 고유 정확도가 낮은 것(모호어·미묘한 카테고리 경계)은 코드·사람으로 빼는 것이 정답이고, 그 판단 자체가 데이터로 가능해진다 |
| "그럼 파인튠 되는 모델(Laya)이 낫다" | **부분 맞다.** Laya 제로샷 0.35 → 파인튠 0.766. 단 20옵션 초과 급락(banking77 0.425 vs Jev 0.870), 비라틴 실패, 자체 GPU 운영. 우리 라벨이 수천 건이고 옵션 ≤20이면 후보; 수백 건·다옵션·운영 최소면 Jev |
| "few-shot으로 엣지 케이스를 넣으면 되지 않나" | **약하다.** Jev +2pt(9-shot). 문구·구조 정리와 코드 규칙이 더 싸고 큼 |
| "제3자 클라이언트 문서가 'TypeSafe 문서에 파인튜닝 옵션이 있다'고 한다" (hexdocs Elixir) | **공식 문서와 상충.** models.md는 파인튠 없음 명시. 미검증 → 무시 |
| "재현성이 높으니 임계값 하나면 충분" | **틀리다.** 라벨은 안정(394~398/400)이지만 확률은 드리프트(최대 0.17). 밴드 + 여유 필요 |
| "많이 테스트하면 자동으로 좋아진다" | **틀리다.** held-out 없는 반복은 과적합(포커). 첫 설계·스펙 명확화·층화가 반복 횟수보다 중요(autoresearch) |

## 출처

공식:

- 소개·모델·API: https://docs.typesafe.ai/introduction.md · https://docs.typesafe.ai/models.md · https://docs.typesafe.ai/api.md · https://docs.typesafe.ai/confidence.md · https://docs.typesafe.ai/concepts/system-one.md · https://docs.typesafe.ai/concepts/how-to-build-with-system-one.md · https://docs.typesafe.ai/concepts/use-case-map.md · https://docs.typesafe.ai/introduction/coding-agents.md · https://docs.typesafe.ai/introduction/quickstart.md
- 약점: https://docs.typesafe.ai/model-jaggedness/jev-1.13.md
- 원시형·패턴: https://docs.typesafe.ai/primitives/choice.md · https://docs.typesafe.ai/patterns/intent-routing.md · https://docs.typesafe.ai/patterns/fan-out.md · https://docs.typesafe.ai/demos/smart-home.md
- 쿡북(메모→슬롯 시나리오): https://docs.typesafe.ai/cookbooks/function_calling.md · https://docs.typesafe.ai/cookbooks/date_extraction_cookbook.md · https://docs.typesafe.ai/cookbooks/sde_cascade.md · https://docs.typesafe.ai/cookbooks/pre_parsed_value_extraction_cookbook.md
- 쿡북(§8 가설 검증): https://docs.typesafe.ai/cookbooks/autoresearch_feature_discovery.md · https://docs.typesafe.ai/cookbooks/classification_using_confidence.md · https://docs.typesafe.ai/cookbooks/consistency_choice_cookbook.md · https://docs.typesafe.ai/cookbooks/consistency_noul_cookbook.md · https://docs.typesafe.ai/primitives/advanced.md · https://docs.typesafe.ai/introduction/machine-learning-primer.md
- 쿡북(검색·문의): https://docs.typesafe.ai/cookbooks/rerank_typesafe.md · https://docs.typesafe.ai/cookbooks/semantic_find.md · https://docs.typesafe.ai/cookbooks/hierarchical_classification.md · https://docs.typesafe.ai/cookbooks/entity_alignment.md · https://docs.typesafe.ai/cookbooks/classifying_rag_passages.md · https://docs.typesafe.ai/cookbooks/llm_guardrails.md · https://docs.typesafe.ai/cookbooks/parallel_questions.md
- 출시 블로그: https://typesafe.ai/blog/introducing-system-one-models-and-jev
- 패키지: https://pypi.org/project/typesafe-sdk/ · https://www.npmjs.com/package/@typesafe-ai/sdk · https://github.com/typesafe-ai

배포 채널:

- OpenRouter: https://openrouter.ai/typesafe/jev-1.13 · https://openrouter.ai/docs/cookbook/evaluate-and-optimize/jev-verified-cascade · https://openrouter.ai/docs/api/api-reference/alphadecisions/submit-a-decisions-questions-and-answers-request
- Cloudflare: https://developers.cloudflare.com/ai/models/typesafe/jev/
- Vercel: https://vercel.com/kb/guide/typesafe-jev-and-ai-sdk · https://vercel.com/changelog/typesafe-ai-jev-now-available-on-ai-gateway · https://ai-sdk.dev/docs/ai-sdk-core/evaluation

Threads 포스트가 인용한 레포(GitHub API 2026-09-23):

- https://github.com/browser-use/jev-ultrafast · https://github.com/tamaratran/fast-jev-compaction · https://github.com/vercel-labs/json-render · https://github.com/itsmostafa/typesafe-mcp · https://github.com/tumf/jev-cli · https://github.com/Nasrallah-AL/jev-cli · https://github.com/maayanlevy/mysql-ailike

제3자 평가·비판:

- HN 원 스레드(1,958pt/511댓글): https://news.ycombinator.com/item?id=49717558
- Suraj Phanindra, 트리아지 부하 벤치: https://suraj-website-eta.vercel.app/blog/what-a-correct-decision-costs
- Qiita skrtk98, 821건 비교(일본어): https://qiita.com/skrtk98/items/5c70baea21908705eb9f
- backnotprop, 포커 솔버 대조: https://backnotprop.com/blog/jev-poker/
- Good Start Labs, 루브릭 채점 6,003건: https://goodstartlabs.com/research/verification-is-the-bottleneck
- Southbridge.AI, 엔티티 해소 파이프라인: https://www.southbridge.ai/blog/jev-entity-resolution
- Archestra, 실제 툴콜 100건·9-shot·재현성·옵션 순서: https://archestra.ai/blog/we-tested-jev-on-100-real-agent-calls
- LangChain, Jev-as-a-judge 분산·비용: https://www.langchain.com/blog/jev-agent-evals-langsmith
- Pydantic AI TypeSafeModel(같은 질문을 LLM과 A/B): https://pydantic.dev/docs/ai/models/typesafe/
- Sean Goedecke, 두 기법: https://www.seangoedecke.com/two-techniques-for-working-with-system-one-models/
- Laya(오픈소스 대안·선행 주장): https://laya.convaiinnovations.com/
- The Register: https://www.theregister.com/ai-and-ml/2026/09/16/typesafe-ai-debuts-model-for-machines-that-plays-doom/5296711
- dev.to 요약(HN 1,655pt 시점): https://dev.to/jamilxt/this-new-ai-model-refuses-to-write-text-that-is-exactly-why-it-runs-100x-faster-4he

한국어·일본어 2차 자료:

- AI매터스: https://aimatters.co.kr/ai-tool/52674/ · 토큰포스트: https://www.tokenpost.kr/news/ai/410536 · memoryhub: https://memoryhub.tistory.com/entry/TypeSafe-Jev-%EB%AA%A8%EB%8D%B8%EC%9D%B4%EB%9E%80-%EA%B8%80-%EB%8C%80%EC%8B%A0-%EA%B2%B0%EC%A0%95%EC%9D%84-%EB%82%B4%EB%86%93%EB%8A%94-System-One-AI · KKamJi: https://kkamji.net/posts/jev-system-one-decision-model/
- Oflight(일본, 12 유스케이스): https://www.oflight.co.jp/en/columns/typesafe-jev-practical-guide-use-cases-2026
