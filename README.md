# 카트먼 때리기

이 폴더의 파일은 폴더를 선택하지 않고 여러 파일을 한 번에 업로드할 수 있도록 모두 같은 위치에 놓여 있습니다. 사이트는 GitHub Pages 정적 호스팅으로 실행하며 Node 서버나 로컬 모드는 없습니다.

## 업로드 및 공개

1. 이 ZIP을 풀고 GitHub 저장소의 **Add file → Upload files**에서 폴더 안의 파일을 모두 선택합니다. 파일 선택 창에서 폴더 안으로 들어간 뒤 `Ctrl+A`를 누르면 전체 선택됩니다.
2. GitHub에 업로드 목록이 표시되면 **Commit changes**를 눌러 저장소 최상위에 올립니다. `index.html`, `game.js`, CSS와 이미지 파일들이 같은 위치에 있어야 합니다.
3. 저장소 **Settings → Pages → Build and deployment**에서 `Deploy from a branch`, `main`, `/(root)`를 선택해 저장합니다.

## 매일 온라인 게임과 기록 저장 설정

Firebase를 한 번 설정하면 별도 Node 서버 없이 사이트가 항상 온라인으로 제공되고 플레이어 기록이 저장됩니다.

1. Firebase Console에서 프로젝트를 만들고 웹 앱을 추가합니다.
2. **Authentication → Sign-in method → Anonymous** 로그인을 켭니다.
3. **Realtime Database**를 만들고 데이터베이스 URL을 복사합니다.
4. `firebase-config.js`의 `YOUR_...`를 Firebase 웹 앱 설정값으로 바꿉니다. `databaseURL`은 Realtime Database URL입니다.
5. `database.rules.json` 내용을 Realtime Database **Rules**에 붙여넣고 저장합니다.
6. 수정한 `firebase-config.js`를 GitHub 저장소에 다시 올려 커밋합니다.

Firebase 설정 전에는 시작 버튼이 비활성화됩니다. 설정을 완료한 뒤에는 같은 브라우저에서 익명 계정이 유지되어 재접속 시 점수와 도우미 수를 불러옵니다. 점수와 도우미 수는 클릭/구매/도우미 보상 때마다 Firebase에 저장되며, 도우미는 온라인 상태에서만 3초마다 점수를 얻습니다.

## 점수 규칙과 한계

- 기본 클릭 1점, 12% 확률로 3점, 피버 동안 5점
- 도우미 비용 50점, 온라인 상태에서 3초마다 한 명당 1점
- 닉네임은 현재 접속한 이용자끼리 중복할 수 없습니다.
- 이 버전은 클라이언트가 점수를 Firebase에 직접 기록하므로 개발자 도구로 점수를 조작할 수 있습니다. 공정한 대회에는 Cloud Functions 등 서버 측 점수 검증이 필요합니다.
- 클릭 효과음 `click.mp3`는 제공되지 않았습니다. 추가하지 않아도 게임은 동작합니다.
- South Park 이미지 사용 권리는 포함되어 있지 않으므로 공개 배포 전에 사용 권리를 확인하세요.
