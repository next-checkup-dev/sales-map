import { NextResponse } from 'next/server'
import { readSalesPeopleData } from '@/lib/googleSheets'

export const dynamic = 'force-dynamic'

// Google Sheets 연동 테스트
export async function GET() {
  try {
    const startTime = Date.now()
    
    // 데이터 읽기 테스트
    const data = await readSalesPeopleData()
    const endTime = Date.now()
    const responseTime = endTime - startTime

    // 데이터 검증
    const validationResults = {
      hasData: data.length > 0,
      validRecords: 0,
      invalidRecords: 0,
      missingFields: [] as string[],
      dataQuality: {
        hasName: 0,
        hasEmail: 0,
        hasPosition: 0,
        hasLocation: 0,
        hasPhone: 0,
        hasCoordinates: 0
      }
    }

    // 각 레코드 검증
    data.forEach(record => {
      let isValid = true
      
      // 필수 필드 확인
      if (!record.name || record.name.trim() === '') {
        validationResults.missingFields.push('이름')
        isValid = false
      } else {
        validationResults.dataQuality.hasName++
      }
      
      if (!record.email || record.email.trim() === '') {
        validationResults.missingFields.push('이메일')
        isValid = false
      } else {
        validationResults.dataQuality.hasEmail++
      }
      
      if (!record.position || record.position.trim() === '') {
        validationResults.missingFields.push('직책')
        isValid = false
      } else {
        validationResults.dataQuality.hasPosition++
      }
      
      if (!record.location || record.location.trim() === '') {
        validationResults.missingFields.push('위치')
        isValid = false
      } else {
        validationResults.dataQuality.hasLocation++
      }
      
      if (!record.phone || record.phone.trim() === '') {
        validationResults.missingFields.push('전화번호')
        isValid = false
      } else {
        validationResults.dataQuality.hasPhone++
      }
      
      // 좌표 정보 확인
      if (record.latitude && record.longitude) {
        validationResults.dataQuality.hasCoordinates++
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
          totalFields: data.length * 6, // ID, 이름, 이메일, 직책, 위치, 전화번호
          filledFields: validationResults.dataQuality.hasName + 
                       validationResults.dataQuality.hasEmail + 
                       validationResults.dataQuality.hasPosition + 
                       validationResults.dataQuality.hasLocation + 
                       validationResults.dataQuality.hasPhone,
          completionRate: data.length > 0 ? 
            Math.round(((validationResults.dataQuality.hasName + 
                        validationResults.dataQuality.hasEmail + 
                        validationResults.dataQuality.hasPosition + 
                        validationResults.dataQuality.hasLocation + 
                        validationResults.dataQuality.hasPhone) / (data.length * 5)) * 100) : 0
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