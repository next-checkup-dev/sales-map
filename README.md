# 영업사원 지도 및 현황 관리 시스템

Google Sheets 연동 영업사원 지도 및 현황 업데이터 웹앱입니다.

## 🚀 주요 기능

- 📱 **모바일 최적화** - PWA 지원, 반응형 디자인
- 🔐 **Firebase 인증** - 영업사원 로그인 시스템
- 🗺️ **지도 연동** - 네이버맵 기반 영업사원 위치 표시
- 📊 **실시간 현황** - 영업사원별 매출 및 활동 현황
- 📋 **Google Sheets 연동** - 데이터 읽기/쓰기 기능

## 🛠️ 기술 스택

- **Frontend**: Next.js 15, TypeScript, Material-UI (MUI)
- **Backend**: Firebase (Authentication, Firestore)
- **Deployment**: Firebase Hosting
- **Maps**: Naver Map API

## 📋 설치 및 설정

### 1. 프로젝트 클론
```bash
git clone <repository-url>
cd next-checkup-sales-map
npm install
```

### 2. Firebase 프로젝트 설정

1. [Firebase Console](https://console.firebase.google.com/)에서 새 프로젝트 생성
2. Authentication > Sign-in method에서 이메일/비밀번호 활성화
3. Firestore Database 생성
4. 프로젝트 설정 > 일반에서 웹 앱 추가

### 3. 환경 변수 설정

`.env.local` 파일을 생성하고 Firebase 및 네이버 지도 설정 정보를 입력:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# 네이버 지도 API 설정
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=your_actual_client_id_here
```

### 4. Firebase CLI 설치 및 설정

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
```

`.firebaserc` 파일에서 프로젝트 ID 수정:
```json
{
  "projects": {
    "default": "your-firebase-project-id"
  }
}
```

### 4. 네이버 지도 API v3 설정 (중요!)

**기존 API가 종료되어 새로운 Maps API v3로 전환되었습니다.**

1. [네이버 클라우드 플랫폼](https://www.ncloud.com/)에서 계정 생성
2. **AI·NAVER API** → **Maps** → **Maps JavaScript API** 신규 신청
3. **애플리케이션 등록** 후 **Client ID** 발급
4. **웹 서비스 URL**에 다음 주소들을 추가:
   - `http://localhost:3000`
   - `http://127.0.0.1:3000`
   - 배포 도메인 (예: `https://your-app.web.app`)
5. **환경변수 설정**:
   - 프로젝트 루트에 `.env.local` 파일 생성
   - `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=your_new_client_id` 추가

**주의사항**: 기존 `zdfpu9twx9` 클라이언트 ID는 더 이상 사용할 수 없습니다. 새로운 Maps JavaScript API 클라이언트 ID를 발급받아 사용하세요.

### 5. 영업사원 계정 생성

Firebase Console > Authentication > Users에서 다음 계정들을 생성:

1. **김태휘**
   - 이메일: kim@example.com
   - 비밀번호: 1234

2. **권연욱**
   - 이메일: kwon@example.com
   - 비밀번호: 1234

## 🚀 개발 서버 실행

```bash
npm run dev
```

http://localhost:3000에서 확인 가능

## 📦 빌드 및 배포

### 빌드
```bash
npm run build
```

### Firebase 배포
```bash
firebase deploy
```

## 📱 사용법

1. **로그인**: 이메일과 비밀번호로 로그인
2. **홈**: 전체 현황 및 최근 활동 확인
3. **지도**: 영업사원 위치 확인 (네이버맵 연동)
4. **영업사원**: 영업사원 목록 및 상세 정보
5. **현황**: 영업 현황 분석
6. **설정**: Google Sheets 연동 및 기타 설정

## 🔧 추가 개발 예정

- [x] 네이버맵 API 연동
- [ ] Google Sheets API 연동
- [ ] 실시간 데이터 동기화
- [ ] 푸시 알림 기능
- [ ] 영업사원 위치 추적

## 🚨 문제 해결

### 네이버 지도 API v3 인증 실패

**오류 메시지**: "네이버 지도 Open API 인증이 실패하였습니다. 클라이언트 아이디와 웹 서비스 URL을 확인해 주세요."

**해결 방법**:
1. 새로운 Maps JavaScript API 클라이언트 ID를 발급받았는지 확인
2. 웹 서비스 URL에 `http://localhost:3000`이 등록되어 있는지 확인
3. 환경변수 `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID`가 올바르게 설정되었는지 확인
4. 기존 `zdfpu9twx9` 클라이언트 ID는 더 이상 사용할 수 없으므로 새로운 ID로 교체
5. 새로운 API v3는 `ncpKeyId` 파라미터를 사용하므로 올바른 엔드포인트를 사용하는지 확인

### Google Sheets 연동 오류

1. Google Cloud Console에서 Sheets API가 활성화되어 있는지 확인
2. 서비스 계정 키 파일이 올바르게 설정되었는지 확인
3. 스프레드시트에 서비스 계정 이메일이 공유되어 있는지 확인

## 📄 라이선스

MIT License

## 🤝 기여

이슈 및 풀 리퀘스트 환영합니다!
