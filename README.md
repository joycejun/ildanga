# 일단가 · Ildanga

**사람들이 직접 만든 여행 코스를 차 안에서 그대로 따라가는 앱.**
마음에 드는 코스를 내 코스로 가져와 장소·순서·한 줄 메모를 고치고, 구간별로 PLEOS 내비에 넘겨 출발합니다.

- 팀: 이브나이 (일반 부문)
- 대상: Hyundai PLEOS (Pleos Connect 에뮬레이터)
- 구조: Java `MainActivity` 안의 WebView에서 HTML/CSS/JS 화면 실행
- 현대자동차 공식 앱·제휴 서비스가 아닙니다.

## 핵심 기능과 현재 상태

| 기능 | 상태 |
| --- | --- |
| 지역·테마별 사용자 코스 탐색, 작성자·메모 표시 | 구현 (기본 코스·작성자·좋아요는 **시연 데이터**) |
| 코스를 내 코스로 가져와 장소·순서·메모 편집, 커뮤니티에 올리기 | 구현 — 저장은 **이 기기 안에서만** (사용자 간 공유 서버·댓글 미구현) |
| **내 주변 코스** (현재 위치 기준 가까운 순) | 구현 — Pleos FusedLocation → Android 위치 → 기본 위치(대전) 순으로 시도. Pleos 위치 수신은 에뮬레이터에서 확인 후 갱신 |
| 구간별 PLEOS 내비 길안내 (NaviHelper) | 구현 |
| Gleo 음성·텍스트 명령 (코스 만들기·순서 바꾸기·삭제·저장) | 부분 구현 (순서 교환·뒤집기·삭제·저장) |
| **주행 중 모드** (CarUxRestrictions): 입력·편집 잠금, 읽기·길안내만 허용 | 구현 — 에뮬레이터 확인 필요 |
| **Back 하드키**: 팝업 닫기 → 홈 → 앱 숨기기(`moveTaskToBack`, `finish()` 미사용) | 구현 — 에뮬레이터 확인 필요 |
| 장소 정보: Google Maps 영업시간·전화(탭하면 전화 앱) | 구현 — **서버 필요** |
| 후기 요약(좋았던 점·아쉬운 점·방문 팁), 근처 공영주차장 | 구현 — **서버 필요** (후기 원문은 표시하지 않음) |
| **서버 없이도 시연** | 구현 — 서버가 없으면 내장 **예시 데이터**로 대체하고 화면에 "예시" 표시 (가짜 전화번호는 표시하지 않음) |
| CCP(로터리) 조작 | 미지원 (`com.hmg.rotary.ROTARY_SUPPORTED=false`) |

## 개발·시연 환경

- Android Studio, JDK 17, Android SDK API 34 (minSdk 28)
- Android Gradle Plugin 8.7.3 / Gradle Wrapper 8.9
- Pleos SDK: NaviHelper 3.0.5, FusedLocation 1.1.3 (Nexus 저장소는 `settings.gradle`에 설정)
- 시연 에뮬레이터: Pleos Connect 2.1.0 (Automotive, API 34) — 화면 규격: **(여기에 사용한 화면 크기 기입: 12.9" 세로 / 14.6" 가로 등)**
- 서버(선택): Python 3.10 이상 (표준 라이브러리), 후기 요약은 Ollama 필요

## 실행 방법

1. 저장소 안의 ildanga 폴더를 Android Studio로 열고 Gradle Sync 후 PLEOS 에뮬레이터에서 `app`을 실행합니다.
2. **서버 없이**: 그대로 실행하면 코스 탐색·편집·내 주변 코스·내비 전달이 동작하고, 후기·영업시간·주차장은 "예시 데이터 모드"로 보입니다. 주소에 `?demo=1`을 붙이면 예시로 고정됩니다.
3. **서버와 함께** (실제 후기·영업시간·전화·주차장):
   ```powershell
   cd server
   $env:GOOGLE_PLACES_API_KEY="<본인 키>"
   python places_server.py
   ```
   debug 빌드는 `http://127.0.0.1:8765`로 연결됩니다. release 빌드는 HTTPS 서버만 허용하므로
   `gradlew assembleRelease -PplacesApiBase=https://서버주소`로 빌드하세요.
4. API 키(Google, Kakao 등)는 코드·README·스크린샷·이슈에 붙여 넣지 마세요. 키가 노출됐다면 재발급하세요.

## 구조

- `app/src/main/java/` — WebView, PLEOS 내비(NaviHelper), 위치(`PleosLocation`), 주행 제한(`DrivingState`), 음성 브리지
- `app/src/main/assets/` — 화면(`glass-v3.*`), 코스 편집, 서버 없는 시연(`glass-offline.js`)
- `server/` — 장소 검색 프록시, Google 후기·영업시간, 로컬 AI 요약
- `tests/` — 모의 응답을 사용하는 화면 흐름 테스트
- `THIRD_PARTY.md` — 외부 서비스·폰트(Pretendard, SIL OFL) 안내

## 확인한 것과 못 한 것

- 브라우저(Chromium)에서 화면 흐름, 내 주변 코스 정렬, 서버 없는 모드, 주행 모드 전환을 모의 응답으로 확인했습니다.
- 실제 PLEOS 에뮬레이터에서의 FusedLocation 위치 수신, CarUxRestrictions 실제 신호, Back 하드키 동작, release APK 동작은 **(에뮬레이터에서 확인한 항목만 여기에 ✔ 로 갱신)**.
- 길안내 경로(OSRM)는 교통·체류시간을 반영하지 않은 예상 값입니다.

## 콘텐츠와 라이선스

기본 코스·작성자·좋아요는 시연 데이터이며 이미지가 실제 장소의 현장 사진임을 보장하지 않습니다. Google Maps·Kakao·한국관광공사 데이터는 각 제공사의 이용 조건을 따릅니다.
프로젝트 전체의 오픈소스 라이선스는 아직 지정하지 않았습니다. 포함된 외부 라이브러리·폰트의 개별 라이선스는 유지합니다.

## 제출 정보

- APK: `apk/이브나이_일단가_release.apk`
- 커밋 해시: **(제출 직전 `git rev-parse HEAD` 결과 기입)**
