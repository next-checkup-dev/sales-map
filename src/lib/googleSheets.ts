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
  phone: string // 전화번호
  salesPerson: string // 영업담당자
  visitCount: number // 방문횟수
  firstVisitDate: string // 최초방문일자
  lastVisitDate: string // 최종방문일자
  response: string // 반응
  salesStage: string // 세일즈 단계
  nextStep: string // Next Step
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
  lat?: number // 위도 (지도용)
  lng?: number // 경도 (지도용)
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
      salesPerson: findColumnIndex(headers, ['영업담당자', '담당자', 'sales', 'person']) !== -1 ? findColumnIndex(headers, ['영업담당자', '담당자', 'sales', 'person']) : 6,
      visitCount: findColumnIndex(headers, ['방문횟수', '방문', 'visit', 'count']) !== -1 ? findColumnIndex(headers, ['방문횟수', '방문', 'visit', 'count']) : 7,
      firstVisitDate: findColumnIndex(headers, ['최초방문일자', '첫방문', 'first', 'visit']) !== -1 ? findColumnIndex(headers, ['최초방문일자', '첫방문', 'first', 'visit']) : 8,
      lastVisitDate: findColumnIndex(headers, ['최종방문일자', '마지막방문', 'last', 'visit']) !== -1 ? findColumnIndex(headers, ['최종방문일자', '마지막방문', 'last', 'visit']) : 9,
      response: findColumnIndex(headers, ['반응', 'response']) !== -1 ? findColumnIndex(headers, ['반응', 'response']) : 10,
      salesStage: findColumnIndex(headers, ['세일즈 단계', '단계', 'stage']) !== -1 ? findColumnIndex(headers, ['세일즈 단계', '단계', 'stage']) : 11,
      nextStep: findColumnIndex(headers, ['next step', '다음단계', 'next']) !== -1 ? findColumnIndex(headers, ['next step', '다음단계', 'next']) : 12,
      visit1: findColumnIndex(headers, ['1차 방문', '1차']) !== -1 ? findColumnIndex(headers, ['1차 방문', '1차']) : 13,
      visit1Content: findColumnIndex(headers, ['1차 방문 내용', '1차 내용']) !== -1 ? findColumnIndex(headers, ['1차 방문 내용', '1차 내용']) : 14,
      visit2: findColumnIndex(headers, ['2차 방문', '2차']) !== -1 ? findColumnIndex(headers, ['2차 방문', '2차']) : 15,
      visit2Content: findColumnIndex(headers, ['2차 방문 내용', '2차 내용']) !== -1 ? findColumnIndex(headers, ['2차 방문 내용', '2차 내용']) : 16,
      visit3: findColumnIndex(headers, ['3차 방문', '3차']) !== -1 ? findColumnIndex(headers, ['3차 방문', '3차']) : 17,
      visit3Content: findColumnIndex(headers, ['3차 방문 내용', '3차 내용']) !== -1 ? findColumnIndex(headers, ['3차 방문 내용', '3차 내용']) : 18,
      visit4: findColumnIndex(headers, ['4차 방문', '4차']) !== -1 ? findColumnIndex(headers, ['4차 방문', '4차']) : 19,
      visit4Content: findColumnIndex(headers, ['4차 방문 내용', '4차 내용']) !== -1 ? findColumnIndex(headers, ['4차 방문 내용', '4차 내용']) : 20,
      visit5: findColumnIndex(headers, ['5차 방문', '5차']) !== -1 ? findColumnIndex(headers, ['5차 방문', '5차']) : 21,
      visit5Content: findColumnIndex(headers, ['5차 방문 내용', '5차 내용']) !== -1 ? findColumnIndex(headers, ['5차 방문 내용', '5차 내용']) : 22,
      visit6: findColumnIndex(headers, ['6차 방문', '6차']) !== -1 ? findColumnIndex(headers, ['6차 방문', '6차']) : 23,
      visit6Content: findColumnIndex(headers, ['6차 방문 내용', '6차 내용']) !== -1 ? findColumnIndex(headers, ['6차 방문 내용', '6차 내용']) : 24,
      lastUpdate: findColumnIndex(headers, ['최종 업데이트', '업데이트', 'update']) !== -1 ? findColumnIndex(headers, ['최종 업데이트', '업데이트', 'update']) : 25,
    }
    
    console.log('헤더 매핑 결과:', headers)
    console.log('컬럼 매핑:', columnMap)
    
    // A2:Z 범위에서 데이터 읽기 (헤더 제외)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'A2:Z',
    })

    const rows = response.data.values || []
    
    return rows.map((row, index) => ({
      id: row[columnMap.id] || `hospital-${index + 1}`,
      department: row[columnMap.department] || '',
      hospitalName: row[columnMap.hospitalName] || '',
      clientCompany: row[columnMap.clientCompany] || '',
      address: row[columnMap.address] || '',
      phone: row[columnMap.phone] || '',
      salesPerson: row[columnMap.salesPerson] || '',
      visitCount: parseInt(row[columnMap.visitCount]) || 0,
      firstVisitDate: row[columnMap.firstVisitDate] || '',
      lastVisitDate: row[columnMap.lastVisitDate] || '',
      response: row[columnMap.response] || '',
      salesStage: row[columnMap.salesStage] || '',
      nextStep: row[columnMap.nextStep] || '',
      visit1: row[columnMap.visit1] || '',
      visit1Content: row[columnMap.visit1Content] || '',
      visit2: row[columnMap.visit2] || '',
      visit2Content: row[columnMap.visit2Content] || '',
      visit3: row[columnMap.visit3] || '',
      visit3Content: row[columnMap.visit3Content] || '',
      visit4: row[columnMap.visit4] || '',
      visit4Content: row[columnMap.visit4Content] || '',
      visit5: row[columnMap.visit5] || '',
      visit5Content: row[columnMap.visit5Content] || '',
      visit6: row[columnMap.visit6] || '',
      visit6Content: row[columnMap.visit6Content] || '',
      lastUpdate: row[columnMap.lastUpdate] || new Date().toISOString().split('T')[0],
    }))
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
        data.salesPerson,
        data.visitCount,
        data.firstVisitDate,
        data.lastVisitDate,
        data.response,
        data.salesStage,
        data.nextStep,
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
    
    // 먼저 해당 ID의 행을 찾기
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'A:A',
    })

    const rows = response.data.values || []
    const rowIndex = rows.findIndex(row => row[0] === data.id)
    
    if (rowIndex === -1) {
      console.error('해당 ID의 데이터를 찾을 수 없습니다:', data.id)
      return false
    }

    const values = [
      [
        data.id,
        data.department,
        data.hospitalName,
        data.clientCompany,
        data.address,
        data.phone,
        data.salesPerson,
        data.visitCount,
        data.firstVisitDate,
        data.lastVisitDate,
        data.response,
        data.salesStage,
        data.nextStep,
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
      ]
    ]

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `A${rowIndex + 1}:Z${rowIndex + 1}`,
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
    
    // 먼저 해당 ID의 행을 찾기
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'A:A',
    })

    const rows = response.data.values || []
    const rowIndex = rows.findIndex(row => row[0] === id)
    
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
                startIndex: rowIndex,
                endIndex: rowIndex + 1,
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