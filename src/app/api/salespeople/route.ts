import { NextRequest, NextResponse } from 'next/server'
import { 
  readSalesPeopleData, 
  writeSalesPersonData, 
  updateSalesPersonData, 
  deleteSalesPersonData,
  type SalesPersonData 
} from '@/lib/googleSheets'

export const dynamic = 'force-dynamic'

// GET: 영업사원 데이터 읽기
export async function GET() {
  try {
    const data = await readSalesPeopleData()
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('API 오류 (GET):', error)
    return NextResponse.json(
      { success: false, error: '데이터를 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// POST: 새로운 영업사원 추가
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const salesPersonData: SalesPersonData = body

    const success = await writeSalesPersonData(salesPersonData)
    
    if (success) {
      return NextResponse.json({ success: true, message: '영업사원이 추가되었습니다.' })
    } else {
      return NextResponse.json(
        { success: false, error: '영업사원 추가에 실패했습니다.' },
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

// PUT: 영업사원 데이터 업데이트
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const salesPersonData: SalesPersonData = body

    const success = await updateSalesPersonData(salesPersonData)
    
    if (success) {
      return NextResponse.json({ success: true, message: '영업사원 정보가 업데이트되었습니다.' })
    } else {
      return NextResponse.json(
        { success: false, error: '영업사원 업데이트에 실패했습니다.' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('API 오류 (PUT):', error)
    return NextResponse.json(
      { success: false, error: '요청을 처리하는데 실패했습니다.' },
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