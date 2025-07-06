# 영업사원 지도 및 현황 관리 시스템

Google Sheets 연동 영업사원 지도 및 현황 업데이터 웹앱입니다.

## 🚀 주요 기능

- 📱 **모바일 최적화** - PWA 지원, 반응형 디자인
- 🔐 **Firebase 인증** - 영업사원 로그인 시스템
- 🗺️ **지도 연동** - 카카오맵 기반 영업사원 위치 표시
- 📊 **실시간 현황** - 영업사원별 매출 및 활동 현황
- 📋 **Google Sheets 연동** - 데이터 읽기/쓰기 기능

## 🛠️ 기술 스택

- **Frontend**: Next.js 15, TypeScript, Material-UI (MUI)
- **Backend**: Firebase (Authentication, Firestore)
- **Deployment**: Firebase Hosting
- **Maps**: Kakao Map API

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

`.env.local` 파일을 생성하고 Firebase 설정 정보를 입력:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
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
3. **지도**: 영업사원 위치 확인 (카카오맵 연동 예정)
4. **영업사원**: 영업사원 목록 및 상세 정보
5. **현황**: 영업 현황 분석
6. **설정**: Google Sheets 연동 및 기타 설정

## 🔧 추가 개발 예정

- [ ] 카카오맵 API 연동
- [ ] Google Sheets API 연동
- [ ] 실시간 데이터 동기화
- [ ] 푸시 알림 기능
- [ ] 영업사원 위치 추적

## 📄 라이선스

MIT License

## 🤝 기여

이슈 및 풀 리퀘스트 환영합니다!
