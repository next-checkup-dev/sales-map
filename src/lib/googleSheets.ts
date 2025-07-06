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

// 영업사원 데이터 타입
export interface SalesPersonData {
  id: string
  name: string
  email: string
  position: string
  status: '활성' | '비활성'
  location: string
  lastUpdate: string
  phone: string
  latitude?: number
  longitude?: number
}

// Google Sheets에서 데이터 읽기
export async function readSalesPeopleData(): Promise<SalesPersonData[]> {
  try {
    const sheets = getGoogleSheetsClient()
    
    // A2:J 범위에서 데이터 읽기 (헤더 제외)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'A2:J',
    })

    const rows = response.data.values || []
    
    return rows.map((row, index) => ({
      id: row[0] || `user-${index + 1}`,
      name: row[1] || '',
      email: row[2] || '',
      position: row[3] || '',
      status: (row[4] as '활성' | '비활성') || '활성',
      location: row[5] || '',
      lastUpdate: row[6] || new Date().toISOString().split('T')[0],
      phone: row[7] || '',
      latitude: parseFloat(row[8]) || undefined,
      longitude: parseFloat(row[9]) || undefined,
    }))
  } catch (error) {
    console.error('Google Sheets 데이터 읽기 오류:', error)
    return []
  }
}

// Google Sheets에 데이터 쓰기
export async function writeSalesPersonData(data: SalesPersonData): Promise<boolean> {
  try {
    const sheets = getGoogleSheetsClient()
    
    const values = [
      [
        data.id,
        data.name,
        data.email,
        data.position,
        data.status,
        data.location,
        data.lastUpdate,
        data.phone,
        data.latitude || '',
        data.longitude || '',
      ]
    ]

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'A:I',
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
export async function updateSalesPersonData(data: SalesPersonData): Promise<boolean> {
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
        data.name,
        data.email,
        data.position,
        data.status,
        data.location,
        data.lastUpdate,
        data.phone,
        data.latitude || '',
        data.longitude || '',
      ]
    ]

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `A${rowIndex + 1}:I${rowIndex + 1}`,
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