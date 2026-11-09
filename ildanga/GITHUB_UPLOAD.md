# GitHub에 올리기

이 ZIP 자체가 아니라 압축을 푼 프로젝트 파일을 Git으로 올립니다. 처음에는 Private 저장소를 권장합니다.

## GitHub Desktop 사용

1. 이 압축파일을 풀어 `ildanga` 폴더를 준비합니다.
2. GitHub Desktop에서 File → Add local repository → Choose...로 해당 폴더 선택.
3. Git 저장소가 아니라는 안내에서 create a repository here 선택. 최종 경로가 `ildanga` 폴더인지 확인합니다.
4. 만들어진 저장소의 Changes에서 `README.md`, `app/`, `server/`, `gradle/` 등을 확인합니다. 키·캐시·local.properties가 포함되어 있으면 커밋하지 않습니다.
5. 변경사항이 있으면 Summary에 `Initial commit: Ildanga prototype`을 입력하고 Commit to main.
6. Publish repository → 이름 `ildanga` → Keep this code private 체크 → Publish repository.

## PowerShell과 Git으로 올리기

GitHub에서 `ildanga`라는 빈 Private 저장소를 먼저 만듭니다. README / .gitignore / License 자동 추가는 선택하지 않습니다.
프로젝트 폴더(README.md와 gradlew.bat가 보이는 폴더)의 터미널에서:

```powershell
git init -b main
git add .
git status --short
git commit -m "Initial commit: Ildanga prototype"
```

GitHub의 새 저장소 화면에서 저장소 HTTPS URL을 복사한 뒤 아래 URL 부분을 교체합니다. 따옴표는 유지합니다.

```powershell
git remote add origin "https://github.com/YOUR_ACCOUNT/ildanga.git"
git push -u origin main
```

계정 인증은 Git/GitHub의 로그인 창에서 진행합니다. 토큰을 저장소 URL에 넣지 마세요. GitHub 사용자명/이메일 설정을 요구하면 본인의 GitHub 계정 설정을 사용하세요.

업로드 후 저장소 첫 화면에 README와 app 폴더가 보이면 됩니다. 기존 PC의 추가 수정은 이 ZIP에 없을 수 있으니 기존 폴더를 먼저 보관하세요. 기존 캐시는 업로드하지 않습니다.
