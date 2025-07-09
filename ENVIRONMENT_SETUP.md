# 환경 변수 설정 가이드

## Firebase 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```bash
# Firebase 설정
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# 네이버 지도 API 설정
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=your_naver_map_client_id
NEXT_PUBLIC_NAVER_MAP_CLIENT_SECRET=your_naver_map_client_secret

# 카카오 지도 API 설정 (선택사항)
NEXT_PUBLIC_KAKAO_MAP_API_KEY=your_kakao_map_api_key

# Google Sheets API 설정
GOOGLE_APPLICATION_CREDENTIALS=./google-service-account-key.json
```

## Firebase 프로젝트 설정 방법

1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. Authentication > Sign-in method에서 이메일/비밀번호 활성화
4. Project Settings > General에서 웹 앱 추가
5. 제공되는 설정 정보를 `.env.local` 파일에 복사

## Google Sheets API 설정 방법

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. Google Sheets API 활성화
4. 서비스 계정 생성 및 키 파일 다운로드
5. 다운로드한 키 파일을 프로젝트 루트에 `google-service-account-key.json`으로 저장
6. Google Sheets 문서에 서비스 계정 이메일을 편집자로 추가

### 상세 설정 단계:

#### 1. Google Cloud Console 설정
- [Google Cloud Console](https://console.cloud.google.com/) 접속
- 새 프로젝트 생성 (예: `next-checkup-sales-map`)
- Google Sheets API 활성화: "API 및 서비스" > "라이브러리" > "Google Sheets API" 검색 후 활성화

#### 2. 서비스 계정 생성
- "API 및 서비스" > "사용자 인증 정보" > "사용자 인증 정보 만들기" > "서비스 계정"
- 서비스 계정 이름 입력 (예: `sheets-api-service`)
- "키 만들기" > "JSON" 선택하여 키 파일 다운로드

#### 3. Google Sheets 권한 설정
- Google Sheets 문서 열기
- 우상단 "공유" 버튼 클릭
- 서비스 계정 이메일 추가 (예: `sheets-api-service@project-id.iam.gserviceaccount.com`)
- 권한을 "편집자"로 설정

#### 4. 스프레드시트 ID 확인
- Google Sheets URL에서 스프레드시트 ID 복사
- 예: `https://docs.google.com/spreadsheets/d/12pcRCN5bqqupjtVi06O3iW6VG8Q1Xr9qWV51ORUMyIA/edit`
- ID: `12pcRCN5bqqupjtVi06O3iW6VG8Q1Xr9qWV51ORUMyIA`

## 네이버 지도 API 설정 방법

1. [네이버 클라우드 플랫폼](https://www.ncloud.com/)에 접속
2. Maps > Application 등록
3. Client ID와 Client Secret을 `.env.local` 파일에 추가

## 현재 상태

- Firebase가 설정되지 않은 경우 더미 로그인으로 작동합니다
- 테스트 계정: `kim@example.com` / `1234`, `kwon@example.com` / `1234`
- 실제 Firebase 설정을 완료하면 더미 로그인이 비활성화됩니다
- 현재는 더미 모드로 작동하므로 Firebase 400 오류가 발생하지 않습니다

- Google Sheets가 설정되지 않은 경우 더미 데이터로 작동합니다
- 더미 데이터: 서울내과의원, 부산외과의원 (테스트용)
- 실제 Google Sheets 설정을 완료하면 더미 데이터가 비활성화됩니다

## 주의사항

- `.env.local` 파일은 `.gitignore`에 포함되어 있어 Git에 커밋되지 않습니다
- API 키는 절대 공개 저장소에 업로드하지 마세요
- 프로덕션 환경에서는 환경 변수를 서버에서 안전하게 관리하세요 