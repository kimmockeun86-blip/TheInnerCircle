# 배포 가이드 (Deployment Guide)

이 문서는 The Inner Circle 백엔드 서버를 Render 또는 Vercel에 배포하고, Gemini API를 정상적으로 작동시키는 방법을 설명합니다.

---

## 📋 목차

1. [환경 변수 설정](#환경-변수-설정)
2. [Render 배포](#render-배포)
3. [Vercel 배포](#vercel-배포)
4. [프론트엔드 설정](#프론트엔드-설정)
5. [문제 해결](#문제-해결)

---

## 🔐 환경 변수 설정

### 필수 환경 변수

배포 환경에서 다음 환경 변수를 반드시 설정해야 합니다:

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `GEMINI_API_KEY` | Google Gemini API Key | `AIzaSy...` |
| `PORT` | 서버 포트 (선택사항) | `3000` |

⚠️ **중요**: 환경 변수가 설정되지 않으면 서버는 fallback 키를 사용하지만, 프로덕션 환경에서는 권장하지 않습니다.

---

## 🚀 Render 배포

### 1. Render 프로젝트 생성

1. [Render 대시보드](https://dashboard.render.com/)에 로그인
2. **New +** 버튼 클릭 → **Web Service** 선택
3. GitHub 저장소 연결

### 2. 환경 변수 설정

Render 대시보드에서:

1. 생성한 서비스 클릭
2. 왼쪽 메뉴에서 **Environment** 선택
3. **Add Environment Variable** 클릭
4. 다음 값 입력:
   - **Key**: `GEMINI_API_KEY`
   - **Value**: `YOUR_ACTUAL_GEMINI_API_KEY`
5. **Save Changes** 클릭

### 3. 빌드 설정

- **Build Command**: `npm install` (또는 `cd server && npm install`)
- **Start Command**: `node server/server.js`
- **Environment**: `Node`

### 4. 배포 확인

배포 후 다음을 확인하세요:

```bash
# Health Check 엔드포인트 테스트
curl https://your-app-name.onrender.com/api/health
```

예상 응답:
```json
{
  "status": "ok",
  "timestamp": "2025-12-03T15:00:00.000Z"
}
```

### 5. 로그 확인

Render 대시보드에서 **Logs** 탭을 열어 다음을 확인:

- ✅ `Using GEMINI_API_KEY from environment variables` (성공)
- ⚠️ `WARNING: GEMINI_API_KEY environment variable not set!` (실패 - 환경 변수 재설정 필요)

---

## ⚡ Vercel 배포

### 1. Vercel 프로젝트 생성

1. [Vercel 대시보드](https://vercel.com/dashboard)에 로그인
2. **New Project** 클릭
3. GitHub 저장소 연결

### 2. 환경 변수 설정

1. 프로젝트 설정 → **Environment Variables** 탭
2. 다음 변수 추가:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: `YOUR_ACTUAL_GEMINI_API_KEY`
   - **Environment**: Production, Preview, Development 모두 선택
3. **Save** 클릭

### 3. 빌드 설정

`vercel.json` 파일이 필요할 수 있습니다 (프로젝트 루트에 생성):

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server/server.js"
    }
  ]
}
```

### 4. Serverless Function 타임아웃 설정

Gemini API 호출은 시간이 걸릴 수 있으므로, 타임아웃을 늘려야 합니다.

`vercel.json`에 추가:
```json
{
  "functions": {
    "server/server.js": {
      "maxDuration": 60
    }
  }
}
```

---

## 📱 프론트엔드 설정

### `src/config.ts` 수정

배포된 서버를 사용하려면 `MODE`를 `'production'`으로 변경하세요:

```typescript
const MODE: 'local' | 'tunnel' | 'production' = 'production'; // ✅ 변경
```

`production` URL이 실제 배포된 서버 주소와 일치하는지 확인:

```typescript
production: {
    url: 'https://theinnercircle-9xye.onrender.com/api' // ✅ 실제 URL로 변경
}
```

### 변경 사항 적용

1. 파일 저장
2. 앱 재시작: `npm start` (또는 `expo start`)
3. 앱 콘솔에서 확인:
   ```
   [Config] Current Mode: production
   [Config] API URL: https://theinnercircle-9xye.onrender.com/api
   ```

---

## 🔧 문제 해결

### ✅ 체크리스트

배포 후 AI가 작동하지 않으면 다음을 확인하세요:

#### 1. 환경 변수 확인

**Render:**
- Dashboard → Your Service → Environment 탭
- `GEMINI_API_KEY`가 설정되어 있는지 확인

**Vercel:**
- Project Settings → Environment Variables
- `GEMINI_API_KEY`가 Production에 설정되어 있는지 확인

#### 2. 서버 로그 확인

**Render:**
- Dashboard → Your Service → Logs 탭

**Vercel:**
- Dashboard → Your Project → Deployments → Latest → **Function Logs**

예상 로그:
```
✅ Using GEMINI_API_KEY from environment variables
Gemini Model Initialized.
Server running on port 3000 (0.0.0.0)
```

#### 3. Health Check 테스트

```bash
curl https://your-app.onrender.com/api/health
```

#### 4. Profile Analysis 테스트

```bash
curl -X POST https://your-app.onrender.com/api/analysis/profile \
  -H "Content-Type: application/json" \
  -d '{
    "name": "테스트",
    "gender": "남성",
    "age": 25,
    "job": "개발자",
    "location": "서울",
    "idealType": "배려심 있는 사람",
    "hobbies": "독서",
    "growthGoal": "더 나은 사람 되기",
    "complex": "인정받고 싶음",
    "deficit": "사랑"
  }'
```

예상 응답:
```json
{
  "success": true,
  "analysis": "당신의 결핍은...",
  "recommendedMission": "작은 기부를 해라"
}
```

#### 5. 프론트엔드 URL 확인

앱 콘솔에서 다음을 확인:
```
[Config] Current Mode: production
[Config] API URL: https://theinnercircle-9xye.onrender.com/api
[API] analyzeProfile calling: https://theinnercircle-9xye.onrender.com/api/analysis/profile
```

---

### 🐛 일반적인 오류

#### 오류 1: `GEMINI_API_KEY environment variable not set`

**원인**: 환경 변수가 설정되지 않음

**해결책**:
1. Render/Vercel 대시보드에서 `GEMINI_API_KEY` 환경 변수 추가
2. 서비스 재배포 (Render는 자동, Vercel은 수동)

---

#### 오류 2: `Network Error - No response received`

**원인**: 프론트엔드가 잘못된 서버 주소를 호출

**해결책**:
1. `src/config.ts`에서 `MODE`를 `'production'`으로 변경
2. `production.url`이 실제 배포된 서버 주소와 일치하는지 확인
3. 앱 재시작

---

#### 오류 3: `CORS Error`

**원인**: CORS 설정 문제

**확인 사항**:
- `server.js`의 CORS 설정이 `origin: '*'`인지 확인
- 프로덕션에서는 특정 도메인으로 제한 가능:
  ```javascript
  app.use(cors({
      origin: ['https://your-frontend-domain.com'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
  }));
  ```

---

#### 오류 4: `API Timeout`

**원인**: Gemini API 응답이 느림

**해결책** (Vercel의 경우):
- `vercel.json`에 `maxDuration` 설정:
  ```json
  {
    "functions": {
      "server/server.js": {
        "maxDuration": 60
      }
    }
  }
  ```

**해결책** (Render의 경우):
- Render는 기본 타임아웃이 길어서 별도 설정 불필요

---

### 📊 디버깅 팁

#### 서버 로그 읽는 법

성공적인 API 호출:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Profile Analysis] Request received
[Profile Analysis] User: 테스트 | Deficit: 사랑
[Profile Analysis] Sending to Gemini API...
[Profile Analysis] Gemini raw response received: {"analysis"...
[Profile Analysis] Parsed JSON: { analysis: '...', recommendedMission: '...' }
[Profile Analysis] ✅ Success - Sending response
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

실패한 API 호출:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Profile Analysis] ❌ ERROR: API key not valid
[Profile Analysis] Error type: Error
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 📞 추가 지원

문제가 계속되면 다음을 확인하세요:

1. **Gemini API Key 유효성**: [Google AI Studio](https://makersuite.google.com/app/apikey)에서 키 확인
2. **API 할당량**: Gemini API 사용량 제한 확인
3. **서버 상태**: Render/Vercel 서버가 정상적으로 실행 중인지 확인

---

**작성일**: 2025-12-04  
**버전**: 1.0
