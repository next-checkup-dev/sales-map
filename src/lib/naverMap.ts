import type { HospitalSalesData } from './googleSheets'

// 네이버맵 API 관련 타입 정의
export interface NaverMapConfig {
  apiKey: string
  center: {
    lat: number
    lng: number
  }
  zoom: number
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
  department: string
}

export interface CurrentLocation {
  lat: number
  lng: number
  accuracy?: number
}

// 네이버맵 API 키 (환경변수에서 가져오기) - 새로운 ncpKeyId 사용
export const NAVER_MAP_API_KEY = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID || ''

// 기본 지도 설정
export const DEFAULT_MAP_CONFIG: NaverMapConfig = {
  apiKey: NAVER_MAP_API_KEY,
  center: {
    lat: 37.5665, // 서울 시청
    lng: 126.9780
  },
  zoom: 12
}

// 현재 위치 가져오기
export function getCurrentLocation(): Promise<CurrentLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('브라우저가 위치 정보를 지원하지 않습니다.'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        })
      },
      (error) => {
        reject(new Error(`위치 정보를 가져올 수 없습니다: ${error.message}`))
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    )
  })
}

// 주소를 좌표로 변환하는 함수 (네이버 지오코딩 API 사용) - 새로운 API 엔드포인트
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const response = await fetch(
      `https://maps.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(address)}`,
      {
        headers: {
          'x-ncp-apigw-api-key-id': NAVER_MAP_API_KEY,
          'x-ncp-apigw-api-key': process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_SECRET || ''
        }
      }
    )

    const data = await response.json()
    
    if (data.addresses && data.addresses.length > 0) {
      const location = data.addresses[0]
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
  console.log('convertToMapMarkers 호출:', hospitals.length, '개 병원')
  
  return hospitals
    .filter(hospital => {
      const hasAddress = hospital.address && hospital.address.trim() !== ''
      const hasValidCoords = hospital.lat && hospital.lng && 
                            hospital.lat !== 0 && hospital.lng !== 0 &&
                            !isNaN(hospital.lat) && !isNaN(hospital.lng)
      
      if (!hasAddress) {
        console.log('주소 없는 병원 제외:', hospital.hospitalName)
      }
      if (!hasValidCoords) {
        console.log('유효하지 않은 좌표 제외:', hospital.hospitalName, hospital.lat, hospital.lng)
      }
      
      return hasAddress && hasValidCoords
    })
    .map(hospital => {
      console.log('마커 변환:', hospital.hospitalName, hospital.lat, hospital.lng)
      return {
        id: hospital.id,
        position: {
          lat: hospital.lat || 0,
          lng: hospital.lng || 0
        },
        title: hospital.hospitalName || '병원명 없음',
        content: createInfoWindowContent(hospital),
        visitCount: hospital.visitCount || 0,
        salesStage: hospital.salesStage || '',
        department: hospital.department || '',
      }
    })
}

// 인포윈도우 내용 생성 함수
function createInfoWindowContent(hospital: HospitalSalesData): string {
  const salesStageColor = getSalesStageColor(hospital.salesStage || '')
  
  return `
    <div style="padding: 15px; max-width: 300px; font-family: 'Noto Sans KR', sans-serif;">
      <!-- 헤더 -->
      <div style="border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; margin-bottom: 15px;">
        <h3 style="margin: 0; color: #333; font-size: 18px; font-weight: bold;">
          ${hospital.hospitalName || '병원명 없음'}
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
          <strong style="color: #555; font-size: 13px;">👤 영업담당자:</strong>
          <span style="color: #333; font-size: 13px; margin-left: 5px;">
            ${hospital.salesPerson || '정보 없음'}
          </span>
        </div>
        <div style="margin-bottom: 8px;">
          <strong style="color: #555; font-size: 13px;">👨‍⚕️ 원장이름:</strong>
          <span style="color: #333; font-size: 13px; margin-left: 5px;">
            ${hospital.directorName || '정보 없음'}
          </span>
        </div>
        <div style="margin-bottom: 8px;">
          <strong style="color: #555; font-size: 13px;">📞 담당자명:</strong>
          <span style="color: #333; font-size: 13px; margin-left: 5px;">
            ${hospital.contactPerson || '정보 없음'}
          </span>
        </div>
        <div style="margin-bottom: 8px;">
          <strong style="color: #555; font-size: 13px;">📱 담당자 연락처:</strong>
          <span style="color: #333; font-size: 13px; margin-left: 5px;">
            ${hospital.contactPhone || '정보 없음'}
          </span>
        </div>
        <div style="margin-bottom: 8px;">
          <strong style="color: #555; font-size: 13px;">📠 팩스:</strong>
          <span style="color: #333; font-size: 13px; margin-left: 5px;">
            ${hospital.fax || '정보 없음'}
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
          <strong style="color: #555; font-size: 13px;">📊 진행상황:</strong>
          <span style="color: #333; font-size: 13px; margin-left: 5px;">
            ${hospital.progress || '정보 없음'}
          </span>
        </div>
        <div style="margin-bottom: 8px;">
          <strong style="color: #555; font-size: 13px;">💬 성향:</strong>
          <span style="color: #333; font-size: 13px; margin-left: 5px;">
            ${hospital.tendency || '정보 없음'}
          </span>
        </div>
        <div style="margin-bottom: 8px;">
          <strong style="color: #555; font-size: 13px;">📋 과제(니즈):</strong>
          <span style="color: #333; font-size: 13px; margin-left: 5px;">
            ${hospital.needs || '정보 없음'}
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
        <a href="https://map.naver.com/p/search/${encodeURIComponent(hospital.hospitalName || '병원')}" 
           target="_blank" 
           style="
             display: inline-block;
             background-color: #03C75A;
             color: white;
             text-decoration: none;
             padding: 8px 16px;
             border-radius: 5px;
             font-size: 12px;
             margin-right: 8px;
           ">
          🗺️ 네이버지도
        </a>
        <a href="https://map.naver.com/p/dir/${hospital.lat || 0},${hospital.lng || 0}" 
           target="_blank" 
           style="
             display: inline-block;
             background-color: #4285F4;
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
    'S': '#FF6B6B', // 최우선 - 빨간색
    'A': '#4ECDC4', // 우선 - 청록색
    'B': '#45B7D1', // 일반 - 파란색
    'C': '#96CEB4', // 보류 - 연두색
  }
  
  return colorMap[stage] || '#CCCCCC'
}

// 진료과별 색상 매핑
export function getDepartmentColor(department: string): string {
  const colorMap: { [key: string]: string } = {
    '내과': '#D32F2F', // 빨강
    '비뇨기과': '#FFD600', // 노랑
    '산부인과': '#7B1FA2', // 보라
    '정형외과': '#1976D2', // 파랑
    '외과': '#FBC02D',
    '소아과': '#388E3C',
    '이비인후과': '#512DA8',
    '피부과': '#F57C00',
    '안과': '#0288D1',
    '치과': '#C2185B',
    '신경과': '#455A64',
    '정신건강의학과': '#8D6E63',
    '재활의학과': '#43A047',
    '가정의학과': '#6D4C41',
    '마취통증의학과': '#F06292',
    '영상의학과': '#00ACC1',
    '진단검사의학과': '#FFD600',
    '기타': '#BDBDBD',
  }
  // 부분 일치 허용
  for (const key of Object.keys(colorMap)) {
    if (department.includes(key)) return colorMap[key]
  }
  return '#CCCCCC' // 기본색
} 