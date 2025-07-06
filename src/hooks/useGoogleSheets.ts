import { useState, useEffect, useCallback } from 'react'
import type { HospitalSalesData } from '@/lib/googleSheets'

export function useGoogleSheets() {
  const [hospitalSales, setHospitalSales] = useState<HospitalSalesData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetchTime, setLastFetchTime] = useState<number>(0)
  const [cacheExpiry] = useState(5 * 60 * 1000) // 5분 캐시

    // 데이터 불러오기 (캐싱 적용)
  const fetchData = useCallback(async (forceRefresh = false) => {
    const now = Date.now()
    
    // 캐시가 유효하고 강제 새로고침이 아닌 경우 스킵
    if (!forceRefresh && now - lastFetchTime < cacheExpiry && hospitalSales.length > 0) {
      console.log('캐시된 데이터 사용')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/salespeople')
      const result = await response.json()
      
      if (result.success) {
        setHospitalSales(result.data)
        setLastFetchTime(now)
      } else {
        setError(result.error || '데이터를 불러오는데 실패했습니다.')
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다.')
      console.error('데이터 불러오기 오류:', err)
    } finally {
      setLoading(false)
    }
  }, [lastFetchTime, cacheExpiry, hospitalSales.length])

  // 새로운 병원 영업 데이터 추가
  const addHospitalSales = useCallback(async (data: Omit<HospitalSalesData, 'id'>) => {
    try {
      const newData: HospitalSalesData = {
        ...data,
        id: `hospital-${Date.now()}`, // 임시 ID 생성
        lastUpdate: new Date().toISOString().split('T')[0],
      }

      const response = await fetch('/api/salespeople', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newData),
      })

      const result = await response.json()
      
      if (result.success) {
        await fetchData() // 데이터 새로고침
        return { success: true, message: result.message }
      } else {
        return { success: false, error: result.error }
      }
    } catch (err) {
      console.error('병원 영업 데이터 추가 오류:', err)
      return { success: false, error: '병원 영업 데이터 추가에 실패했습니다.' }
    }
  }, [fetchData])

  // 병원 영업 데이터 업데이트
  const updateHospitalSales = useCallback(async (data: HospitalSalesData) => {
    try {
      const updatedData: HospitalSalesData = {
        ...data,
        lastUpdate: new Date().toISOString().split('T')[0],
      }

      const response = await fetch('/api/salespeople', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      })

      const result = await response.json()
      
      if (result.success) {
        await fetchData() // 데이터 새로고침
        return { success: true, message: result.message }
      } else {
        return { success: false, error: result.error }
      }
    } catch (err) {
      console.error('병원 영업 데이터 업데이트 오류:', err)
      return { success: false, error: '병원 영업 데이터 업데이트에 실패했습니다.' }
    }
  }, [fetchData])

  // 병원 영업 데이터 삭제
  const deleteHospitalSales = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/salespeople?id=${id}`, {
        method: 'DELETE',
      })

      const result = await response.json()
      
      if (result.success) {
        await fetchData() // 데이터 새로고침
        return { success: true, message: result.message }
      } else {
        return { success: false, error: result.error }
      }
    } catch (err) {
      console.error('병원 영업 데이터 삭제 오류:', err)
      return { success: false, error: '병원 영업 데이터 삭제에 실패했습니다.' }
    }
  }, [fetchData])

  // 초기 데이터 로드 (지연 로딩)
  useEffect(() => {
    // 컴포넌트 마운트 시 즉시 로딩하지 않고 필요할 때 로딩
    const timer = setTimeout(() => {
      fetchData()
    }, 100) // 100ms 지연

    return () => clearTimeout(timer)
  }, [fetchData])

  return {
    hospitalSales,
    loading,
    error,
    fetchData,
    addHospitalSales,
    updateHospitalSales,
    deleteHospitalSales,
  }
} 