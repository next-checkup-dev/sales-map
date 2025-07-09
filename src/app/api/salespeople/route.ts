import { NextRequest, NextResponse } from 'next/server'
import { 
  readHospitalSalesData, 
  writeHospitalSalesData, 
  updateHospitalSalesData, 
  deleteSalesPersonData,
  getRecommendations,
  type HospitalSalesData 
} from '@/lib/googleSheets'

export const dynamic = 'force-dynamic'

// GET: 병원 영업 데이터 읽기 또는 추천 데이터 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const field = searchParams.get('field')
    const value = searchParams.get('value')

    // 추천 데이터 조회
    if (field && value && (field === 'needs' || field === 'progress')) {
      const recommendations = await getRecommendations(field as 'needs' | 'progress', value)
      return NextResponse.json({ success: true, recommendations })
    }

    // 일반 데이터 조회
    console.log('Google Sheets 데이터 읽기 시작...')
    const data = await readHospitalSalesData()
    console.log('API 응답 데이터 샘플:', data.slice(0, 2)) // 처음 2개 데이터만 로그
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('API 오류 (GET):', error)
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
    return NextResponse.json(
      { success: false, error: `데이터를 불러오는데 실패했습니다: ${errorMessage}` },
      { status: 500 }
    )
  }
}

// POST: 새로운 병원 영업 데이터 추가
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const hospitalSalesData: HospitalSalesData = body

    const success = await writeHospitalSalesData(hospitalSalesData)
    
    if (success) {
      return NextResponse.json({ success: true, message: '병원 영업 데이터가 추가되었습니다.' })
    } else {
      return NextResponse.json(
        { success: false, error: '병원 영업 데이터 추가에 실패했습니다.' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('API 오류 (POST):', error)
    return NextResponse.json(
      { success: false, error: '요청을 처리하는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// PUT: 병원 영업 데이터 업데이트
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const hospitalSalesData: HospitalSalesData = body

    console.log('업데이트 요청 데이터:', {
      id: hospitalSalesData.id,
      hospitalName: hospitalSalesData.hospitalName,
      phone: hospitalSalesData.phone
    })

    const success = await updateHospitalSalesData(hospitalSalesData)
    
    if (success) {
      return NextResponse.json({ success: true, message: '병원 영업 데이터가 업데이트되었습니다.' })
    } else {
      console.error('Google Sheets 업데이트 실패')
      return NextResponse.json(
        { 
          success: false, 
          error: '병원 영업 데이터 업데이트에 실패했습니다.',
          details: {
            message: 'Google Sheets 연결에 문제가 있습니다.',
            solution: 'Google Sheets 문서에 서비스 계정 이메일을 편집자로 추가해주세요.',
            clientEmail: 'dev-773@rich-window-465113-k7.iam.gserviceaccount.com',
            spreadsheetId: '12pcRCN5bqqupjtVi06O3iW6VG8Q1Xr9qWV51ORUMyIA',
            guide: 'GOOGLE_SHEETS_SETUP.md 파일을 참고하세요.'
          }
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('API 오류 (PUT):', error)
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
    return NextResponse.json(
      { success: false, error: `요청을 처리하는데 실패했습니다: ${errorMessage}` },
      { status: 500 }
    )
  }
}

// DELETE: 영업사원 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID가 필요합니다.' },
        { status: 400 }
      )
    }

    const success = await deleteSalesPersonData(id)
    
    if (success) {
      return NextResponse.json({ success: true, message: '영업사원이 삭제되었습니다.' })
    } else {
      return NextResponse.json(
        { success: false, error: '영업사원 삭제에 실패했습니다.' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('API 오류 (DELETE):', error)
    return NextResponse.json(
      { success: false, error: '요청을 처리하는데 실패했습니다.' },
      { status: 500 }
    )
  }
} 