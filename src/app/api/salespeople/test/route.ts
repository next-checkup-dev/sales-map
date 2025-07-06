import { NextResponse } from 'next/server'
import { readHospitalSalesData, type HospitalSalesData } from '@/lib/googleSheets'

export const dynamic = 'force-dynamic'

// Google Sheets 연동 테스트
export async function GET() {
  try {
    const startTime = Date.now()
    
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