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
}

// Google Sheets에서 데이터 읽기
export async function readHospitalSalesData(): Promise<HospitalSalesData[]> {
  try {
    const sheets = getGoogleSheetsClient()
    
    // A2:Z 범위에서 데이터 읽기 (헤더 제외)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'A2:Z',
    })

    const rows = response.data.values || []
    
    return rows.map((row, index) => ({
      id: row[0] || `hospital-${index + 1}`,
      department: row[1] || '',
      hospitalName: row[2] || '',
      clientCompany: row[3] || '',
      address: row[4] || '',
      phone: row[5] || '',
      salesPerson: row[6] || '',
      visitCount: parseInt(row[7]) || 0,
      firstVisitDate: row[8] || '',
      lastVisitDate: row[9] || '',
      response: row[10] || '',
      salesStage: row[11] || '',
      nextStep: row[12] || '',
      visit1: row[13] || '',
      visit1Content: row[14] || '',
      visit2: row[15] || '',
      visit2Content: row[16] || '',
      visit3: row[17] || '',
      visit3Content: row[18] || '',
      visit4: row[19] || '',
      visit4Content: row[20] || '',
      visit5: row[21] || '',
      visit5Content: row[22] || '',
      visit6: row[23] || '',
      visit6Content: row[24] || '',
      lastUpdate: row[25] || new Date().toISOString().split('T')[0],
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