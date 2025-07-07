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
        Event: {
          addListener: (target: unknown, event: string, handler: () => void) => void
        }
        event: {
          addListener: (target: unknown, event: string, handler: () => void) => void
        }
      }
    }
    navermap_authFailure?: () => void
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
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [filterStage, setFilterStage] = useState<string>('all')
  const [scriptLoading, setScriptLoading] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<CurrentLocation | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [overlappingMarkers, setOverlappingMarkers] = useState<Array<{id: string, title: string, position: {lat: number, lng: number}}>>([])
  const [showOverlapMenu, setShowOverlapMenu] = useState(false)
  const [overlapMenuPosition, setOverlapMenuPosition] = useState({x: 0, y: 0})
  const [visibleBounds, setVisibleBounds] = useState<{north: number, south: number, east: number, west: number} | null>(null)
  const [isUpdatingMarkers, setIsUpdatingMarkers] = useState(false)

  // 인증 실패 핸들러 설정
  useEffect(() => {
    window.navermap_authFailure = () => {
      console.error('네이버 지도 API 인증 실패')
      setMapError('네이버 지도 API 인증에 실패했습니다. 클라이언트 ID를 확인해주세요.')
    }
  }, [])

  // 네이버맵 스크립트 로드 (새로운 API v3 방식)
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
      // 새로운 API v3 엔드포인트와 ncpKeyId 파라미터 사용
      script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${DEFAULT_MAP_CONFIG.apiKey}&submodules=geocoder`
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
        reject(new Error('네이버 지도 API v3 로드에 실패했습니다. API 키를 확인해주세요.'))
      }

      // 타임아웃 설정 (10초)
      const timeout = setTimeout(() => {
        setScriptLoading(false)
        reject(new Error('네이버맵 스크립트 로드 타임아웃'))
      }, 10000)

      document.head.appendChild(script)
    })
  }, [scriptLoading])

  // 현재 위치 가져오기 (네이버 지도 기본 기능 사용)
  const getMyLocation = useCallback(async () => {
    try {
      setLocationLoading(true)
      
      // 지도가 로드된 경우 현재 위치로 이동
      if (mapInstanceRef.current && window.naver && window.naver.maps) {
        const map = mapInstanceRef.current as any
        
        // 수동으로 현재 위치 가져와서 지도 중심 이동
        const location = await getCurrentLocation()
        setCurrentLocation(location)
        
        const latlng = new window.naver.maps.LatLng(location.lat, location.lng)
        map.setCenter(latlng)
        
        // 줌 레벨 조정 (현재 위치에 맞게)
        map.setZoom(15)
      }
      
      console.log('현재 위치 가져오기 성공')
    } catch (error) {
      console.error('현재 위치 가져오기 실패:', error)
      alert('현재 위치를 가져올 수 없습니다. 브라우저의 위치 권한을 확인해주세요.')
    } finally {
      setLocationLoading(false)
    }
  }, [])

  // 지도 초기화 (새로운 API v3)
  const initMap = useCallback(() => {
    if (!mapRef.current || !window.naver || !window.naver.maps) {
      console.error('지도 초기화 실패: window.naver 또는 mapRef 없음')
      return
    }

    // 이미 지도가 초기화된 경우 제거
    if (mapInstanceRef.current) {
      try {
        const map = mapInstanceRef.current as any
        if (map.destroy) {
          map.destroy()
        }
      } catch (error) {
        console.warn('기존 지도 제거 중 오류:', error)
      }
      mapInstanceRef.current = null
    }

    // 지도 컨테이너 초기화
    if (mapRef.current) {
      mapRef.current.innerHTML = ''
    }

    try {
      console.log('지도 초기화 시작 (API v3)')
      const options = {
        center: new window.naver.maps.LatLng(
          DEFAULT_MAP_CONFIG.center.lat,
          DEFAULT_MAP_CONFIG.center.lng
        ),
        zoom: DEFAULT_MAP_CONFIG.zoom,
        mapTypeControl: true,
        zoomControl: false, // 줌 컨트롤 제거
        logoControl: false, // 네이버 로고 제거
        scaleControl: false // 척도 표시 제거
      }
      mapInstanceRef.current = new window.naver.maps.Map(mapRef.current, options)
      
      // 지도 이벤트 등록
      try {
        if (window.naver && window.naver.maps && window.naver.maps.Event) {
          // 지도 클릭 시 겹침 메뉴 닫기
          window.naver.maps.Event.addListener(mapInstanceRef.current, 'click', () => {
            setShowOverlapMenu(false)
          })
          
          // 지도 이동/줌 변경 시 마커 재생성 (성능 최적화)
          let moveTimer: NodeJS.Timeout | null = null;
          let lastUpdateTime = 0;
          let lastBounds: {north: number, south: number, east: number, west: number} | null = null;
          
          const updateVisibleMarkers = () => {
            const now = Date.now();
            if (isUpdatingMarkers || now - lastUpdateTime < 200) return; // 200ms로 단축
            
            // 현재 지도 경계 가져오기
            const newBounds = getMapBounds();
            if (!newBounds) return;
            
            // 경계가 크게 변경되지 않았으면 업데이트 건너뛰기
            if (lastBounds && newBounds) {
              const latDiff = Math.abs(newBounds.north - lastBounds.north) + Math.abs(newBounds.south - lastBounds.south);
              const lngDiff = Math.abs(newBounds.east - lastBounds.east) + Math.abs(newBounds.west - lastBounds.west);
              
              // 경계 변화가 작으면 업데이트 건너뛰기 (성능 최적화)
              if (latDiff < 0.01 && lngDiff < 0.01) {
                return;
              }
            }
            
            lastUpdateTime = now;
            lastBounds = newBounds;
            setIsUpdatingMarkers(true);
            
            // 겹침 메뉴 닫기
            setShowOverlapMenu(false)
            
            // 마커 재생성 (화면에 보이는 영역만)
            let filteredHospitals = hospitals
            if (filterStage !== 'all') {
              filteredHospitals = hospitals.filter(hospital => hospital.salesStage === filterStage)
            }
            const markers = convertToMapMarkers(filteredHospitals)
            
            if (markers.length === 0) {
              const testMarkers = [{
                id: 'test-1',
                position: { lat: 37.5665, lng: 126.9780 },
                title: '테스트 병원',
                content: '<div style="padding: 15px;"><h3>테스트 병원</h3><p>이 마커는 테스트용입니다.</p></div>',
                visitCount: 1,
                salesStage: 'A',
                department: '내과'
              }]
              createMarkers(testMarkers, newBounds || undefined)
            } else {
              createMarkers(markers, newBounds || undefined)
            }
            
            // 비동기로 상태 업데이트
            setTimeout(() => setIsUpdatingMarkers(false), 50);
          };
          
          // 줌 변경 이벤트 (즉시 반응)
          window.naver.maps.Event.addListener(mapInstanceRef.current, 'zoom_changed', () => {
            if (moveTimer) clearTimeout(moveTimer);
            moveTimer = setTimeout(updateVisibleMarkers, 100); // 줌 변경 시 즉시 반응
          });
          
          // 지도 이동 이벤트 (빠른 반응)
          window.naver.maps.Event.addListener(mapInstanceRef.current, 'bounds_changed', () => {
            if (moveTimer) clearTimeout(moveTimer);
            moveTimer = setTimeout(updateVisibleMarkers, 200); // 200ms로 단축
          });
        }
      } catch (error) {
        console.warn('지도 이벤트 등록 실패:', error)
      }
      
      setMapLoaded(true)
      console.log('지도 초기화 성공 (API v3)')
    } catch (error) {
      console.error('지도 초기화 오류:', error)
      setMapError(`지도를 초기화할 수 없습니다: ${error}`)
    }
  }, [])

  // 네이버맵 초기화 프로세스 (새로운 API v3)
  useEffect(() => {
    let isMounted = true

    const initializeNaverMap = async () => {
      try {
        console.log('네이버 지도 API v3 초기화 시작')
        console.log('API 키:', DEFAULT_MAP_CONFIG.apiKey ? '설정됨' : '설정되지 않음')
        
        if (!DEFAULT_MAP_CONFIG.apiKey || DEFAULT_MAP_CONFIG.apiKey === 'your_naver_client_id_here') {
          if (isMounted) {
            setMapError('네이버 지도 API v3 키가 설정되지 않았습니다.')
          }
          return
        }

        await loadNaverMapScript()
        if (isMounted) {
          initMap()
        }
      } catch (error) {
        console.error('네이버 지도 API v3 초기화 오류:', error)
        if (isMounted) {
          const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
          setMapError(`네이버 지도 API v3 초기화 실패: ${errorMessage}`)
        }
      }
    }

    if (typeof window !== 'undefined') {
      initializeNaverMap()
    }

    return () => {
      isMounted = false
    }
  }, [loadNaverMapScript, initMap])

  // 현재 위치 마커 생성 제거 (네이버 지도 기본 기능 사용)
  // createCurrentLocationMarker 함수와 관련 useEffect 제거

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      // 마커와 인포윈도우 정리
      try {
        markersRef.current.forEach(marker => {
          try {
            if (marker && typeof (marker as { setMap?: unknown }).setMap === 'function') {
              ((marker as { setMap: (map: unknown) => void }).setMap)(null)
            }
          } catch (error) {
            console.warn('마커 정리 중 오류:', error)
          }
        })
        markersRef.current = []
        
        infowindowsRef.current.forEach(infowindow => {
          try {
            if (infowindow && typeof (infowindow as { close?: unknown }).close === 'function') {
              ((infowindow as { close: () => void }).close)()
            }
          } catch (error) {
            console.warn('인포윈도우 정리 중 오류:', error)
          }
        })
        infowindowsRef.current = []
        
        // 지도 인스턴스 정리
        if (mapInstanceRef.current) {
          try {
            const map = mapInstanceRef.current as any
            if (map.destroy) {
              map.destroy()
            }
          } catch (error) {
            console.warn('지도 정리 중 오류:', error)
          }
          mapInstanceRef.current = null
        }
      } catch (error) {
        console.warn('컴포넌트 정리 중 오류:', error)
      }
    }
  }, [])

  // 마커 간 거리 계산 함수
  const calculateDistance = useCallback((pos1: {lat: number, lng: number}, pos2: {lat: number, lng: number}) => {
    const R = 6371; // 지구의 반지름 (km)
    const dLat = (pos2.lat - pos1.lat) * Math.PI / 180;
    const dLng = (pos2.lng - pos1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(pos1.lat * Math.PI / 180) * Math.cos(pos2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, [])

  // 화면에 보이는 영역의 마커만 필터링
  const filterVisibleMarkers = useCallback((markers: ReturnType<typeof convertToMapMarkers>, bounds: {north: number, south: number, east: number, west: number}) => {
    if (!bounds) return markers;
    
    return markers.filter(marker => {
      const { lat, lng } = marker.position;
      return lat >= bounds.south && lat <= bounds.north && lng >= bounds.west && lng <= bounds.east;
    });
  }, [])

  // 지도 경계 가져오기 (API v3 호환)
  const getMapBounds = useCallback(() => {
    if (!mapInstanceRef.current) return null;
    
    try {
      const map = mapInstanceRef.current as any;
      
      // API v3에서 경계 가져오기 시도
      if (map.getBounds && typeof map.getBounds === 'function') {
        const bounds = map.getBounds();
        
        // bounds 객체의 구조 확인
        if (bounds && typeof bounds === 'object') {
          // getNorthEast, getSouthWest 메서드가 있는지 확인
          if (bounds.getNorthEast && bounds.getSouthWest && 
              typeof bounds.getNorthEast === 'function' && 
              typeof bounds.getSouthWest === 'function') {
            
            const ne = bounds.getNorthEast();
            const sw = bounds.getSouthWest();
            
            if (ne && sw && typeof ne.lat === 'function' && typeof ne.lng === 'function' &&
                typeof sw.lat === 'function' && typeof sw.lng === 'function') {
              
              return {
                north: ne.lat(),
                south: sw.lat(),
                east: ne.lng(),
                west: sw.lng()
              };
            }
          }
          
          // 직접 속성으로 접근 시도
          if (bounds.northEast && bounds.southWest) {
            const ne = bounds.northEast;
            const sw = bounds.southWest;
            
            if (typeof ne.lat === 'number' && typeof ne.lng === 'number' &&
                typeof sw.lat === 'number' && typeof sw.lng === 'number') {
              
              return {
                north: ne.lat,
                south: sw.lat,
                east: ne.lng,
                west: sw.lng
              };
            }
          }
        }
      }
      
      // 대안: 중심점과 줌 레벨로 대략적인 경계 계산
      if (map.getCenter && map.getZoom && 
          typeof map.getCenter === 'function' && 
          typeof map.getZoom === 'function') {
        
        const center = map.getCenter();
        const zoom = map.getZoom();
        
        if (center && typeof center.lat === 'function' && typeof center.lng === 'function') {
          const centerLat = center.lat();
          const centerLng = center.lng();
          
          // 줌 레벨에 따른 대략적인 경계 계산
          const latOffset = 0.01 * Math.pow(2, 15 - zoom); // 대략적인 위도 오프셋
          const lngOffset = 0.01 * Math.pow(2, 15 - zoom); // 대략적인 경도 오프셋
          
          return {
            north: centerLat + latOffset,
            south: centerLat - latOffset,
            east: centerLng + lngOffset,
            west: centerLng - lngOffset
          };
        }
      }
      
    } catch (error) {
      // 오류 무시 (성능 최적화)
    }
    
    return null;
  }, [])

  // 겹치는 마커 그룹 찾기 (줌 레벨에 따른 동적 거리 계산)
  const findOverlappingMarkers = useCallback((markers: ReturnType<typeof convertToMapMarkers>, zoomLevel: number) => {
    const groups: Array<Array<{id: string, title: string, position: {lat: number, lng: number}}>> = [];
    const processed = new Set<string>();
    
    // 줌 레벨에 따른 거리 임계값 조정
    // 줌이 클수록 (확대할수록) 더 가까운 거리에서 클러스터링
    let distanceThreshold = 0.05; // 기본 50m
    if (zoomLevel >= 17) {
      distanceThreshold = 0.01; // 10m (매우 가까운 거리)
    } else if (zoomLevel >= 15) {
      distanceThreshold = 0.02; // 20m
    } else if (zoomLevel >= 13) {
      distanceThreshold = 0.05; // 50m
    } else if (zoomLevel >= 11) {
      distanceThreshold = 0.1; // 100m
    } else {
      distanceThreshold = 0.2; // 200m
    }
    
    // 성능 최적화: 마커 수가 많으면 샘플링
    const sampleSize = markers.length > 100 ? 100 : markers.length;
    const sampledMarkers = markers.slice(0, sampleSize);
    
    sampledMarkers.forEach((marker1, index1) => {
      if (processed.has(marker1.id)) return;
      
      const group = [{
        id: marker1.id,
        title: marker1.title || '의원명 없음',
        position: marker1.position
      }];
      processed.add(marker1.id);
      
      sampledMarkers.forEach((marker2, index2) => {
        if (index1 === index2 || processed.has(marker2.id)) return;
        
        const distance = calculateDistance(marker1.position, marker2.position);
        if (distance < distanceThreshold) {
          group.push({
            id: marker2.id,
            title: marker2.title || '의원명 없음',
            position: marker2.position
          });
          processed.add(marker2.id);
        }
      });
      
      // 그룹이 2개 이상이거나, 줌 레벨이 낮을 때는 1개라도 클러스터링
      if (group.length > 1 || zoomLevel < 13) {
        groups.push(group);
      }
    });
    
    return groups;
  }, [calculateDistance])

  // 마커 생성 및 필터링 (API v3 방식) - 성능 최적화
  const createMarkers = useCallback((markers: ReturnType<typeof convertToMapMarkers>, bounds?: {north: number, south: number, east: number, west: number}) => {
    if (!mapInstanceRef.current || !window.naver || !window.naver.maps) {
      return
    }
    
    // 현재 줌 레벨 가져오기
    const zoomLevel = (mapInstanceRef.current as any)?.getZoom?.() || 13
    
    // 줌 레벨이 너무 낮으면 마커 표시하지 않음 (성능 최적화)
    if (zoomLevel < 12) {
      // 기존 마커들 제거
      markersRef.current.forEach(marker => {
        try {
          if (marker && typeof (marker as { setMap?: unknown }).setMap === 'function') {
            ((marker as { setMap: (map: unknown) => void }).setMap)(null)
          }
        } catch (error) {
          // 오류 무시
        }
      })
      markersRef.current = []
      infowindowsRef.current = []
      return
    }
    
    // 화면에 보이는 영역의 마커만 필터링
    const visibleMarkers = bounds ? filterVisibleMarkers(markers, bounds) : markers;
    
    // 줌 레벨에 따른 마커 수 제한 (더 적극적인 제한)
    let maxMarkers = 30; // 기본값
    if (zoomLevel >= 16) {
      maxMarkers = 100; // 고해상도
    } else if (zoomLevel >= 14) {
      maxMarkers = 60; // 중간 해상도
    } else if (zoomLevel >= 12) {
      maxMarkers = 30; // 낮은 해상도
    } else {
      maxMarkers = 15; // 매우 낮은 해상도
    }
    
    const limitedMarkers = visibleMarkers.length > maxMarkers 
      ? visibleMarkers.slice(0, maxMarkers) 
      : visibleMarkers;
    
    if (limitedMarkers.length === 0) return;
    
    // 기존 마커와 인포윈도우 제거 (배치 처리로 성능 향상)
    const removePromises = markersRef.current.map(marker => {
      return new Promise<void>((resolve) => {
        try {
          if (marker && typeof (marker as { setMap?: unknown }).setMap === 'function') {
            ((marker as { setMap: (map: unknown) => void }).setMap)(null)
          }
        } catch (error) {
          // 오류 무시
        }
        resolve();
      });
    });
    
    // 인포윈도우 닫기
    infowindowsRef.current.forEach(infowindow => {
      try {
        if (infowindow && typeof (infowindow as { close?: unknown }).close === 'function') {
          ((infowindow as { close: () => void }).close)()
        }
      } catch (error) {
        // 오류 무시
      }
    });
    
    // 배열 초기화
    markersRef.current = []
    infowindowsRef.current = []
    
    // 겹치는 마커 그룹 찾기 (줌 레벨에 따른 동적 클러스터링)
    const overlappingGroups = findOverlappingMarkers(limitedMarkers, zoomLevel);
    const processedMarkers = new Set<string>()
    
    // 겹치는 마커들을 하나의 클러스터 마커로 처리
    overlappingGroups.forEach(group => {
      const centerLat = group.reduce((sum, m) => sum + m.position.lat, 0) / group.length
      const centerLng = group.reduce((sum, m) => sum + m.position.lng, 0) / group.length
      const centerPosition = new window.naver.maps.LatLng(centerLat, centerLng)
      
      // 클러스터 마커 생성 ('n' 형태, 그룹 크기에 따른 동적 크기)
      const markerSize = group.length > 10 ? 32 : group.length > 5 ? 30 : 28;
      const fontSize = group.length > 10 ? 10 : group.length > 5 ? 11 : 12;
      const bgColor = group.length > 10 ? '#E53E3E' : group.length > 5 ? '#FF6B6B' : '#FF8E8E';
      
      const clusterIcon = `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1px;
        ">
          <div style="
            width: ${markerSize}px; 
            height: ${markerSize}px; 
            background: ${bgColor}; 
            border: 2px solid #FFFFFF; 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            color: white; 
            font-size: ${fontSize}px; 
            font-weight: bold;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            cursor: pointer;
            transition: all 0.2s ease;
          ">${group.length}</div>
        </div>
      `
      
      const clusterMarkerOptions = {
        position: centerPosition,
        map: mapInstanceRef.current,
        title: `${group.length}개 의원`,
        icon: {
          content: clusterIcon,
          size: new window.naver.maps.Size(markerSize, markerSize),
          anchor: new window.naver.maps.Point(markerSize / 2, markerSize / 2)
        }
      }
      
      const clusterMarker = new window.naver.maps.Marker(clusterMarkerOptions)
      
                // 클러스터 마커 클릭 이벤트
          try {
            if (window.naver && window.naver.maps && window.naver.maps.Event) {
              window.naver.maps.Event.addListener(clusterMarker, 'click', (e: any) => {
                // 마우스 이벤트 위치 사용 (가장 정확)
                if (e && e.domEvent) {
                  const rect = (e.domEvent.target as HTMLElement).getBoundingClientRect();
                  setOverlappingMarkers(group)
                  setOverlapMenuPosition({
                    x: rect.left + rect.width / 2,
                    y: rect.top
                  })
                  setShowOverlapMenu(true)
                } else {
                  // 대안: 지도 중앙 기준으로 메뉴 표시
                  setOverlappingMarkers(group)
                  setOverlapMenuPosition({
                    x: window.innerWidth / 2,
                    y: window.innerHeight / 2
                  })
                  setShowOverlapMenu(true)
                }
              })
        } else if (window.naver && window.naver.maps && window.naver.maps.event) {
          // 기존 방식 시도
          window.naver.maps.event.addListener(clusterMarker, 'click', () => {
            setOverlappingMarkers(group)
            setOverlapMenuPosition({
              x: window.innerWidth / 2,
              y: window.innerHeight / 2
            })
            setShowOverlapMenu(true)
          })
        } else {
          // 대안: 마커 요소에 직접 이벤트 리스너 추가
          const markerElement = clusterMarker as any
          if (markerElement && markerElement.getElement) {
            const element = markerElement.getElement()
            if (element) {
              element.addEventListener('click', () => {
                setOverlappingMarkers(group)
                setOverlapMenuPosition({
                  x: window.innerWidth / 2,
                  y: window.innerHeight / 2
                })
                setShowOverlapMenu(true)
              })
            }
          }
        }
      } catch (eventError) {
        // 대안: 마커 요소에 직접 이벤트 리스너 추가
        try {
          const markerElement = clusterMarker as any
          if (markerElement && markerElement.getElement) {
            const element = markerElement.getElement()
            if (element) {
              element.addEventListener('click', () => {
                setOverlappingMarkers(group)
                setOverlapMenuPosition({
                  x: window.innerWidth / 2,
                  y: window.innerHeight / 2
                })
                setShowOverlapMenu(true)
              })
            }
          }
        } catch (altError) {
          // 오류 무시
        }
      }
      
      markersRef.current.push(clusterMarker)
      
      // 그룹에 포함된 마커들을 처리된 것으로 표시
      group.forEach(marker => processedMarkers.add(marker.id))
    })
    
    // 겹치지 않는 개별 마커들 생성
    visibleMarkers.forEach((markerData) => {
      // 이미 클러스터에 포함된 마커는 건너뛰기
      if (processedMarkers.has(markerData.id)) {
        return
      }
      
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

        // 좌표 범위 검증 (더 넓은 범위)
        if (markerData.position.lat < -90 || markerData.position.lat > 90 ||
            markerData.position.lng < -180 || markerData.position.lng > 180) {
          console.warn('유효하지 않은 좌표 범위:', markerData)
          return
        }

        const position = new window.naver.maps.LatLng(
          markerData.position.lat,
          markerData.position.lng
        )
        
        // 진료과별 색상으로 마커 생성 (API v3 방식)
        const departmentColor = getDepartmentColor(markerData.department)
        const markerIcon = `
          <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2px;
          ">
            <div style="
              width: 20px; 
              height: 20px; 
              background: ${departmentColor}; 
              border: 2px solid #FFFFFF; 
              border-radius: 50%; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              color: white; 
              font-size: 8px; 
              font-weight: bold;
              box-shadow: 0 1px 3px rgba(0,0,0,0.3);
            "></div>
            <div style="
              background: rgba(0, 0, 0, 0.8);
              color: white;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 10px;
              font-weight: bold;
              white-space: nowrap;
              max-width: 120px;
              overflow: hidden;
              text-overflow: ellipsis;
              text-align: center;
            ">${markerData.title || '의원명 없음'}</div>
          </div>
        `

        // 마커 옵션 객체 생성 (API v3 호환)
        const markerOptions = {
          position,
          map: mapInstanceRef.current,
          title: markerData.title || '',
          icon: {
            content: markerIcon,
            size: new window.naver.maps.Size(120, 40), // 의원명을 포함한 크기로 조정
            anchor: new window.naver.maps.Point(60, 10) // 마커 중심점 조정
          }
        }

        const marker = new window.naver.maps.Marker(markerOptions)
        
        // 인포윈도우 생성 (API v3 호환)
        const infowindow = new window.naver.maps.InfoWindow({
          content: markerData.content,
          maxWidth: 300,
          backgroundColor: '#fff',
          borderColor: '#03C75A',
          borderWidth: 2,
          anchorSize: new window.naver.maps.Size(20, 20),
          anchorColor: '#fff',
          pixelOffset: new window.naver.maps.Point(0, -10)
        })
        
        // 마커 클릭 이벤트 등록 (API v3 방식)
        try {
          // API v3에서 이벤트 처리 방식 확인
          if (window.naver && window.naver.maps && window.naver.maps.Event) {
            // API v3 Event 클래스 사용
            window.naver.maps.Event.addListener(marker, 'click', () => {
              console.log('마커 클릭:', markerData.title)
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
          } else if (window.naver && window.naver.maps && window.naver.maps.event) {
            // 기존 방식 시도
            window.naver.maps.event.addListener(marker, 'click', () => {
              console.log('마커 클릭:', markerData.title)
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
          } else {
            // 대안 방식: 마커에 직접 이벤트 리스너 추가
            const markerElement = marker as any
            if (markerElement && markerElement.getElement) {
              const element = markerElement.getElement()
              if (element) {
                element.addEventListener('click', () => {
                  console.log('마커 클릭:', markerData.title)
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
              }
            }
          }
        } catch (eventError) {
          // 이벤트 등록 실패해도 마커는 표시
        }
        
        markersRef.current.push(marker)
        infowindowsRef.current.push(infowindow)
      } catch (error) {
        // 마커 생성 오류 무시 (성능 최적화)
      }
    })
  }, [hospitals, onMarkerClick])

  // 마커 업데이트 (성능 최적화)
  useEffect(() => {
    if (!mapLoaded || !window.naver || !window.naver.maps || !mapInstanceRef.current || isUpdatingMarkers) {
      return
    }
    
    // 디바운싱을 위한 타이머
    const timer = setTimeout(() => {
      let filteredHospitals = hospitals
      if (filterStage !== 'all') {
        filteredHospitals = hospitals.filter(hospital => hospital.salesStage === filterStage)
      }
      
      const markers = convertToMapMarkers(filteredHospitals)
      
      // 현재 지도 경계 가져오기
      const bounds = getMapBounds()
      
      // 테스트용 마커 추가 (마커가 없을 경우)
      if (markers.length === 0) {
        const testMarkers = [{
          id: 'test-1',
          position: { lat: 37.5665, lng: 126.9780 }, // 서울 시청
          title: '테스트 병원',
          content: '<div style="padding: 15px;"><h3>테스트 병원</h3><p>이 마커는 테스트용입니다.</p></div>',
          visitCount: 1,
          salesStage: 'A',
          department: '내과'
        }]
        createMarkers(testMarkers, bounds || undefined)
      } else {
        createMarkers(markers, bounds || undefined)
      }
    }, 200) // 200ms로 단축

    return () => {
      clearTimeout(timer)
    }
  }, [mapLoaded, hospitals, filterStage, createMarkers, getMapBounds, isUpdatingMarkers])

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
              네이버 지도 API v3 키가 설정되지 않았습니다.
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              다음 단계를 따라 새로운 네이버 지도 API v3을 설정해주세요:
            </Typography>
            <Typography variant="body2" component="div" sx={{ textAlign: 'left' }}>
              1. <a href="https://www.ncloud.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2' }}>네이버 클라우드 플랫폼</a>에서 계정 생성<br/>
              2. AI·NAVER API → Maps → Maps JavaScript API 신규 신청<br/>
              3. 애플리케이션 등록 후 Client ID 발급<br/>
              4. 웹 서비스 URL에 <code>http://localhost:3000</code> 추가<br/>
              5. 프로젝트 루트에 <code>.env.local</code> 파일 생성 후 다음 내용 추가:<br/>
              <code style={{ display: 'block', background: '#f5f5f5', padding: '8px', margin: '8px 0', borderRadius: '4px', fontSize: '12px' }}>
                NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=your_new_client_id_here
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
              네이버 지도 API v3 로딩 실패
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {mapError}
            </Typography>
            <Typography variant="body2" color="text.secondary" component="div" sx={{ textAlign: 'left' }}>
              <strong>해결 방법:</strong><br/>
              • 새로운 Maps JavaScript API 클라이언트 ID를 발급받았는지 확인하세요<br/>
              • 네이버 클라우드 플랫폼에서 애플리케이션이 등록되었는지 확인하세요<br/>
              • Maps JavaScript API가 활성화되었는지 확인하세요<br/>
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
            <MenuItem value="S">S</MenuItem>
            <MenuItem value="A">A</MenuItem>
            <MenuItem value="B">B</MenuItem>
            <MenuItem value="C">C</MenuItem>
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

      {/* 겹치는 마커 선택 메뉴 */}
      {showOverlapMenu && (
        <Box
          sx={{
            position: 'absolute',
            left: overlapMenuPosition.x,
            top: overlapMenuPosition.y,
            transform: 'translate(-50%, -100%)',
            zIndex: 2000,
            bgcolor: 'white',
            borderRadius: 2,
            p: 2,
            boxShadow: 3,
            minWidth: 250,
            maxWidth: 350,
            border: '1px solid #ddd',
            maxHeight: 300
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, pb: 1, borderBottom: '1px solid #eee' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#333' }}>
              📍 의원 목록 ({overlappingMarkers.length}개)
            </Typography>
            <Button
              size="small"
              onClick={() => setShowOverlapMenu(false)}
              sx={{ 
                minWidth: 'auto', 
                p: 0.5,
                color: '#666',
                '&:hover': { bgcolor: '#f5f5f5' }
              }}
            >
              ✕
            </Button>
          </Box>
          <Box sx={{ maxHeight: 220, overflowY: 'auto' }}>
            {overlappingMarkers.map((marker, index) => (
              <Button
                key={marker.id}
                fullWidth
                variant="text"
                size="small"
                onClick={() => {
                  // 선택된 마커의 상세 정보 표시
                  const hospital = hospitals.find(h => h.id === marker.id)
                  if (hospital && onMarkerClick) {
                    onMarkerClick(hospital)
                  }
                  setShowOverlapMenu(false)
                }}
                sx={{
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                  p: 1.5,
                  mb: 0.5,
                  borderRadius: 1,
                  border: '1px solid #f0f0f0',
                  bgcolor: '#fafafa',
                  '&:hover': {
                    bgcolor: '#e3f2fd',
                    borderColor: '#2196f3'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: '#FF6B6B',
                      flexShrink: 0
                    }}
                  />
                  <Typography variant="body2" sx={{ fontWeight: 'medium', color: '#333' }}>
                    {marker.title}
                  </Typography>
                </Box>
              </Button>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  )
} 