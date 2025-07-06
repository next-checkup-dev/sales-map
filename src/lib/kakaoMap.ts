import type { HospitalSalesData } from './googleSheets'

// 카카오맵 API 관련 타입 정의
export interface KakaoMapConfig {
  apiKey: string
  center: {
    lat: number
    lng: number
  }
  level: number
}

export interface HospitalLocation {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  visitCount: number
  salesStage: string
  lastVisitDate: string
}

export interface MapMarker {
  id: string
  position: {
    lat: number
    lng: number
  }
  title: string
  content: string
  visitCount: number
  salesStage: string
}

// 카카오맵 API 키 (환경변수에서 가져오기)
export const KAKAO_MAP_API_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY || ''

// 기본 지도 설정
export const DEFAULT_MAP_CONFIG: KakaoMapConfig = {
  apiKey: KAKAO_MAP_API_KEY,
  center: {
    lat: 37.5665, // 서울 시청
    lng: 126.9780
  },
  level: 8
}

// 주소를 좌표로 변환하는 함수
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const response = await fetch(
      `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`,
      {
        headers: {
          'Authorization': `KakaoAK ${KAKAO_MAP_API_KEY}`
        }
      }
    )

    const data = await response.json()
    
    if (data.documents && data.documents.length > 0) {
      const location = data.documents[0]
      return {
        lat: parseFloat(location.y),
        lng: parseFloat(location.x)
      }
    }
    
    return null
  } catch (error) {
    console.error('주소 변환 오류:', error)
    return null
  }
}

// 병원 데이터를 지도 마커로 변환
export function convertToMapMarkers(hospitals: HospitalSalesData[]): MapMarker[] {
  return hospitals
    .filter(hospital => hospital.address && hospital.address.trim() !== '')
    .map(hospital => ({
      id: hospital.id,
      position: {
        lat: hospital.lat || 0,
        lng: hospital.lng || 0
      },
      title: hospital.hospitalName || '병원명 없음',
      content: createInfoWindowContent(hospital),
      visitCount: hospital.visitCount || 0,
      salesStage: hospital.salesStage || ''
    }))
}

// 인포윈도우 내용 생성 함수
function createInfoWindowContent(hospital: HospitalSalesData): string {
  const salesStageColor = getSalesStageColor(hospital.salesStage || '')
  
  return `
    <div style="padding: 15px; max-width: 300px; font-family: 'Noto Sans KR', sans-serif;">
      <!-- 헤더 -->
      <div style="border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; margin-bottom: 15px;">
        <h3 style="margin: 0; color: #333; font-size: 18px; font-weight: bold;">
          🏥 ${hospital.hospitalName || '병원명 없음'}
        </h3>
        <div style="display: flex; align-items: center; margin-top: 5px;">
          <span style="
            background-color: ${salesStageColor}; 
            color: white; 
            padding: 2px 8px; 
            border-radius: 12px; 
            font-size: 12px; 
            font-weight: bold;
          ">
            ${hospital.salesStage || '단계 미정'}
          </span>
          <span style="margin-left: 10px; color: #666; font-size: 12px;">
            방문 ${hospital.visitCount || 0}회
          </span>
        </div>
      </div>

      <!-- 기본 정보 -->
      <div style="margin-bottom: 15px;">
        <div style="margin-bottom: 8px;">
          <strong style="color: #555; font-size: 13px;">🏥 진료과:</strong>
          <span style="color: #333; font-size: 13px; margin-left: 5px;">
            ${hospital.department || '정보 없음'}
          </span>
        </div>
        <div style="margin-bottom: 8px;">
          <strong style="color: #555; font-size: 13px;">📍 주소:</strong>
          <span style="color: #333; font-size: 13px; margin-left: 5px;">
            ${hospital.address || '정보 없음'}
          </span>
        </div>
        <div style="margin-bottom: 8px;">
          <strong style="color: #555; font-size: 13px;">📞 전화:</strong>
          <span style="color: #333; font-size: 13px; margin-left: 5px;">
            ${hospital.phone || '정보 없음'}
          </span>
        </div>
        <div style="margin-bottom: 8px;">
          <strong style="color: #555; font-size: 13px;">👤 담당자:</strong>
          <span style="color: #333; font-size: 13px; margin-left: 5px;">
            ${hospital.salesPerson || '정보 없음'}
          </span>
        </div>
      </div>

      <!-- 방문 정보 -->
      <div style="margin-bottom: 15px;">
        <div style="margin-bottom: 8px;">
          <strong style="color: #555; font-size: 13px;">📅 최초방문:</strong>
          <span style="color: #333; font-size: 13px; margin-left: 5px;">
            ${hospital.firstVisitDate || '정보 없음'}
          </span>
        </div>
        <div style="margin-bottom: 8px;">
          <strong style="color: #555; font-size: 13px;">📅 최종방문:</strong>
          <span style="color: #333; font-size: 13px; margin-left: 5px;">
            ${hospital.lastVisitDate || '정보 없음'}
          </span>
        </div>
        <div style="margin-bottom: 8px;">
          <strong style="color: #555; font-size: 13px;">💬 반응:</strong>
          <span style="color: #333; font-size: 13px; margin-left: 5px;">
            ${hospital.response || '정보 없음'}
          </span>
        </div>
      </div>

      <!-- 다음 단계 -->
      ${hospital.nextStep ? `
        <div style="background-color: #f8f9fa; padding: 10px; border-radius: 5px; border-left: 4px solid #007bff;">
          <strong style="color: #007bff; font-size: 13px;">🎯 Next Step:</strong>
          <div style="color: #333; font-size: 13px; margin-top: 3px;">
            ${hospital.nextStep}
          </div>
        </div>
      ` : ''}

      <!-- 액션 버튼 -->
      <div style="margin-top: 15px; text-align: center;">
        <a href="https://map.kakao.com/link/map/${encodeURIComponent(hospital.hospitalName || '병원')},${hospital.lat || 0},${hospital.lng || 0}" 
           target="_blank" 
           style="
             display: inline-block;
             background-color: #007bff;
             color: white;
             text-decoration: none;
             padding: 8px 16px;
             border-radius: 5px;
             font-size: 12px;
             margin-right: 8px;
           ">
          🗺️ 큰지도보기
        </a>
        <a href="https://map.kakao.com/link/to/${encodeURIComponent(hospital.hospitalName || '병원')},${hospital.lat || 0},${hospital.lng || 0}" 
           target="_blank" 
           style="
             display: inline-block;
             background-color: #28a745;
             color: white;
             text-decoration: none;
             padding: 8px 16px;
             border-radius: 5px;
             font-size: 12px;
           ">
          🚗 길찾기
        </a>
      </div>
    </div>
  `
}

// 세일즈 단계별 색상 매핑
export function getSalesStageColor(stage: string): string {
  const colorMap: { [key: string]: string } = {
    '리드': '#FF6B6B',
    '프로스펙트': '#4ECDC4',
    '제안': '#45B7D1',
    '협상': '#96CEB4',
    '계약': '#FFEAA7',
    '완료': '#DDA0DD',
    '실패': '#FF8A80'
  }
  
  return colorMap[stage] || '#CCCCCC'
} 