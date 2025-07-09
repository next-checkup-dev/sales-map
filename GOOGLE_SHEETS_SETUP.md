# Google Sheets 설정 완료 가이드

## 현재 상황

Google Sheets API 키 파일은 있지만, Google Sheets 문서에 서비스 계정 이메일이 추가되지 않아서 접근할 수 없는 상태입니다.

## 해결 방법

### 1. 서비스 계정 이메일 확인

현재 서비스 계정 이메일: `dev-773@rich-window-465113-k7.iam.gserviceaccount.com`

### 2. Google Sheets 문서에 권한 추가

1. **Google Sheets 문서 열기**
   - 스프레드시트 ID: `12pcRCN5bqqupjtVi06O3iW6VG8Q1Xr9qWV51ORUMyIA`
   - URL: `https://docs.google.com/spreadsheets/d/12pcRCN5bqqupjtVi06O3iW6VG8Q1Xr9qWV51ORUMyIA/edit`

2. **공유 설정**
   - 우상단 "공유" 버튼 클릭
   - "사용자 및 그룹 추가" 필드에 다음 이메일 입력:
     ```
     dev-773@rich-window-465113-k7.iam.gserviceaccount.com
     ```
   - 권한을 "편집자"로 설정
   - "완료" 클릭

### 3. 연결 테스트

권한 설정 후 다음 URL로 연결을 테스트할 수 있습니다:
```
http://localhost:3000/api/sheets-test
```

### 4. 예상 결과

성공 시 다음과 같은 응답을 받을 수 있습니다:
```json
{
  "success": true,
  "message": "Google Sheets 연결이 성공했습니다!",
  "data": {
    "spreadsheetTitle": "병원 영업 데이터",
    "spreadsheetId": "12pcRCN5bqqupjtVi06O3iW6VG8Q1Xr9qWV51ORUMyIA",
    "clientEmail": "dev-773@rich-window-465113-k7.iam.gserviceaccount.com",
    "sheets": [...]
  }
}
```

## 문제 해결

### 권한 오류가 발생하는 경우

1. **서비스 계정 이메일 확인**
   - `google-service-account-key.json` 파일에서 `client_email` 필드 확인
   - 정확한 이메일 주소를 Google Sheets에 추가

2. **Google Cloud Console 확인**
   - [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트 확인
   - Google Sheets API가 활성화되어 있는지 확인

3. **스프레드시트 ID 확인**
   - Google Sheets URL에서 올바른 스프레드시트 ID 사용
   - 현재 ID: `12pcRCN5bqqupjtVi06O3iW6VG8Q1Xr9qWV51ORUMyIA`

## 설정 완료 후

권한 설정이 완료되면:
- 병원 영업 데이터 읽기/쓰기가 정상적으로 작동합니다
- 더미 모드가 비활성화되고 실제 Google Sheets 데이터를 사용합니다
- 업데이트 기능이 정상적으로 작동합니다

## 참고사항

- 서비스 계정은 Google Sheets 문서에 실제 사용자처럼 접근합니다
- 서비스 계정 이메일은 일반 Gmail 주소와 다르게 생겼습니다
- 권한 설정 후 즉시 반영되므로 별도의 대기 시간이 필요하지 않습니다