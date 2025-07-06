import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')

    if (!address) {
      return NextResponse.json({
        success: false,
        error: '주소가 필요합니다.'
      }, { status: 400 })
    }

    const apiKey = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: '카카오맵 API 키가 설정되지 않았습니다.'
      }, { status: 500 })
    }

    const response = await fetch(
      `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`,
      {
        headers: {
          'Authorization': `KakaoAK ${apiKey}`
        }
      }
    )

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: '주소 변환에 실패했습니다.',
        details: data
      }, { status: response.status })
    }

    if (data.documents && data.documents.length > 0) {
      const location = data.documents[0]
      return NextResponse.json({
        success: true,
        data: {
          lat: parseFloat(location.y),
          lng: parseFloat(location.x),
          address: location.address_name,
          roadAddress: location.road_address?.address_name || null
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        error: '주소를 찾을 수 없습니다.'
      }, { status: 404 })
    }
  } catch (error) {
    console.error('주소 변환 API 오류:', error)
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
} 