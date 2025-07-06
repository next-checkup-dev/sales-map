'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material'
import type { HospitalSalesData } from '@/lib/googleSheets'
import { convertToMapMarkers, getDepartmentColor, DEFAULT_MAP_CONFIG } from '@/lib/kakaoMap'

declare global {
  interface Window {
    kakao: {
      maps: {
        Map: new (container: HTMLElement, options: unknown) => unknown
        LatLng: new (lat: number, lng: number) => unknown
        Marker: new (options: unknown) => unknown
        MarkerImage: new (src: string, size: unknown) => unknown
        Size: new (width: number, height: number) => unknown
        InfoWindow: new (options: unknown) => {
          open: (map: unknown, marker: unknown) => void
          close: () => void
        }
        event: {
          addListener: (target: unknown, event: string, handler: () => void) => void
        }
        load: (callback: () => void) => void
      }
    }
  }
}

interface KakaoMapProps {
  hospitals: HospitalSalesData[]
  loading?: boolean
  onMarkerClick?: (hospital: HospitalSalesData) => void
}

export default function KakaoMap({ 
  hospitals, 
  loading = false, 
  onMarkerClick 
}: KakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<unknown>(null)
  const markersRef = useRef<unknown[]>([])
  const infowindowsRef = useRef<unknown[]>([])
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [filterStage, setFilterStage] = useState<string>('all')
  const [scriptLoading, setScriptLoading] = useState(false)

  // 카카오맵 스크립트 로드 (개선된 방식)
  const loadKakaoMapScript = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      // 이미 로드된 경우
      if (window.kakao && window.kakao.maps) {
        resolve()
        return
      }

      // 중복 로딩 방지
      if (scriptLoading) {
        return
      }

      setScriptLoading(true)

      // 기존 스크립트 제거
      const existingScript = document.getElementById('kakao-map-script')
      if (existingScript) {
        existingScript.remove()
      }

      const script = document.createElement('script')
      script.id = 'kakao-map-script'
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${DEFAULT_MAP_CONFIG.apiKey}&autoload=false&libraries=services`
      script.async = true
      
      script.onload = () => {
        console.log('카카오맵 스크립트 로드 성공')
        setScriptLoading(false)
        resolve()
      }
      
      script.onerror = (error) => {
        console.error('카카오맵 스크립트 로드 실패:', error)
        setScriptLoading(false)
        reject(new Error('카카오맵 스크립트 로드 실패'))
      }

      // 타임아웃 설정 (10초)
      const timeout = setTimeout(() => {
        setScriptLoading(false)
        reject(new Error('카카오맵 스크립트 로드 타임아웃'))
      }, 10000)

      script.onload = () => {
        clearTimeout(timeout)
        console.log('카카오맵 스크립트 로드 성공')
        setScriptLoading(false)
        resolve()
      }

      document.head.appendChild(script)
    })
  }, [scriptLoading])

  // 지도 초기화
  const initMap = useCallback(() => {
    if (!mapRef.current || !window.kakao || !window.kakao.maps) {
      console.error('지도 초기화 실패: window.kakao 또는 mapRef 없음')
      return
    }

    try {
      console.log('지도 초기화 시작')
      const options = {
        center: new window.kakao.maps.LatLng(
          DEFAULT_MAP_CONFIG.center.lat,
          DEFAULT_MAP_CONFIG.center.lng
        ),
        level: DEFAULT_MAP_CONFIG.level
      }
      mapInstanceRef.current = new window.kakao.maps.Map(mapRef.current, options)
      setMapLoaded(true)
      console.log('지도 초기화 성공')
    } catch (error) {
      console.error('지도 초기화 오류:', error)
      setMapError(`지도를 초기화할 수 없습니다: ${error}`)
    }
  }, [])

  // 카카오맵 초기화 프로세스
  useEffect(() => {
    const initializeKakaoMap = async () => {
      try {
        console.log('카카오맵 초기화 시작')
        console.log('API 키:', DEFAULT_MAP_CONFIG.apiKey ? '설정됨' : '설정되지 않음')
        
        if (!DEFAULT_MAP_CONFIG.apiKey) {
          setMapError('카카오맵 API 키가 설정되지 않았습니다.')
          return
        }

        await loadKakaoMapScript()
        
        if (window.kakao && window.kakao.maps) {
          window.kakao.maps.load(() => {
            console.log('카카오맵 SDK 로드 완료')
            initMap()
          })
        } else {
          setMapError('카카오맵 SDK를 로드할 수 없습니다.')
        }
      } catch (error) {
        console.error('카카오맵 초기화 오류:', error)
        setMapError(`카카오맵 초기화 실패: ${error}`)
      }
    }

    if (typeof window !== 'undefined') {
      initializeKakaoMap()
    }
  }, [loadKakaoMapScript, initMap])

  // 마커 생성 및 필터링
  const createMarkers = useCallback((markers: ReturnType<typeof convertToMapMarkers>) => {
    if (!mapInstanceRef.current || !window.kakao) return
    
    console.log('마커 생성 시작:', markers.length, '개')
    
    // 기존 마커와 인포윈도우 제거
    markersRef.current.forEach(marker => {
      if (typeof (marker as { setMap?: unknown }).setMap === 'function') {
        ((marker as { setMap: (map: unknown) => void }).setMap)(null)
      }
    })
    markersRef.current = []
    
    // 기존 인포윈도우 닫기
    infowindowsRef.current.forEach(infowindow => {
      if (typeof (infowindow as { close?: unknown }).close === 'function') {
        ((infowindow as { close: () => void }).close)()
      }
    })
    infowindowsRef.current = []
    
    markers.forEach((markerData) => {
      const position = new window.kakao.maps.LatLng(
        markerData.position.lat,
        markerData.position.lng
      )
      const markerImage = new window.kakao.maps.MarkerImage(
        createMarkerImage(getDepartmentColor(markerData.department)),
        new window.kakao.maps.Size(30, 30)
      )
      const marker = new window.kakao.maps.Marker({
        position,
        map: mapInstanceRef.current,
        title: markerData.title,
        image: markerImage
      })
      
      // 인포윈도우 생성
      const infowindow = new window.kakao.maps.InfoWindow({
        content: markerData.content,
        removable: true,
        zIndex: 1
      })
      
      // 마커 클릭 이벤트 등록
      window.kakao.maps.event.addListener(marker, 'click', () => {
        // 다른 모든 인포윈도우 닫기
        infowindowsRef.current.forEach((iw) => {
          if (iw !== infowindow) {
            const infoWindow = iw as { close: () => void }
            infoWindow.close()
          }
        })
        
        // 현재 인포윈도우 열기
        const currentInfoWindow = infowindow as { open: (map: unknown, marker: unknown) => void }
        currentInfoWindow.open(mapInstanceRef.current, marker)
        
        // 마커 클릭 콜백 호출
        if (onMarkerClick) {
          const hospital = hospitals.find(h => h.id === markerData.id)
          if (hospital) {
            onMarkerClick(hospital)
          }
        }
      })
      
      markersRef.current.push(marker)
      infowindowsRef.current.push(infowindow)
    })
    
    console.log('마커 생성 완료')
  }, [hospitals, onMarkerClick])

  // 마커 이미지 생성 (Canvas)
  const createMarkerImage = (color: string): string => {
    const canvas = document.createElement('canvas')
    canvas.width = 30
    canvas.height = 30
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.beginPath()
      ctx.arc(15, 15, 12, 0, 2 * Math.PI)
      ctx.fillStyle = color
      ctx.fill()
      ctx.strokeStyle = '#FFFFFF'
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 12px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('🏥', 15, 15)
    }
    return canvas.toDataURL()
  }

  // 마커 업데이트
  useEffect(() => {
    if (!mapLoaded || !window.kakao || !window.kakao.maps) return
    
    let filteredHospitals = hospitals
    if (filterStage !== 'all') {
      filteredHospitals = hospitals.filter(hospital => hospital.salesStage === filterStage)
    }
    const markers = convertToMapMarkers(filteredHospitals)
    createMarkers(markers)
  }, [mapLoaded, hospitals, filterStage, createMarkers])

  const handleFilterChange = (event: SelectChangeEvent) => {
    setFilterStage(event.target.value)
  }

  // API 키 검증
  if (!DEFAULT_MAP_CONFIG.apiKey) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="warning">
          <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
            카카오맵 API 키가 설정되지 않았습니다.
          </Typography>
          <Typography variant="body2">
            1. .env.local 파일에 NEXT_PUBLIC_KAKAO_MAP_API_KEY=your_api_key 추가<br/>
            2. 카카오 개발자센터에서 JavaScript 키를 발급받으세요<br/>
            3. 사이트 도메인에 localhost:3000을 등록하세요
          </Typography>
        </Alert>
      </Box>
    )
  }

  if (mapError) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="error">
          <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
            카카오맵 로딩 실패
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {mapError}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • API 키가 올바른지 확인하세요<br/>
            • 사이트 도메인이 등록되었는지 확인하세요<br/>
            • 네트워크 연결을 확인하세요
          </Typography>
        </Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* 필터 컨트롤 */}
      <Box sx={{ 
        position: 'absolute', 
        top: 10, 
        left: 10, 
        zIndex: 1000,
        bgcolor: 'white',
        borderRadius: 1,
        p: 1,
        boxShadow: 2
      }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>세일즈 단계</InputLabel>
          <Select
            value={filterStage}
            label="세일즈 단계"
            onChange={handleFilterChange}
          >
            <MenuItem value="all">전체</MenuItem>
            <MenuItem value="S">S (최우선)</MenuItem>
            <MenuItem value="A">A (우선)</MenuItem>
            <MenuItem value="B">B (일반)</MenuItem>
            <MenuItem value="C">C (보류)</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* 로딩 상태 */}
      {(loading || scriptLoading) && (
        <Box sx={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          zIndex: 1000,
          bgcolor: 'white',
          borderRadius: 2,
          p: 2,
          boxShadow: 2
        }}>
          <CircularProgress size={40} />
          <Typography variant="body2" sx={{ mt: 1 }}>
            {scriptLoading ? '카카오맵 로딩 중...' : '지도 로딩 중...'}
          </Typography>
        </Box>
      )}

      {/* 지도 컨테이너 */}
      <Box
        ref={mapRef}
        sx={{
          width: '100%',
          height: '100%',
          minHeight: 400,
          borderRadius: 1,
          overflow: 'hidden',
          bgcolor: 'grey.100'
        }}
      />

      {/* 범례 */}
      <Box sx={{ 
        position: 'absolute', 
        bottom: 10, 
        right: 10, 
        zIndex: 1000,
        bgcolor: 'white',
        borderRadius: 1,
        p: 1,
        boxShadow: 2
      }}>
        <Typography variant="caption" sx={{ fontWeight: 'bold', mb: 1, display: 'block' }}>
          진료과
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {Array.from(new Set(hospitals.map(h => h.department)))
            .filter(dep => dep && dep.trim() !== '')
            .slice(0, 10) // 최대 10개만 표시
            .map(dep => (
              <Box key={dep} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: getDepartmentColor(dep),
                    border: '1px solid #ccc'
                  }}
                />
                <Typography variant="caption">{dep}</Typography>
              </Box>
            ))}
        </Box>
      </Box>
    </Box>
  )
} 