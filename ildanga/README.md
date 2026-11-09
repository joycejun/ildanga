# 일단가 · Ildanga

계획 없이 떠나는 여행을 위한 차량용 코스 탐색·편집 프로토타입입니다. 사용자 추천 코스를 선택하고, 방문 장소를 바꾸거나 순서를 조정하며 나만의 루트를 만듭니다.

Hyundai PLEOS 에뮬레이터에서 시연하는 Android 프로젝트이며, Java Activity 안의 WebView에서 HTML/CSS/JavaScript 화면을 실행합니다. 현대자동차 공식 앱이나 제휴 서비스는 아닙니다.

## 기능과 현재 상태

| 기능 | 상태 |
| --- | --- |
| 지역별 추천 코스, 내 루트 저장 | 구현, 기기 로컬 저장 |
| 장소 칩 길게 눌러 순서 변경, 장소 추가·교체 | 구현, 실제 기기 제스처 확인 필요 |
| 지도와 구간별 거리·시간 | Leaflet / OpenStreetMap / OSRM 연동, 교통·체류시간 미반영 |
| 주변 장소 검색 | Kakao Local API, PC 연결 서버 필요 |
| 실제 후기 요약 | SocialCrawl + Ollama, 품질 개선 중 |
| 15곳 후기 사전 준비 및 요약 재사용 | 실행 도구 포함, 실제 결과 미포함 |
| 커뮤니티 | 로컬 시연, 사용자 간 공유 서버 미구현, 댓글 없음 |
| 음성 AI 여행 계획·차량 내비게이션 제어 | 미구현 |

최근 요청인 후기의 '핵심 단어만 표시' 및 '(2/8개 후기) 제거'는 아직 반영되지 않았습니다. 현재 요약은 짧은 문장과 근거 수를 표시합니다. 생성 모델의 중복·부정확한 표현을 개선해야 합니다.

## 실행 환경

- Android Studio, JDK 17, Android SDK API 34
- Android Gradle Plugin 8.7.3 / Gradle Wrapper 8.9
- Python 3.10 이상 (서버는 표준 라이브러리 사용)
- 후기 요약 사용 시 Ollama와 `qwen2.5:1.5b`
- PLEOS 에뮬레이터는 별도 설치, 저장소에 포함되지 않음

## 처음 실행하기 (Windows)

1. 저장소를 내려받고 `settings.gradle`이 있는 폴더를 Android Studio로 엽니다.
2. Gradle Sync 후 실행 기기로 PLEOS 에뮬레이터를 선택하고 `app`을 실행합니다.
3. 장소 검색은 `CONNECT_PLACES.cmd`, 후기까지 사용하려면 `CONNECT_REVIEWS.cmd`를 실행합니다.
4. 요청되는 API 키는 로컬 터미널에 입력합니다. 화면에 입력 문자가 표시되지 않습니다.
5. 연결 서버 창을 켜 둡니다. 연결 설정은 ADB reverse로 에뮬레이터와 PC의 8765 포트를 연결합니다.

API 키를 코드·README·스크린샷·이슈에 붙여 넣지 마세요. 설정 도구는 키를 실행 중인 프로세스 메모리에서 사용합니다. `local.properties`는 각 PC의 Android Studio가 생성합니다.

## 후기 미리 준비하기

Ollama를 켜고 `PREPARE_15_REVIEWS.cmd`를 실행합니다. 외부 API 크레딧을 사용해 5개 지역의 15곳을 순차 처리합니다. 이름·위치 확인이나 후기 확보에 실패한 장소는 미완료로 보고합니다. 실제 요약은 이 저장소에 포함되지 않습니다.

성공한 요약과 장소 검색 결과는 `server/review_cache/`에 저장하며 기본 재사용 기간은 7일입니다. 원문·키는 저장하지 않습니다. 캐시와 실행 보고서는 Git에서 제외됩니다. 저장·재사용 범위는 데이터 제공사의 이용조건에 맞춰 운영해야 합니다.

## 구조

- `app/src/main/java/` — Android WebView 및 로컬 서버 연결
- `app/src/main/assets/` — 화면, 지도, 코스 편집
- `server/` — 장소 검색 프록시, 후기 수집·요약, 사전 준비
- `tests/` — 모의 응답을 사용하는 화면 흐름 테스트
- `THIRD_PARTY.md` — 외부 서비스와 포함 라이선스 안내
- `GITHUB_UPLOAD.md` — GitHub 업로드 안내

## 검증

```powershell
python server/test_places.py
python server/test_reviews.py
npm install
npm test
```

테스트는 모의 API 응답을 포함합니다. 실제 PLEOS 렌더링·Android 빌드·API 사용량·사용자 PC의 Ollama 성능 전체를 검증한 것은 아닙니다. Gradle 빌드는 SDK 설정 후 `./gradlew assembleDebug`(Windows: `.\gradlew.bat assembleDebug`)로 실행합니다.

## 콘텐츠

기본 코스·작성자·좋아요는 시연 데이터입니다. 이미지가 실제 장소의 현장 사진임을 보장하지 않습니다. 청주 참고 코스는 `CHEONGJU_COURSE.md`의 편집 초안이며 지도에 등록되지 않았습니다. 실제 후기나 공식 추천 코스로 표시하지 않습니다.

프로젝트 전체의 오픈소스 라이선스는 아직 지정하지 않았습니다. 포함된 외부 라이브러리와 폰트의 개별 라이선스는 유지합니다.
