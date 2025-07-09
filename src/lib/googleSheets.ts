import { google } from 'googleapis'

// Google Sheets API 설정
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets']
const SPREADSHEET_ID = '12pcRCN5bqqupjtVi06O3iW6VG8Q1Xr9qWV51ORUMyIA'

// 스프레드시트 ID 검증 함수
function validateSpreadsheetId(id: string): boolean {
  // Google Sheets ID 형식: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
  const pattern = /^[a-zA-Z0-9-_]{44}$/
  return pattern.test(id)
}

// Google Sheets 접근 권한 확인 함수
async function checkSpreadsheetAccess(sheets: any): Promise<boolean> {
  try {
    console.log('스프레드시트 접근 권한 확인 중...')
    
    // 스프레드시트 메타데이터 조회로 접근 권한 확인
    const metadata = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
      ranges: [],
      includeGridData: false,
    })
    
    console.log('스프레드시트 접근 성공:', {
      title: metadata.data.properties?.title,
      sheets: metadata.data.sheets?.map((sheet: any) => sheet.properties?.title)
    })
    
    return true
  } catch (error) {
    console.error('스프레드시트 접근 실패:', error)
    return false
  }
}

// 더미 데이터 (Google Sheets가 작동하지 않을 때 사용)
const DUMMY_DATA: HospitalSalesData[] = [
  {
    id: 'hospital-1',
    department: '내과',
    hospitalName: '서울내과의원',
    clientCompany: 'A사',
    address: '서울시 강남구 테헤란로 123',
    phone: '02-1234-5678',
    fax: '02-1234-5679',
    directorName: '김원장',
    contactPerson: '이담당',
    contactPhone: '010-1234-5678',
    salesStage: '진행중',
    tendency: '적극적',
    nextStep: '계약서 검토',
    needs: '시스템 도입',
    visitCount: 3,
    progress: '70%',
    firstVisitDate: '2024-01-15',
    lastVisitDate: '2024-03-20',
    salesPerson: '김영업',
    visit1: '2024-01-15',
    visit1Content: '초기 상담',
    visit2: '2024-02-10',
    visit2Content: '시스템 시연',
    visit3: '2024-03-20',
    visit3Content: '계약 조건 협의',
    visit4: '',
    visit4Content: '',
    visit5: '',
    visit5Content: '',
    visit6: '',
    visit6Content: '',
    lastUpdate: '2024-03-20',
    lat: 37.5665,
    lng: 126.9780,
  },
  {
    id: 'hospital-2',
    department: '외과',
    hospitalName: '부산외과의원',
    clientCompany: 'B사',
    address: '부산시 해운대구 해운대로 456',
    phone: '051-9876-5432',
    fax: '051-9876-5433',
    directorName: '박원장',
    contactPerson: '최담당',
    contactPhone: '010-9876-5432',
    salesStage: '완료',
    tendency: '신중함',
    nextStep: '사후관리',
    needs: '운영 교육',
    visitCount: 5,
    progress: '100%',
    firstVisitDate: '2024-01-10',
    lastVisitDate: '2024-04-05',
    salesPerson: '권영업',
    visit1: '2024-01-10',
    visit1Content: '초기 상담',
    visit2: '2024-02-05',
    visit2Content: '요구사항 분석',
    visit3: '2024-03-01',
    visit3Content: '시스템 구축',
    visit4: '2024-03-20',
    visit4Content: '테스트 및 검수',
    visit5: '2024-04-05',
    visit5Content: '최종 인수인계',
    visit6: '',
    visit6Content: '',
    lastUpdate: '2024-04-05',
    lat: 35.1796,
    lng: 129.0756,
  }
]

// Google Sheets API 클라이언트 생성
function getGoogleSheetsClient() {
  const path = require('path')
  const fs = require('fs')
  const keyFilePath = path.join(process.cwd(), 'google-service-account-key.json')
  
  console.log('Google Sheets 키 파일 경로:', keyFilePath)
  
  // 환경 변수에서 키 파일 경로 확인
  const envKeyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS
  const finalKeyFile = envKeyFile || keyFilePath
  
  console.log('사용할 키 파일 경로:', finalKeyFile)
  
  // 키 파일 존재 여부 확인
  if (!fs.existsSync(finalKeyFile)) {
    throw new Error(`Google Sheets API 키 파일을 찾을 수 없습니다: ${finalKeyFile}`)
  }
  
  // 키 파일 내용 확인 (보안상 일부만)
  try {
    const keyContent = JSON.parse(fs.readFileSync(finalKeyFile, 'utf8'))
    console.log('키 파일 정보:', {
      type: keyContent.type,
      project_id: keyContent.project_id,
      client_email: keyContent.client_email,
      hasPrivateKey: !!keyContent.private_key
    })
  } catch (error) {
    console.error('키 파일 읽기 오류:', error)
    throw new Error('Google Sheets API 키 파일 형식이 올바르지 않습니다.')
  }
  
  const auth = new google.auth.GoogleAuth({
    scopes: SCOPES,
    keyFile: finalKeyFile,
  })

  return google.sheets({ version: 'v4', auth })
}

// 병원 영업 데이터 타입
export interface HospitalSalesData {
  id: string
  department: string // 진료과
  hospitalName: string // 의원명
  clientCompany: string // 수탁사
  address: string // 주소
  lat?: number // 위도
  lng?: number // 경도
  phone: string // 전화번호
  fax: string // 팩스
  directorName: string // 원장이름
  contactPerson: string // 담당자명
  contactPhone: string // 담당자 연락처
  salesStage: string // 세일즈 단계
  tendency: string // 성향
  nextStep: string // Next Step
  needs: string // 과제(니즈)
  visitCount: number // 방문횟수
  progress: string // 진행상황
  firstVisitDate: string // 최초방문일자
  lastVisitDate: string // 최종방문일자
  salesPerson: string // 영업담당자
  visit1: string // 1차 방문
  visit1Content: string // 1차 방문 내용
  visit2: string // 2차 방문
  visit2Content: string // 2차 방문 내용
  visit3: string // 3차 방문
  visit3Content: string // 3차 방문 내용
  visit4: string // 4차 방문
  visit4Content: string // 4차 방문 내용
  visit5: string // 5차 방문
  visit5Content: string // 5차 방문 내용
  visit6: string // 6차 방문
  visit6Content: string // 6차 방문 내용
  lastUpdate: string // 최종 업데이트
}

// 헤더 기반 컬럼 인덱스 찾기
function findColumnIndex(headers: string[], searchTerms: string[]): number {
  for (const term of searchTerms) {
    const index = headers.findIndex(header => 
      header.toLowerCase().includes(term.toLowerCase())
    )
    if (index !== -1) return index
  }
  return -1
}

// Google Sheets에서 데이터 읽기 (헤더 기반 동적 매핑)
export async function readHospitalSalesData(): Promise<HospitalSalesData[]> {
  try {
    console.log('Google Sheets 클라이언트 초기화 시작...')
    
    // 스프레드시트 ID 검증
    if (!validateSpreadsheetId(SPREADSHEET_ID)) {
      console.error('유효하지 않은 스프레드시트 ID:', SPREADSHEET_ID)
      throw new Error('유효하지 않은 스프레드시트 ID입니다.')
    }
    
    console.log('스프레드시트 ID 검증 완료:', SPREADSHEET_ID)
    
    // Google Sheets API 키 파일 존재 여부 확인
    const path = require('path')
    const keyFilePath = path.join(process.cwd(), 'google-service-account-key.json')
    const fs = require('fs')
    
    if (!fs.existsSync(keyFilePath)) {
      console.warn('Google Sheets API 키 파일이 없습니다. 더미 데이터를 사용합니다.')
      return DUMMY_DATA
    }
    
    const sheets = getGoogleSheetsClient()
    console.log('Google Sheets 클라이언트 초기화 완료')
    
    // 스프레드시트 접근 권한 확인
    const hasAccess = await checkSpreadsheetAccess(sheets)
    if (!hasAccess) {
      console.error('스프레드시트에 접근할 수 없습니다. 권한을 확인해주세요.')
      throw new Error('스프레드시트에 접근할 수 없습니다. 서비스 계정에 편집 권한을 부여해주세요.')
    }
    
    // 먼저 헤더 읽기
    console.log('Google Sheets 헤더 읽기 시작...')
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'A1:Z1',
    })
    const headers = headerResponse.data.values?.[0] || []
    console.log('Google Sheets 헤더 읽기 완료:', headers.length, '개 컬럼')
    
    // 헤더 기반으로 컬럼 인덱스 찾기
    const columnMap = {
      id: findColumnIndex(headers, ['id', '번호', '순번']) !== -1 ? findColumnIndex(headers, ['id', '번호', '순번']) : 0,
      department: findColumnIndex(headers, ['진료과', '과목', 'department']) !== -1 ? findColumnIndex(headers, ['진료과', '과목', 'department']) : 1,
      hospitalName: findColumnIndex(headers, ['의원명', '병원명', 'hospital', 'name']) !== -1 ? findColumnIndex(headers, ['의원명', '병원명', 'hospital', 'name']) : 2,
      clientCompany: findColumnIndex(headers, ['수탁사', '고객사', 'client', 'company']) !== -1 ? findColumnIndex(headers, ['수탁사', '고객사', 'client', 'company']) : 3,
      address: findColumnIndex(headers, ['주소', 'address']) !== -1 ? findColumnIndex(headers, ['주소', 'address']) : 4,
      phone: findColumnIndex(headers, ['전화번호', '연락처', 'phone', 'tel']) !== -1 ? findColumnIndex(headers, ['전화번호', '연락처', 'phone', 'tel']) : 5,
      fax: findColumnIndex(headers, ['팩스', 'fax']) !== -1 ? findColumnIndex(headers, ['팩스', 'fax']) : 6,
      directorName: findColumnIndex(headers, ['원장이름', '원장', 'director', 'name']) !== -1 ? findColumnIndex(headers, ['원장이름', '원장', 'director', 'name']) : 7,
      contactPerson: findColumnIndex(headers, ['담당자명', '담당자', 'contact', 'person']) !== -1 ? findColumnIndex(headers, ['담당자명', '담당자', 'contact', 'person']) : 8,
      contactPhone: findColumnIndex(headers, ['담당자 연락처', '담당자 전화번호', 'contact', 'phone']) !== -1 ? findColumnIndex(headers, ['담당자 연락처', '담당자 전화번호', 'contact', 'phone']) : 9,
      salesStage: findColumnIndex(headers, ['세일즈 단계', '단계', 'stage']) !== -1 ? findColumnIndex(headers, ['세일즈 단계', '단계', 'stage']) : 10,
      tendency: findColumnIndex(headers, ['성향', 'tendency']) !== -1 ? findColumnIndex(headers, ['성향', 'tendency']) : 11,
      nextStep: findColumnIndex(headers, ['next step', '다음단계', 'next']) !== -1 ? findColumnIndex(headers, ['next step', '다음단계', 'next']) : 12,
      needs: findColumnIndex(headers, ['과제(니즈)', 'needs']) !== -1 ? findColumnIndex(headers, ['과제(니즈)', 'needs']) : 13,
      visitCount: findColumnIndex(headers, ['방문횟수', '방문', 'visit', 'count']) !== -1 ? findColumnIndex(headers, ['방문횟수', '방문', 'visit', 'count']) : 14,
      progress: findColumnIndex(headers, ['진행상황', 'progress']) !== -1 ? findColumnIndex(headers, ['진행상황', 'progress']) : 15,
      firstVisitDate: findColumnIndex(headers, ['최초방문일자', '첫방문', 'first', 'visit']) !== -1 ? findColumnIndex(headers, ['최초방문일자', '첫방문', 'first', 'visit']) : 16,
      lastVisitDate: findColumnIndex(headers, ['최종방문일자', '마지막방문', 'last', 'visit']) !== -1 ? findColumnIndex(headers, ['최종방문일자', '마지막방문', 'last', 'visit']) : 17,
      salesPerson: findColumnIndex(headers, ['영업담당자', '담당자', 'sales', 'person']) !== -1 ? findColumnIndex(headers, ['영업담당자', '담당자', 'sales', 'person']) : 18,
      visit1: findColumnIndex(headers, ['1차 방문', '1차']) !== -1 ? findColumnIndex(headers, ['1차 방문', '1차']) : 19,
      visit1Content: findColumnIndex(headers, ['1차 방문 내용', '1차 내용']) !== -1 ? findColumnIndex(headers, ['1차 방문 내용', '1차 내용']) : 20,
      visit2: findColumnIndex(headers, ['2차 방문', '2차']) !== -1 ? findColumnIndex(headers, ['2차 방문', '2차']) : 21,
      visit2Content: findColumnIndex(headers, ['2차 방문 내용', '2차 내용']) !== -1 ? findColumnIndex(headers, ['2차 방문 내용', '2차 내용']) : 22,
      visit3: findColumnIndex(headers, ['3차 방문', '3차']) !== -1 ? findColumnIndex(headers, ['3차 방문', '3차']) : 23,
      visit3Content: findColumnIndex(headers, ['3차 방문 내용', '3차 내용']) !== -1 ? findColumnIndex(headers, ['3차 방문 내용', '3차 내용']) : 24,
      visit4: findColumnIndex(headers, ['4차 방문', '4차']) !== -1 ? findColumnIndex(headers, ['4차 방문', '4차']) : 25,
      visit4Content: findColumnIndex(headers, ['4차 방문 내용', '4차 내용']) !== -1 ? findColumnIndex(headers, ['4차 방문 내용', '4차 내용']) : 26,
      visit5: findColumnIndex(headers, ['5차 방문', '5차']) !== -1 ? findColumnIndex(headers, ['5차 방문', '5차']) : 27,
      visit5Content: findColumnIndex(headers, ['5차 방문 내용', '5차 내용']) !== -1 ? findColumnIndex(headers, ['5차 방문 내용', '5차 내용']) : 28,
      visit6: findColumnIndex(headers, ['6차 방문', '6차']) !== -1 ? findColumnIndex(headers, ['6차 방문', '6차']) : 29,
      visit6Content: findColumnIndex(headers, ['6차 방문 내용', '6차 내용']) !== -1 ? findColumnIndex(headers, ['6차 방문 내용', '6차 내용']) : 30,
      lastUpdate: findColumnIndex(headers, ['최종 업데이트', '업데이트', 'update']) !== -1 ? findColumnIndex(headers, ['최종 업데이트', '업데이트', 'update']) : 31,
      lat: findColumnIndex(headers, ['lat', '위도', 'latitude']) !== -1 ? findColumnIndex(headers, ['lat', '위도', 'latitude']) : 32,
      lng: findColumnIndex(headers, ['lng', '경도', 'longitude']) !== -1 ? findColumnIndex(headers, ['lng', '경도', 'longitude']) : 33,
    }
    
    console.log('=== 구글시트 헤더 정보 ===')
    console.log('실제 헤더:', headers)
    console.log('컬럼 매핑:', columnMap)
    console.log('========================')
    
    // A2:Z 범위에서 데이터 읽기 (헤더 제외)
    console.log('Google Sheets 데이터 읽기 시작...')
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'A2:Z',
    })

    const rows = response.data.values || []
    console.log('Google Sheets 데이터 읽기 완료:', rows.length, '개 행')
    
    console.log('데이터 변환 시작...')
    const result = rows.map((row, index) => {
      const visitData = {
        visit1: row[columnMap.visit1] || '',
        visit2: row[columnMap.visit2] || '',
        visit3: row[columnMap.visit3] || '',
        visit4: row[columnMap.visit4] || '',
        visit5: row[columnMap.visit5] || '',
        visit6: row[columnMap.visit6] || ''
      }
      
      const calculatedVisitInfo = calculateVisitInfo(visitData)
      
      return {
        id: row[columnMap.id] || `hospital-${index + 1}`,
        department: row[columnMap.department] || '',
        hospitalName: row[columnMap.hospitalName] || '',
        clientCompany: row[columnMap.clientCompany] || '',
        address: row[columnMap.address] || '',
        phone: row[columnMap.phone] || '',
        fax: row[columnMap.fax] || '',
        directorName: row[columnMap.directorName] || '',
        contactPerson: row[columnMap.contactPerson] || '',
        contactPhone: row[columnMap.contactPhone] || '',
        salesStage: row[columnMap.salesStage] || '',
        tendency: row[columnMap.tendency] || '',
        nextStep: row[columnMap.nextStep] || '',
        needs: row[columnMap.needs] || '',
        visitCount: calculatedVisitInfo.visitCount,
        progress: row[columnMap.progress] || '',
        firstVisitDate: calculatedVisitInfo.firstVisitDate,
        lastVisitDate: calculatedVisitInfo.lastVisitDate,
        salesPerson: row[columnMap.salesPerson] || '',
        visit1: visitData.visit1,
        visit1Content: row[columnMap.visit1Content] || '',
        visit2: visitData.visit2,
        visit2Content: row[columnMap.visit2Content] || '',
        visit3: visitData.visit3,
        visit3Content: row[columnMap.visit3Content] || '',
        visit4: visitData.visit4,
        visit4Content: row[columnMap.visit4Content] || '',
        visit5: visitData.visit5,
        visit5Content: row[columnMap.visit5Content] || '',
        visit6: visitData.visit6,
        visit6Content: row[columnMap.visit6Content] || '',
        lastUpdate: row[columnMap.lastUpdate] || new Date().toISOString().split('T')[0],
        lat: row[columnMap.lat] ? parseFloat(row[columnMap.lat]) : undefined,
        lng: row[columnMap.lng] ? parseFloat(row[columnMap.lng]) : undefined,
      }
    })
    
    console.log('데이터 변환 완료:', result.length, '개 항목')
    return result
  } catch (error) {
    console.error('Google Sheets 데이터 읽기 오류:', error)
    console.error('오류 상세:', {
      message: error instanceof Error ? error.message : '알 수 없는 오류',
      stack: error instanceof Error ? error.stack : undefined
    })
    console.warn('Google Sheets 연결 실패로 더미 데이터를 사용합니다.')
    return DUMMY_DATA
  }
}

// Google Sheets에 데이터 쓰기
export async function writeHospitalSalesData(data: HospitalSalesData): Promise<boolean> {
  try {
    const sheets = getGoogleSheetsClient()
    
    const values = [
      [
        data.id,
        data.department,
        data.hospitalName,
        data.clientCompany,
        data.address,
        data.phone,
        data.fax,
        data.directorName,
        data.contactPerson,
        data.contactPhone,
        data.salesStage,
        data.tendency,
        data.nextStep,
        data.needs,
        data.visitCount,
        data.progress,
        data.firstVisitDate,
        data.lastVisitDate,
        data.salesPerson,
        data.visit1,
        data.visit1Content,
        data.visit2,
        data.visit2Content,
        data.visit3,
        data.visit3Content,
        data.visit4,
        data.visit4Content,
        data.visit5,
        data.visit5Content,
        data.visit6,
        data.visit6Content,
        data.lastUpdate,
        data.lat || '',
        data.lng || '',
      ]
    ]

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'A:Z',
      valueInputOption: 'RAW',
      requestBody: {
        values,
      },
    })

    return true
  } catch (error) {
    console.error('Google Sheets 데이터 쓰기 오류:', error)
    return false
  }
}

// Google Sheets에서 특정 행 업데이트
export async function updateHospitalSalesData(data: HospitalSalesData): Promise<boolean> {
  try {
    console.log('Google Sheets 업데이트 시작...')
    console.log('업데이트할 데이터 ID:', data.id)
    console.log('업데이트할 데이터 병원명:', data.hospitalName)
    console.log('업데이트할 데이터 전화번호:', data.phone)
    
    // Google Sheets API 키 파일 존재 여부 확인
    const path = require('path')
    const keyFilePath = path.join(process.cwd(), 'google-service-account-key.json')
    const fs = require('fs')
    
    if (!fs.existsSync(keyFilePath)) {
      console.warn('Google Sheets API 키 파일이 없습니다. 더미 모드로 업데이트를 시뮬레이션합니다.')
      // 더미 데이터에서 해당 항목 찾아서 업데이트 시뮬레이션
      const dummyIndex = DUMMY_DATA.findIndex(item => 
        item.id === data.id || 
        (item.hospitalName === data.hospitalName && item.phone === data.phone)
      )
      
      if (dummyIndex !== -1) {
        console.log('더미 데이터에서 해당 항목을 찾았습니다. 업데이트를 시뮬레이션합니다.')
        return true
      } else {
        console.error('더미 데이터에서 해당 항목을 찾을 수 없습니다.')
        return false
      }
    }
    
    const sheets = getGoogleSheetsClient()
    
    // 방문일자와 방문횟수 자동 계산
    const visitData = {
      visit1: data.visit1,
      visit2: data.visit2,
      visit3: data.visit3,
      visit4: data.visit4,
      visit5: data.visit5,
      visit6: data.visit6
    }
    const calculatedVisitInfo = calculateVisitInfo(visitData)
    
    // 업데이트할 데이터 준비 (계산된 값 사용)
    const updatedData = {
      ...data,
      visitCount: calculatedVisitInfo.visitCount,
      firstVisitDate: calculatedVisitInfo.firstVisitDate,
      lastVisitDate: calculatedVisitInfo.lastVisitDate,
      lastUpdate: new Date().toISOString().split('T')[0]
    }
    
    // 먼저 헤더 정보 가져오기
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'A1:Z1',
    })
    const headers = headerResponse.data.values?.[0] || []
    
    // 헤더 기반으로 컬럼 인덱스 찾기
    const columnMap = {
      id: findColumnIndex(headers, ['id', '번호', '순번']) !== -1 ? findColumnIndex(headers, ['id', '번호', '순번']) : 0,
      hospitalName: findColumnIndex(headers, ['의원명', '병원명', 'hospital', 'name']) !== -1 ? findColumnIndex(headers, ['의원명', '병원명', 'hospital', 'name']) : 2,
      phone: findColumnIndex(headers, ['전화번호', '연락처', 'phone', 'tel']) !== -1 ? findColumnIndex(headers, ['전화번호', '연락처', 'phone', 'tel']) : 5,
    }
    
    // 전체 데이터 읽기 (헤더 제외)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'A2:Z',
    })

    const rows = response.data.values || []
    
    // 병원명과 전화번호로 행 찾기 (더 안정적인 매칭)
    let rowIndex = -1
    
    console.log('데이터 찾기 시도:', {
      id: data.id,
      hospitalName: data.hospitalName,
      phone: data.phone,
      totalRows: rows.length
    })
    
    // 1. ID로 먼저 찾기
    if (data.id) {
      rowIndex = rows.findIndex(row => row[columnMap.id] === data.id)
      console.log('ID로 찾기 결과:', rowIndex)
    }
    
    // 2. ID로 못 찾으면 병원명과 전화번호로 찾기
    if (rowIndex === -1 && data.hospitalName && data.phone) {
      rowIndex = rows.findIndex(row => 
        row[columnMap.hospitalName] === data.hospitalName && 
        row[columnMap.phone] === data.phone
      )
      console.log('병원명+전화번호로 찾기 결과:', rowIndex)
    }
    
    // 3. 그래도 못 찾으면 병원명만으로 찾기
    if (rowIndex === -1 && data.hospitalName) {
      rowIndex = rows.findIndex(row => row[columnMap.hospitalName] === data.hospitalName)
      console.log('병원명만으로 찾기 결과:', rowIndex)
    }
    
    if (rowIndex === -1) {
      console.error('해당 병원 데이터를 찾을 수 없습니다:', {
        id: data.id,
        hospitalName: data.hospitalName,
        phone: data.phone,
        totalRows: rows.length,
        availableHospitals: rows.slice(0, 10).map((row, idx) => ({
          index: idx,
          id: row[columnMap.id],
          hospitalName: row[columnMap.hospitalName],
          phone: row[columnMap.phone]
        }))
      })
      throw new Error(`병원 데이터를 찾을 수 없습니다. ID: ${data.id}, 병원명: ${data.hospitalName}`)
    }

    // 기존 행 데이터 가져오기
    const existingRow = rows[rowIndex]
    
    // 방문 정보 자동 계산
    const updatedVisitData = {
      visit1: updatedData.visit1 || existingRow[findColumnIndex(headers, ['1차 방문', 'visit1'])] || '',
      visit2: updatedData.visit2 || existingRow[findColumnIndex(headers, ['2차 방문', 'visit2'])] || '',
      visit3: updatedData.visit3 || existingRow[findColumnIndex(headers, ['3차 방문', 'visit3'])] || '',
      visit4: updatedData.visit4 || existingRow[findColumnIndex(headers, ['4차 방문', 'visit4'])] || '',
      visit5: updatedData.visit5 || existingRow[findColumnIndex(headers, ['5차 방문', 'visit5'])] || '',
      visit6: updatedData.visit6 || existingRow[findColumnIndex(headers, ['6차 방문', 'visit6'])] || ''
    }
    
    const updatedCalculatedVisitInfo = calculateVisitInfo(updatedVisitData)

    // 기존 데이터와 새 데이터를 병합 (빈 값이 아닌 경우에만 업데이트)
    const mergedData = {
      id: updatedData.id || existingRow[columnMap.id] || '',
      department: updatedData.department || existingRow[findColumnIndex(headers, ['진료과', 'department'])] || '',
      hospitalName: updatedData.hospitalName || existingRow[columnMap.hospitalName] || '',
      clientCompany: updatedData.clientCompany || existingRow[findColumnIndex(headers, ['수탁사', 'clientCompany'])] || '',
      address: updatedData.address || existingRow[findColumnIndex(headers, ['주소', 'address'])] || '',
      phone: updatedData.phone || existingRow[columnMap.phone] || '',
      fax: updatedData.fax || existingRow[findColumnIndex(headers, ['팩스', 'fax'])] || '',
      directorName: updatedData.directorName || existingRow[findColumnIndex(headers, ['원장이름', 'directorName'])] || '',
      contactPerson: updatedData.contactPerson || existingRow[findColumnIndex(headers, ['담당자명', 'contactPerson'])] || '',
      contactPhone: updatedData.contactPhone || existingRow[findColumnIndex(headers, ['담당자 연락처', 'contactPhone'])] || '',
      salesStage: updatedData.salesStage || existingRow[findColumnIndex(headers, ['세일즈 단계', 'salesStage'])] || '',
      tendency: updatedData.tendency || existingRow[findColumnIndex(headers, ['성향', 'tendency'])] || '',
      nextStep: updatedData.nextStep || existingRow[findColumnIndex(headers, ['Next Step', 'nextStep'])] || '',
      needs: updatedData.needs || existingRow[findColumnIndex(headers, ['과제', '니즈', 'needs'])] || '',
      visitCount: updatedCalculatedVisitInfo.visitCount,
      progress: updatedData.progress || existingRow[findColumnIndex(headers, ['진행상황', 'progress'])] || '',
      firstVisitDate: updatedCalculatedVisitInfo.firstVisitDate,
      lastVisitDate: updatedCalculatedVisitInfo.lastVisitDate,
      salesPerson: updatedData.salesPerson || existingRow[findColumnIndex(headers, ['영업담당자', 'salesPerson'])] || '',
      visit1: updatedVisitData.visit1,
      visit1Content: updatedData.visit1Content || existingRow[findColumnIndex(headers, ['1차 방문 내용', 'visit1Content'])] || '',
      visit2: updatedVisitData.visit2,
      visit2Content: updatedData.visit2Content || existingRow[findColumnIndex(headers, ['2차 방문 내용', 'visit2Content'])] || '',
      visit3: updatedVisitData.visit3,
      visit3Content: updatedData.visit3Content || existingRow[findColumnIndex(headers, ['3차 방문 내용', 'visit3Content'])] || '',
      visit4: updatedVisitData.visit4,
      visit4Content: updatedData.visit4Content || existingRow[findColumnIndex(headers, ['4차 방문 내용', 'visit4Content'])] || '',
      visit5: updatedVisitData.visit5,
      visit5Content: updatedData.visit5Content || existingRow[findColumnIndex(headers, ['5차 방문 내용', 'visit5Content'])] || '',
      visit6: updatedVisitData.visit6,
      visit6Content: updatedData.visit6Content || existingRow[findColumnIndex(headers, ['6차 방문 내용', 'visit6Content'])] || '',
      lastUpdate: updatedData.lastUpdate,
      lat: updatedData.lat || (existingRow[findColumnIndex(headers, ['위도', 'lat'])] ? parseFloat(existingRow[findColumnIndex(headers, ['위도', 'lat'])]) : undefined),
      lng: updatedData.lng || (existingRow[findColumnIndex(headers, ['경도', 'lng'])] ? parseFloat(existingRow[findColumnIndex(headers, ['경도', 'lng'])]) : undefined),
    }

    const values = [
      [
        mergedData.id,
        mergedData.department,
        mergedData.hospitalName,
        mergedData.clientCompany,
        mergedData.address,
        mergedData.phone,
        mergedData.fax,
        mergedData.directorName,
        mergedData.contactPerson,
        mergedData.contactPhone,
        mergedData.salesStage,
        mergedData.tendency,
        mergedData.nextStep,
        mergedData.needs,
        mergedData.visitCount,
        mergedData.progress,
        mergedData.firstVisitDate,
        mergedData.lastVisitDate,
        mergedData.salesPerson,
        mergedData.visit1,
        mergedData.visit1Content,
        mergedData.visit2,
        mergedData.visit2Content,
        mergedData.visit3,
        mergedData.visit3Content,
        mergedData.visit4,
        mergedData.visit4Content,
        mergedData.visit5,
        mergedData.visit5Content,
        mergedData.visit6,
        mergedData.visit6Content,
        mergedData.lastUpdate,
        mergedData.lat || '',
        mergedData.lng || '',
      ]
    ]

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `A${rowIndex + 2}:AB${rowIndex + 2}`, // 헤더 제외하므로 +2
      valueInputOption: 'RAW',
      requestBody: {
        values,
      },
    })

    return true
  } catch (error) {
    console.error('Google Sheets 데이터 업데이트 오류:', error)
    console.error('업데이트 시도한 데이터:', data)
    console.error('오류 상세:', {
      message: error instanceof Error ? error.message : '알 수 없는 오류',
      stack: error instanceof Error ? error.stack : undefined
    })
    return false
  }
}

// Google Sheets에서 데이터 삭제
export async function deleteSalesPersonData(id: string): Promise<boolean> {
  try {
    const sheets = getGoogleSheetsClient()
    
    // 먼저 헤더 정보 가져오기
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'A1:Z1',
    })
    const headers = headerResponse.data.values?.[0] || []
    
    // 헤더 기반으로 컬럼 인덱스 찾기
    const columnMap = {
      id: findColumnIndex(headers, ['id', '번호', '순번']) !== -1 ? findColumnIndex(headers, ['id', '번호', '순번']) : 0,
    }
    
    // 전체 데이터 읽기 (헤더 제외)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'A2:Z',
    })

    const rows = response.data.values || []
    const rowIndex = rows.findIndex(row => row[columnMap.id] === id)
    
    if (rowIndex === -1) {
      console.error('해당 ID의 데이터를 찾을 수 없습니다:', id)
      return false
    }

    // 행 삭제
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: 0, // 첫 번째 시트
                dimension: 'ROWS',
                startIndex: rowIndex + 1, // 헤더 제외하므로 +1
                endIndex: rowIndex + 2,
              },
            },
          },
        ],
      },
    })

    return true
  } catch (error) {
    console.error('Google Sheets 데이터 삭제 오류:', error)
    return false
  }
}

// 방문일자와 방문횟수를 자동 계산하는 함수
function calculateVisitInfo(data: {
  visit1: string
  visit2: string
  visit3: string
  visit4: string
  visit5: string
  visit6: string
}): {
  visitCount: number
  firstVisitDate: string
  lastVisitDate: string
} {
  const visits = [
    data.visit1,
    data.visit2,
    data.visit3,
    data.visit4,
    data.visit5,
    data.visit6
  ].filter(visit => visit && visit.trim() !== '')

  const visitCount = visits.length
  const firstVisitDate = visits.length > 0 ? visits[0] : ''
  const lastVisitDate = visits.length > 0 ? visits[visits.length - 1] : ''

  return {
    visitCount,
    firstVisitDate,
    lastVisitDate
  }
}

// 과제 니즈와 진행상황 추천 함수
export async function getRecommendations(field: 'needs' | 'progress', currentValue: string): Promise<string[]> {
  try {
    const allData = await readHospitalSalesData()
    const values = allData
      .map(item => item[field])
      .filter(value => value && value.trim() !== '' && value !== currentValue)
    
    // 유사한 내용 찾기 (간단한 키워드 매칭)
    const recommendations = values.filter(value => {
      const currentWords = currentValue.toLowerCase().split(/\s+/)
      const valueWords = value.toLowerCase().split(/\s+/)
      
      // 공통 단어가 있으면 추천
      return currentWords.some(word => 
        word.length > 2 && valueWords.some(vWord => vWord.includes(word) || word.includes(vWord))
      )
    })
    
    // 중복 제거하고 최대 5개 반환
    return [...new Set(recommendations)].slice(0, 5)
  } catch (error) {
    console.error('추천 데이터 조회 실패:', error)
    return []
  }
} 