# 🚀 The Inner Circle 배포 가이드

이 가이드는 로컬에서 개발된 서버를 클라우드(Render.com)에 배포하는 방법을 설명합니다.

## 1. 준비 사항
- GitHub 계정
- Render.com 계정 (GitHub으로 로그인)
- MongoDB Atlas 계정 (무료 클러스터 생성 후 Connection String 확보)

## 2. 프로젝트 설정
프로젝트 루트에 `Procfile`이 생성되어 있어야 합니다. (이미 생성됨)
```
web: node server/server.js
```

## 3. GitHub에 코드 올리기
터미널에서 다음 명령어를 실행하여 코드를 GitHub 저장소에 푸시하세요.
```bash
git init
git add .
git commit -m "Production Ready: Photo Journal & Real Gemini"
# GitHub에서 새 리포지토리를 생성하고 아래 명령어로 연결하세요
git remote add origin <당신의_GITHUB_REPO_URL>
git push -u origin main
```

## 4. Render.com에 배포하기
1. Render 대시보드에서 **"New +"** 버튼 클릭 -> **"Web Service"** 선택.
2. "Connect a repository"에서 방금 올린 GitHub 리포지토리 선택.
3. 설정 입력:
   - **Name:** `the-inner-circle-server` (원하는 이름)
   - **Region:** `Singapore` (한국과 가까움) 또는 `Oregon`
   - **Branch:** `main`
   - **Root Directory:** (비워둠)
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server/server.js`
4. **Environment Variables (환경 변수)** 설정 (필수!):
   - `GEMINI_API_KEY`: `AIzaSyBnio5R8jKvguClPe5-e6_rtk1t3Z-VEZk` (또는 발급받은 키)
   - `MONGODB_URI`: `mongodb+srv://<username>:<password>@cluster0.mongodb.net/innercircle?retryWrites=true&w=majority` (MongoDB Atlas에서 복사한 주소)
5. **"Create Web Service"** 클릭.

## 5. 배포 완료 확인
배포가 완료되면 Render에서 제공하는 URL (예: `https://the-inner-circle.onrender.com`)이 생성됩니다.
이 URL을 앱의 `src/services/api.ts` 또는 `HomeScreen.tsx`의 API 호출 주소로 교체하면 앱이 실제 서버와 통신합니다.

## 6. 데이터 시딩 (선택 사항)
배포된 서버에 초기 데이터를 넣으려면 로컬에서 스크립트를 실행하되, `SERVER_URL`을 배포된 주소로 변경해서 실행하세요.
```javascript
// scripts/createTestData.js 수정
const SERVER_URL = 'https://your-app-name.onrender.com/api/users/register';
```
그리고 실행:
```bash
node scripts/createTestData.js
```

## 7. 관리자 기능 및 검증 (Admin Features)

### 관리자 대시보드 (Admin Dashboard)
- **위치**: `SettingsScreen` -> `ARCHITECT MODE` -> `관리자 대시보드`
- **기능**: 특정 사용자에게 강제로 미션을 부여하거나 상태를 변경할 수 있습니다.
- **사용법**:
  1. 대상 사용자의 ID (예: `User_Target`) 입력.
  2. 부여할 미션 내용 입력.
  3. "Force Assign Mission" 버튼 클릭.

### 관리자 푸시 알림 (Admin Push Simulation)
- **위치**: `SettingsScreen` -> `ARCHITECT MODE` -> `관리자 푸시 전송`
- **기능**: 실제 푸시 알림(FCM/APNs)이 아닌, 앱 내에서 푸시가 온 것처럼 시뮬레이션합니다.
- **검증 방법**: 버튼을 누르면 "관리자 알림: 당신의 파동이 변화하고 있습니다."라는 알림창(Alert)이 뜨는지 확인합니다.

### 미션 부여 검증 (Verification)
- 미션 부여 후, 서버 로그(`node server/server.js` 실행 창)에서 `[Admin] Assigned mission...` 메시지가 출력되는지 확인하세요.
- 앱 내에서는 `Toast` 메시지 또는 `Alert`으로 성공 여부가 표시됩니다.
