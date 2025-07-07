import { NextResponse } from 'next/server'
import { readHospitalSalesData, type HospitalSalesData } from '@/lib/googleSheets'
import { google } from 'googleapis'

// Google Sheets API 설정
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets']
const SPREADSHEET_ID = '12pcRCN5bqqupjtVi06O3iW6VG8Q1Xr9qWV51ORUMyIA'

// Google Sheets API 클라이언트 생성
function getGoogleSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    scopes: SCOPES,
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  })

  return google.sheets({ version: 'v4', auth })
}

export const dynamic = 'force-dynamic'

// Google Sheets 연동 테스트
export async function GET() {
  try {
    const startTime = Date.now()
    
    // 헤더 정보 가져오기
    const sheets = getGoogleSheetsClient()
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'A1:Z1',
    })
    const headers = headerResponse.data.values?.[0] || []
    
    // 데이터 읽기 테스트
    const data = await readHospitalSalesData()
    const endTime = Date.now()
    const responseTime = endTime - startTime

    // 데이터 검증
    const validationResults = {
      hasData: data.length > 0,
      validRecords: 0,
      invalidRecords: 0,
      missingFields: [] as string[],
      dataQuality: {
        hasDepartment: 0,
        hasHospitalName: 0,
        hasClientCompany: 0,
        hasAddress: 0,
        hasPhone: 0,
        hasSalesPerson: 0,
        hasVisitCount: 0,
        hasSalesStage: 0
      }
    }

    // 각 레코드 검증
    data.forEach((record: HospitalSalesData) => {
      let isValid = true
      
      // 필수 필드 확인
      if (!record.department || record.department.trim() === '') {
        validationResults.missingFields.push('진료과')
        isValid = false
      } else {
        validationResults.dataQuality.hasDepartment++
      }
      
      if (!record.hospitalName || record.hospitalName.trim() === '') {
        validationResults.missingFields.push('의원명')
        isValid = false
      } else {
        validationResults.dataQuality.hasHospitalName++
      }
      
      if (!record.clientCompany || record.clientCompany.trim() === '') {
        validationResults.missingFields.push('수탁사')
        isValid = false
      } else {
        validationResults.dataQuality.hasClientCompany++
      }
      
      if (!record.address || record.address.trim() === '') {
        validationResults.missingFields.push('주소')
        isValid = false
      } else {
        validationResults.dataQuality.hasAddress++
      }
      
      if (!record.phone || record.phone.trim() === '') {
        validationResults.missingFields.push('전화번호')
        isValid = false
      } else {
        validationResults.dataQuality.hasPhone++
      }
      
      if (!record.salesPerson || record.salesPerson.trim() === '') {
        validationResults.missingFields.push('영업담당자')
        isValid = false
      } else {
        validationResults.dataQuality.hasSalesPerson++
      }
      
      // 방문 횟수 확인
      if (record.visitCount > 0) {
        validationResults.dataQuality.hasVisitCount++
      }
      
      // 세일즈 단계 확인
      if (record.salesStage && record.salesStage.trim() !== '') {
        validationResults.dataQuality.hasSalesStage++
      }
      
      if (isValid) {
        validationResults.validRecords++
      } else {
        validationResults.invalidRecords++
      }
    })

    // 중복 제거
    validationResults.missingFields = [...new Set(validationResults.missingFields)]

    return NextResponse.json({
      success: true,
      message: 'Google Sheets 연동이 정상적으로 작동합니다.',
      data: {
        totalRecords: data.length,
        responseTime: `${responseTime}ms`,
        headers: headers, // 헤더 정보 추가
        sampleData: data.slice(0, 5), // 처음 5개 레코드만 샘플로 반환
        connectionStatus: 'connected',
        timestamp: new Date().toISOString(),
        validation: validationResults,
        dataSummary: {
          totalFields: data.length * 8, // ID, 진료과, 의원명, 수탁사, 주소, 전화번호, 영업담당자, 세일즈단계
          filledFields: validationResults.dataQuality.hasDepartment + 
                       validationResults.dataQuality.hasHospitalName + 
                       validationResults.dataQuality.hasClientCompany + 
                       validationResults.dataQuality.hasAddress + 
                       validationResults.dataQuality.hasPhone + 
                       validationResults.dataQuality.hasSalesPerson + 
                       validationResults.dataQuality.hasSalesStage,
          completionRate: data.length > 0 ? 
            Math.round(((validationResults.dataQuality.hasDepartment + 
                        validationResults.dataQuality.hasHospitalName + 
                        validationResults.dataQuality.hasClientCompany + 
                        validationResults.dataQuality.hasAddress + 
                        validationResults.dataQuality.hasPhone + 
                        validationResults.dataQuality.hasSalesPerson + 
                        validationResults.dataQuality.hasSalesStage) / (data.length * 7)) * 100) : 0
        },
        // 매핑 정보 추가
        mappingInfo: {
          expectedHeaders: [
            'ID', '진료과', '의원명', '수탁사', '주소', '위도', '경도', '전화번호', '팩스', '원장이름', 
            '담당자명', '담당자 연락처', '세일즈 단계', '성향', 'Next Step', '과제(니즈)', '방문횟수', 
            '진행상황', '최초방문일자', '최종방문일자', '영업담당자', '1차 방문', '1차 방문 내용', 
            '2차 방문', '2차 방문 내용', '3차 방문', '3차 방문 내용', '4차 방문', '4차 방문 내용', 
            '5차 방문', '5차 방문 내용', '6차 방문', '6차 방문 내용', '최종 업데이트'
          ],
          actualHeaders: headers,
          mappingStatus: headers.length >= 33 ? 'complete' : 'incomplete'
        }
      }
    })
  } catch (error) {
    console.error('Google Sheets 연동 테스트 오류:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Google Sheets 연동에 실패했습니다.',
      details: {
        message: error instanceof Error ? error.message : '알 수 없는 오류',
        timestamp: new Date().toISOString(),
        connectionStatus: 'failed'
      }
    }, { status: 500 })
  }
} 