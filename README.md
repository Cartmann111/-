# 카트먼 때리기

GitHub Pages에서 제공하는 정적 사이트입니다. Node.js 서버 없이 HTML/CSS/JavaScript로 실행됩니다. Firebase를 연결하면 접속 중인 플레이어 점수와 랭킹을 실시간으로 공유합니다. Firebase 설정을 입력하기 전에도 브라우저 로컬 모드로 게임을 플레이할 수 있습니다.

## GitHub Pages 공개

1. 저장소에 프로젝트 파일을 올립니다. `docs/` 폴더와 그 안의 `index.html`이 저장소 최상위에 있어야 합니다.
2. GitHub 저장소 **Settings → Pages → Build and deployment**에서 `Deploy from a branch`를 선택합니다.
3. 브랜치를 `main`, 폴더를 `/docs`로 선택해 저장합니다.
4. 잠시 기다린 뒤 Pages 설정에 표시되는 사이트 주소를 엽니다. 프로젝트 사이트 주소는 보통 `https://<사용자명>.github.io/<저장소명>/` 형식입니다.

## Firebase로 실시간 대전 켜기

이 설정을 하면 별도로 Node 서버를 운영하지 않고도 여러 사람의 점수를 실시간으로 볼 수 있습니다. Firebase의 웹 설정값은 브라우저 코드에 들어가므로 데이터베이스 보안 규칙이 반드시 필요합니다.

1. Firebase Console에서 프로젝트를 만들고 **웹 앱**을 추가합니다.
2. **Authentication → Sign-in method**에서 **Anonymous** 로그인을 켭니다.
3. **Realtime Database**를 만들고 데이터베이스 URL을 복사합니다.
4. `docs/firebase-config.js`의 `YOUR_...` 값을 Firebase 웹 앱 설정값으로 바꿉니다. `databaseURL`에는 Realtime Database URL을 넣습니다.
5. Realtime Database **Rules**에 아래 규칙을 저장합니다.
6. 변경한 파일을 저장소의 `main` 브랜치에 올리고, Pages 사이트를 새로고침합니다.

### Realtime Database 보안 규칙

저장소 루트의 `database.rules.json`에도 같은 규칙이 들어 있습니다.

```json
{
  "rules": {
    "players": {
      ".read": true,
      "$uid": {
        ".write": "auth != null && auth.uid === $uid",
        ".validate": "newData.hasChildren(['name', 'score', 'helpers', 'uid']) && newData.child('uid').val() === $uid && newData.child('name').isString() && newData.child('name').val().length > 0 && newData.child('name').val().length <= 16 && newData.child('score').isNumber() && newData.child('score').val() >= 0 && newData.child('helpers').isNumber() && newData.child('helpers').val() >= 0"
      }
    },
    "names": {
      "$namekey": {
        ".write": "auth != null && ((newData.val() === auth.uid && (!data.exists() || data.val() === auth.uid)) || (!newData.exists() && data.val() === auth.uid))",
        ".validate": "newData.isString() && newData.val() === auth.uid"
      }
    }
  }
}
```

## 게임 규칙

- 일반 클릭은 1점이며, 12% 확률로 3점입니다.
- 피버는 30초마다 7초 동안 진행되며 클릭당 5점입니다.
- 도우미는 50점으로 고용하고, 3초마다 한 명당 1점을 얻습니다.
- 닉네임은 접속 중 중복 사용할 수 없습니다. 퇴장하면 점수와 닉네임 예약을 지우도록 설정되어 있습니다.
- Firebase 설정 전에는 로컬 모드로 실행되어 다른 사람의 점수를 볼 수 없습니다.

## 알아둘 점

- 이 구성은 가벼운 친구 간 점수 놀이용입니다. 브라우저가 자기 점수를 직접 기록하므로 개발자 도구를 사용하는 이용자는 점수를 조작할 수 있습니다. 공정한 공개 대회에는 서버에서 점수를 검증하는 Cloud Functions 같은 서버 측 로직이 필요합니다.
- Firebase 규칙은 각 익명 사용자가 자기 플레이어 항목만 변경하도록 제한하지만, 점수 계산 자체를 신뢰할 수 있게 만들어 주지는 않습니다.
- 효과음 파일 `docs/assets/click.mp3`는 제공 파일에서 찾지 못했습니다. 해당 파일을 추가하면 클릭 시 재생됩니다.
- South Park 캐릭터 이미지 사용 권리는 프로젝트에 포함되지 않습니다. 공개 사이트에 배포하기 전에 사용 권리를 확인하세요.

## 파일 위치

- 사이트 화면: `docs/index.html`, `docs/style.css`
- 클릭 및 Firebase 연결: `docs/game.js`
- Firebase 설정: `docs/firebase-config.js`
- Firebase 보안 규칙 샘플: `database.rules.json`
- 이미지: `docs/assets/`
