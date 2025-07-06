import { useState, useEffect, useCallback } from 'react'
import type { SalesPersonData } from '@/lib/googleSheets'

export function useGoogleSheets() {
  const [salesPeople, setSalesPeople] = useState<SalesPersonData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 데이터 불러오기
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/salespeople')
      const result = await response.json()
      
      if (result.success) {
        setSalesPeople(result.data)
      } else {
        setError(result.error || '데이터를 불러오는데 실패했습니다.')
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다.')
      console.error('데이터 불러오기 오류:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // 새로운 영업사원 추가
  const addSalesPerson = useCallback(async (data: Omit<SalesPersonData, 'id'>) => {
    try {
      const newData: SalesPersonData = {
        ...data,
        id: `user-${Date.now()}`, // 임시 ID 생성
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
      console.error('영업사원 추가 오류:', err)
      return { success: false, error: '영업사원 추가에 실패했습니다.' }
    }
  }, [fetchData])

  // 영업사원 정보 업데이트
  const updateSalesPerson = useCallback(async (data: SalesPersonData) => {
    try {
      const updatedData: SalesPersonData = {
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
      console.error('영업사원 업데이트 오류:', err)
      return { success: false, error: '영업사원 업데이트에 실패했습니다.' }
    }
  }, [fetchData])

  // 영업사원 삭제
  const deleteSalesPerson = useCallback(async (id: string) => {
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
      console.error('영업사원 삭제 오류:', err)
      return { success: false, error: '영업사원 삭제에 실패했습니다.' }
    }
  }, [fetchData])

  // 초기 데이터 로드
  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    salesPeople,
    loading,
    error,
    fetchData,
    addSalesPerson,
    updateSalesPerson,
    deleteSalesPerson,
  }
} 