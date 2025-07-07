# 네이버 지도 API v3 설정 가이드

## 🚨 중요 공지

**기존 AI NAVER API의 지도 서비스가 점진적으로 종료되어 새로운 Maps API v3로 전환되었습니다.**

기존 클라이언트 ID `zdfpu9twx9`는 더 이상 사용할 수 없습니다.

## 📋 새로운 Maps API v3 설정 방법

### 1. 네이버 클라우드 플랫폼 접속

1. [네이버 클라우드 플랫폼](https://www.ncloud.com/)에 로그인
2. **AI·NAVER API** 메뉴로 이동

### 2. Maps JavaScript API 신청

1. **Maps** 카테고리에서 **Maps JavaScript API** 선택
2. **신청하기** 버튼 클릭
3. 서비스 약관 동의 후 신청 완료

### 3. 애플리케이션 등록

1. **AI·NAVER API** → **Maps** → **Maps JavaScript API** 대시보드로 이동
2. **애플리케이션 등록** 버튼 클릭
3. 다음 정보 입력:
   - **애플리케이션 이름**: `Sales Map App` (또는 원하는 이름)
   - **서비스 환경**: `Web` 선택
   - **웹 서비스 URL**: 다음 URL들을 추가
     - `http://localhost:3000`
     - `http://127.0.0.1:3000`
     - 배포 도메인 (예: `https://your-app.web.app`)

### 4. 클라이언트 ID 확인

1. 애플리케이션 등록 완료 후 **Client ID** 확인
2. 이 ID를 복사하여 환경변수에 설정

### 5. 환경변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용 추가:

```env
# 네이버 지도 API v3 키 (새로운 ncpKeyId 사용)
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=your_new_client_id_here
NEXT_PUBLIC_NAVER_MAP_CLIENT_SECRET=your_new_client_secret_here
```

### 6. 개발 서버 재시작

```bash
npm run dev
```

## 🔧 API 엔드포인트 변경사항

### 기존 (종료됨)
```
https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=YOUR_CLIENT_ID
```

### 신규 (API v3)
```
https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=YOUR_CLIENT_ID
```

## 🗺️ 동적 지도 API 특징

새로운 네이버 지도 API v3는 다음과 같은 특징을 가집니다:

- **동적 지도**: 실시간으로 상호작용 가능한 지도
- **마커 및 오버레이**: 병원 위치를 시각적으로 표시
- **인포윈도우**: 병원 정보를 팝업으로 표시
- **이벤트 처리**: 클릭, 줌 등의 사용자 상호작용
- **컨트롤**: 줌 컨트롤, 지도 타입 컨트롤 등

## 🚨 문제 해결

### 인증 실패 오류

**오류 메시지**: "네이버 지도 Open API 인증이 실패하였습니다. 클라이언트 아이디와 웹 서비스 URL을 확인해 주세요."

**확인 사항**:
1. ✅ 새로운 Maps JavaScript API 클라이언트 ID를 발급받았는가?
2. ✅ 웹 서비스 URL에 `http://localhost:3000`이 등록되어 있는가?
3. ✅ 환경변수 `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID`가 올바르게 설정되었는가?
4. ✅ 개발 서버를 재시작했는가?

### 웹 서비스 URL 등록 확인

네이버 클라우드 플랫폼에서:
1. **AI·NAVER API** → **Maps** → **Maps JavaScript API** → **애플리케이션**
2. 등록된 애플리케이션 선택
3. **웹 서비스 URL** 섹션에서 다음 URL들이 등록되어 있는지 확인:
   - `http://localhost:3000`
   - `http://127.0.0.1:3000`

## 📚 참고 자료

- [네이버 지도 API v3 공식 문서](https://navermaps.github.io/maps.js.ncp/docs/tutorial-2-Getting-Started.html)
- [API 전환 안내 공지](https://www.ncloud.com/support/notice/all/1930)
- [신규 Maps API 가이드](https://navermaps.github.io/maps.js.ncp/)

## 💡 팁

- 개발 환경과 프로덕션 환경에서 각각 다른 웹 서비스 URL을 등록할 수 있습니다.
- 클라이언트 ID는 공개되어도 안전하지만, 클라이언트 시크릿은 절대 공개하지 마세요.
- API 사용량과 제한사항은 네이버 클라우드 플랫폼 대시보드에서 확인할 수 있습니다.
- 새로운 API v3는 더 나은 성능과 안정성을 제공합니다. 