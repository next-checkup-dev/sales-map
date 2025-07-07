import { google } from 'googleapis'

// Google Sheets API 설정
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets']
const SPREADSHEET_ID = '12pcRCN5bqqupjtVi06O3iW6VG8Q1Xr9qWV51ORUMyIA'

// Google Sheets API 클라이언트 생성
function getGoogleSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    scopes: SCOPES,
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS, // 서비스 계정 키 파일 경로
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
    const sheets = getGoogleSheetsClient()
    
    // 먼저 헤더 읽기
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'A1:Z1',
    })
    const headers = headerResponse.data.values?.[0] || []
    
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
    
    console.log('헤더 매핑 결과:', headers)
    console.log('컬럼 매핑:', columnMap)
    
    // A2:Z 범위에서 데이터 읽기 (헤더 제외)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'A2:Z',
    })

    const rows = response.data.values || []
    
    return rows.map((row, index) => {
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
  } catch (error) {
    console.error('Google Sheets 데이터 읽기 오류:', error)
    return []
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
    
    // 1. ID로 먼저 찾기
    rowIndex = rows.findIndex(row => row[columnMap.id] === data.id)
    
    // 2. ID로 못 찾으면 병원명과 전화번호로 찾기
    if (rowIndex === -1) {
      rowIndex = rows.findIndex(row => 
        row[columnMap.hospitalName] === data.hospitalName && 
        row[columnMap.phone] === data.phone
      )
    }
    
    // 3. 그래도 못 찾으면 병원명만으로 찾기
    if (rowIndex === -1) {
      rowIndex = rows.findIndex(row => row[columnMap.hospitalName] === data.hospitalName)
    }
    
    if (rowIndex === -1) {
      console.error('해당 병원 데이터를 찾을 수 없습니다:', {
        id: data.id,
        hospitalName: data.hospitalName,
        phone: data.phone
      })
      return false
    }

    const values = [
      [
        updatedData.id,
        updatedData.department,
        updatedData.hospitalName,
        updatedData.clientCompany,
        updatedData.address,
        updatedData.phone,
        updatedData.fax,
        updatedData.directorName,
        updatedData.contactPerson,
        updatedData.contactPhone,
        updatedData.salesStage,
        updatedData.tendency,
        updatedData.nextStep,
        updatedData.needs,
        updatedData.visitCount,
        updatedData.progress,
        updatedData.firstVisitDate,
        updatedData.lastVisitDate,
        updatedData.salesPerson,
        updatedData.visit1,
        updatedData.visit1Content,
        updatedData.visit2,
        updatedData.visit2Content,
        updatedData.visit3,
        updatedData.visit3Content,
        updatedData.visit4,
        updatedData.visit4Content,
        updatedData.visit5,
        updatedData.visit5Content,
        updatedData.visit6,
        updatedData.visit6Content,
        updatedData.lastUpdate,
        updatedData.lat || '',
        updatedData.lng || '',
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