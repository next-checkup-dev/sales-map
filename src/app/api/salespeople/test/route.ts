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

    return NextResponse.json({
      success: true,
      message: 'Google Sheets 연동이 정상적으로 작동합니다.',
      data: {
        totalRecords: data.length,
        responseTime: `${responseTime}ms`,
        sampleData: data.slice(0, 3), // 처음 3개 레코드만 샘플로 반환
        connectionStatus: 'connected',
        timestamp: new Date().toISOString()
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