# 일단가 v2.6 — 작은 앱 창 / 장소 검색 연결

1. ZIP을 새 폴더 `C:\AndroidProjects\ildanga_v2_6`에 풉니다.
2. Android Studio → Open → settings.gradle, app, gradlew.bat가 있는 `ildanga_v2_6` 폴더.
3. Gradle JDK 17 또는 21 / Android SDK Platform 34 설치 후 Sync.
4. 정상 부팅된 Pleos 기기를 선택하고 app ▶ Run.

AGP 8.7.3 / Gradle 8.9 / Java17. 기존 프로젝트 위에 덮어쓰지 마세요.
별도의 MainActivity.kt 복사는 필요 없습니다. 이 프로젝트는 Java Activity + WebView UI입니다.
첫 빌드에는 인터넷 연결이 필요합니다. APK를 미리 빌드한 파일은 포함하지 않았습니다.

## v2.6 추가 변경
- 상세 정보만 스크롤, 장소 교체/영업정보/장소정보 버튼은 패널 하단에 유지.
- 홈 상단 중앙 '나만의 루트 만들기'와 AI 예시 요청 문장 추가.
- 루트 만들기: 지역 → 방문지 2~8개 선택 → 지도에서 순서 편집/저장.
- 예시 문장을 누르면 입력창에 그대로 채워집니다. AI/자동 현재 위치 추천은 아직 연결하지 않았습니다.
- CONNECT_PLACES.cmd: 키 비공개 입력, API 검증, 기기 연결과 서버 실행 자동화.

## 수정 사항
- 상단 로고와 메뉴를 분리해 중간의 긴 배경 바 제거.
- 검색과 코스 수정은 짧은 버튼으로 변경.
- 카드 사진을 빵/서울 노을/바다 이미지로 변경. 모두 생성형 이미지이며 실제 매장 사진이 아닙니다.
- 카드의 긴 설명·빈 공간·댓글 제거. 제목·순서·저장 중심.
- Asta Sans 유지. 화면 너비에 따라 제목 23–34px, 주요 글씨 20–30px 확대.
- 하단 모음함이 더 빨리 보이도록 높이 축소. 아주 작은 창은 스크롤 가능.
- 실제 장소정보 링크와 공식 영업안내 추가. 주변 검색용 연결 서버 포함.

## 실제 장소 연동
`PLACE_CONNECTION.md`를 먼저 읽으세요.
영업정보와 지도 페이지는 바로 열립니다. 앱 내부의 주변 검색은 카카오 REST API 키 + Python 서버 연결 후 동작합니다.
실제 API 키로 제공사 검색을 실행한 검증은 하지 못했습니다. 키 없이 성공했다고 표시하지 않습니다.
실시간 휴무/후기 본문/AI 요약은 제공 데이터가 없어 미연동이며, 실제 정보처럼 보이던 예시 후기는 제거했습니다.

## 앱이 안 보이면
```powershell
.\gradlew.bat :app:assembleDebug
$adb = Join-Path $env:LOCALAPPDATA 'Android\Sdk\platform-tools\adb.exe'
& $adb devices
& $adb install -r '.\app\build\outputs\apk\debug\app-debug.apk'
& $adb shell am start -n com.example.dateapp/.MainActivity
```
여러 기기면 adb -s <기기번호> 사용. 서명 불일치이면 기존 앱 데이터 백업 후 삭제하고 다시 설치합니다.

## 시연 범위
커뮤니티 게시·좋아요·저장은 기기 내부에 저장됩니다. 댓글은 제공하지 않습니다.
코스 도우미는 키워드 기반 편집 데모입니다. 음성/LLM/Gleo/CarUxRestrictions 미연동, 정차 상태에서만 시연하세요.
NaviHelper는 현재 미연동. 외부 지도 길찾기와 앱 내 OpenStreetMap/OSRM 미리보기만 구현했습니다.
카페 미확정 장소는 '예시' 표시를 유지합니다. 실제 주변 검색에서 장소를 교체할 수 있습니다.

## 검증
JS 문법, DOM 기능(검색/저장/교체/오류/댓글제거), 서버 공급자 응답 파싱/입력검증, Java 소스 컴파일 통과.
전체 Gradle APK 빌드와 PLEOS 실기 UI는 이 환경에서 확인하지 못했습니다.

## 폰트 출처
https://document.pleos.ai/docs/connect/guide/docs-design/foundations/typography
https://github.com/google/fonts/tree/main/ofl/astasans
Asta Sans 및 OFL 포함. 다른 컴퓨터에서도 폰트를 따로 설치할 필요가 없습니다.
