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
  Button,
} from '@mui/material'
import type { HospitalSalesData } from '@/lib/googleSheets'
import { convertToMapMarkers, getDepartmentColor, DEFAULT_MAP_CONFIG, getCurrentLocation, type CurrentLocation } from '@/lib/naverMap'

declare global {
  interface Window {
    naver: {
      maps: {
        Map: new (element: HTMLElement, options: unknown) => unknown
        LatLng: new (lat: number, lng: number) => unknown
        Marker: new (options: Record<string, unknown>) => unknown
        Size: new (width: number, height: number) => unknown
        Point: new (x: number, y: number) => unknown
        InfoWindow: new (options: unknown) => {
          open: (map: unknown, marker: unknown) => void
          close: () => void
        }
        event: {
          addListener: (target: unknown, event: string, handler: () => void) => void
        }
      }
    }
  }
}

interface NaverMapProps {
  hospitals: HospitalSalesData[]
  loading?: boolean
  onMarkerClick?: (hospital: HospitalSalesData) => void
}

export default function NaverMap({ 
  hospitals, 
  loading = false, 
  onMarkerClick 
}: NaverMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<unknown>(null)
  const markersRef = useRef<unknown[]>([])
  const infowindowsRef = useRef<unknown[]>([])
  const currentLocationMarkerRef = useRef<unknown>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [filterStage, setFilterStage] = useState<string>('all')
  const [scriptLoading, setScriptLoading] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<CurrentLocation | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)

  // 네이버맵 스크립트 로드
  const loadNaverMapScript = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      // 이미 로드된 경우
      if (window.naver && window.naver.maps) {
        resolve()
        return
      }

      // 중복 로딩 방지
      if (scriptLoading) {
        return
      }

      setScriptLoading(true)

      // 기존 스크립트 제거
      const existingScript = document.getElementById('naver-map-script')
      if (existingScript) {
        existingScript.remove()
      }

      const script = document.createElement('script')
      script.id = 'naver-map-script'
      script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${DEFAULT_MAP_CONFIG.apiKey}&submodules=geocoder`
      script.async = true
      
      script.onload = () => {
        clearTimeout(timeout)
        console.log('네이버맵 스크립트 로드 성공')
        setScriptLoading(false)
        resolve()
      }
      
      script.onerror = (error) => {
        clearTimeout(timeout)
        console.error('네이버맵 스크립트 로드 실패:', error)
        setScriptLoading(false)
        reject(new Error('네이버맵 API 인증에 실패했습니다. API 키를 확인해주세요.'))
      }

      // 타임아웃 설정 (10초)
      const timeout = setTimeout(() => {
        setScriptLoading(false)
        reject(new Error('네이버맵 스크립트 로드 타임아웃'))
      }, 10000)

      document.head.appendChild(script)
    })
  }, [scriptLoading])

  // 현재 위치 가져오기
  const getMyLocation = useCallback(async () => {
    try {
      setLocationLoading(true)
      const location = await getCurrentLocation()
      setCurrentLocation(location)
      
      // 지도가 로드된 경우 현재 위치로 이동
      if (mapInstanceRef.current && window.naver && window.naver.maps) {
        const map = mapInstanceRef.current as { setCenter: (latlng: unknown) => void }
        const latlng = new window.naver.maps.LatLng(location.lat, location.lng)
        map.setCenter(latlng)
      }
      
      console.log('현재 위치 가져오기 성공:', location)
    } catch (error) {
      console.error('현재 위치 가져오기 실패:', error)
      alert('현재 위치를 가져올 수 없습니다. 브라우저의 위치 권한을 확인해주세요.')
    } finally {
      setLocationLoading(false)
    }
  }, [])

  // 지도 초기화
  const initMap = useCallback(() => {
    if (!mapRef.current || !window.naver || !window.naver.maps) {
      console.error('지도 초기화 실패: window.naver 또는 mapRef 없음')
      return
    }

    try {
      console.log('지도 초기화 시작')
      const options = {
        center: new window.naver.maps.LatLng(
          DEFAULT_MAP_CONFIG.center.lat,
          DEFAULT_MAP_CONFIG.center.lng
        ),
        zoom: DEFAULT_MAP_CONFIG.zoom
      }
      mapInstanceRef.current = new window.naver.maps.Map(mapRef.current, options)
      setMapLoaded(true)
      console.log('지도 초기화 성공')
    } catch (error) {
      console.error('지도 초기화 오류:', error)
      setMapError(`지도를 초기화할 수 없습니다: ${error}`)
    }
  }, [])

  // 네이버맵 초기화 프로세스
  useEffect(() => {
    const initializeNaverMap = async () => {
      try {
        console.log('네이버맵 초기화 시작')
        console.log('API 키:', DEFAULT_MAP_CONFIG.apiKey ? '설정됨' : '설정되지 않음')
        
        if (!DEFAULT_MAP_CONFIG.apiKey || DEFAULT_MAP_CONFIG.apiKey === 'your_naver_client_id_here') {
          setMapError('네이버맵 API 키가 설정되지 않았습니다.')
          return
        }

        await loadNaverMapScript()
        initMap()
      } catch (error) {
        console.error('네이버맵 초기화 오류:', error)
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
        setMapError(`네이버맵 초기화 실패: ${errorMessage}`)
      }
    }

    if (typeof window !== 'undefined') {
      initializeNaverMap()
    }
  }, [loadNaverMapScript, initMap])

  // 현재 위치 마커 생성
  const createCurrentLocationMarker = useCallback(() => {
    if (!currentLocation || !mapInstanceRef.current || !window.naver || !window.naver.maps) return

    // 기존 현재 위치 마커 제거
    if (currentLocationMarkerRef.current) {
      const marker = currentLocationMarkerRef.current as { setMap: (map: unknown) => void }
      marker.setMap(null)
    }

    try {
      const position = new window.naver.maps.LatLng(currentLocation.lat, currentLocation.lng)
      
      // 현재 위치 마커 이미지 생성 (파란색 원)
      const canvas = document.createElement('canvas')
      canvas.width = 30
      canvas.height = 30
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.beginPath()
        ctx.arc(15, 15, 12, 0, 2 * Math.PI)
        ctx.fillStyle = '#4285F4'
        ctx.fill()
        ctx.strokeStyle = '#FFFFFF'
        ctx.lineWidth = 3
        ctx.stroke()
        ctx.fillStyle = '#FFFFFF'
        ctx.font = 'bold 14px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('📍', 15, 15)
      }

      const marker = new window.naver.maps.Marker({
        position,
        map: mapInstanceRef.current,
        title: '현재 위치',
        icon: {
          content: canvas.toDataURL(),
          size: new window.naver.maps.Size(30, 30),
          anchor: new window.naver.maps.Point(15, 15)
        },
        cursor: 'default'
      })

      currentLocationMarkerRef.current = marker
    } catch (error) {
      console.error('현재 위치 마커 생성 오류:', error)
    }
  }, [currentLocation])

  // 현재 위치 마커 업데이트
  useEffect(() => {
    if (mapLoaded && currentLocation) {
      createCurrentLocationMarker()
    }
  }, [mapLoaded, currentLocation, createCurrentLocationMarker])

  // 마커 생성 및 필터링
  const createMarkers = useCallback((markers: ReturnType<typeof convertToMapMarkers>) => {
    if (!mapInstanceRef.current || !window.naver || !window.naver.maps) return
    
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
      try {
        // 유효한 좌표인지 확인
        if (!markerData.position || 
            typeof markerData.position.lat !== 'number' || 
            typeof markerData.position.lng !== 'number' ||
            isNaN(markerData.position.lat) || 
            isNaN(markerData.position.lng)) {
          console.warn('유효하지 않은 좌표:', markerData)
          return
        }

        const position = new window.naver.maps.LatLng(
          markerData.position.lat,
          markerData.position.lng
        )
        
        // 진료과별 색상으로 마커 생성
        const canvas = document.createElement('canvas')
        canvas.width = 30
        canvas.height = 30
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.beginPath()
          ctx.arc(15, 15, 12, 0, 2 * Math.PI)
          ctx.fillStyle = getDepartmentColor(markerData.department)
          ctx.fill()
          ctx.strokeStyle = '#FFFFFF'
          ctx.lineWidth = 2
          ctx.stroke()
        }

        // 마커 옵션 객체 생성
        const markerOptions = {
          position,
          map: mapInstanceRef.current,
          title: markerData.title || '',
          icon: {
            content: canvas.toDataURL(),
            size: new window.naver.maps.Size(30, 30),
            anchor: new window.naver.maps.Point(15, 15)
          },
          clickable: true
        }

        const marker = new window.naver.maps.Marker(markerOptions)
        
        // 인포윈도우 생성
        const infowindow = new window.naver.maps.InfoWindow({
          content: markerData.content,
          maxWidth: 300,
          backgroundColor: '#fff',
          borderColor: '#03C75A',
          borderWidth: 2,
          anchorSize: new window.naver.maps.Size(20, 20),
          anchorColor: '#fff',
          pixelOffset: new window.naver.maps.Point(0, -10),
          closeButton: true,
          closeButtonVisible: true
        })
        
        // 마커 클릭 이벤트 등록
        window.naver.maps.event.addListener(marker, 'click', () => {
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
      } catch (error) {
        console.error('마커 생성 오류:', error, markerData)
      }
    })
    
    console.log('마커 생성 완료')
  }, [hospitals, onMarkerClick])

  // 마커 업데이트
  useEffect(() => {
    if (!mapLoaded || !window.naver || !window.naver.maps) return
    
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
  if (!DEFAULT_MAP_CONFIG.apiKey || DEFAULT_MAP_CONFIG.apiKey === 'your_naver_client_id_here') {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="warning">
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
              네이버맵 API 키가 설정되지 않았습니다.
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              다음 단계를 따라 네이버 지도 API를 설정해주세요:
            </Typography>
            <Typography variant="body2" component="div" sx={{ textAlign: 'left' }}>
              1. <a href="https://www.ncloud.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2' }}>네이버 클라우드 플랫폼</a>에서 계정 생성<br/>
              2. AI·NAVER API → Maps API 활성화<br/>
              3. 애플리케이션 등록 후 Client ID 발급<br/>
              4. 웹 서비스 URL에 <code>http://localhost:3000</code> 추가<br/>
              5. 프로젝트 루트에 <code>.env.local</code> 파일 생성 후 다음 내용 추가:<br/>
              <code style={{ display: 'block', background: '#f5f5f5', padding: '8px', margin: '8px 0', borderRadius: '4px', fontSize: '12px' }}>
                NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=your_actual_client_id_here
              </code>
            </Typography>
          </Box>
        </Alert>
      </Box>
    )
  }

  if (mapError) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="error">
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
              네이버맵 로딩 실패
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {mapError}
            </Typography>
            <Typography variant="body2" color="text.secondary" component="div" sx={{ textAlign: 'left' }}>
              <strong>해결 방법:</strong><br/>
              • API 키가 올바른지 확인하세요<br/>
              • 네이버 클라우드 플랫폼에서 애플리케이션이 등록되었는지 확인하세요<br/>
              • Maps API가 활성화되었는지 확인하세요<br/>
              • 웹 서비스 URL에 <code>http://localhost:3000</code>이 등록되었는지 확인하세요<br/>
              • 네트워크 연결을 확인하세요
            </Typography>
          </Box>
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

      {/* 현재 위치 버튼 */}
      <Box sx={{ 
        position: 'absolute', 
        top: 10, 
        right: 10, 
        zIndex: 1000,
        bgcolor: 'white',
        borderRadius: 1,
        p: 1,
        boxShadow: 2
      }}>
        <Button
          variant="contained"
          size="small"
          onClick={getMyLocation}
          disabled={locationLoading}
          startIcon={locationLoading ? <CircularProgress size={16} /> : null}
          sx={{ 
            bgcolor: '#03C75A',
            '&:hover': { bgcolor: '#02A94F' }
          }}
        >
          {locationLoading ? '위치 확인 중...' : '내 위치'}
        </Button>
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
            {scriptLoading ? '네이버맵 로딩 중...' : '지도 로딩 중...'}
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