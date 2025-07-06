import { useState, useEffect } from 'react'
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth'
import { auth } from '@/lib/firebase'

export interface SalesPerson {
  id: string
  name: string
  email: string
  position: string
  status: '활성' | '비활성'
  location: string
  sales: number
  lastUpdate: string
  phone: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // 로그인 함수
  const login = async (email: string, password: string) => {
    try {
      if (!auth) {
        // Firebase가 설정되지 않은 경우 더미 로그인
        if (email === 'kim@example.com' && password === '1234') {
          const dummyUser = { email: 'kim@example.com', uid: 'kim-user' } as User
          setUser(dummyUser)
          return { success: true, user: dummyUser }
        } else if (email === 'kwon@example.com' && password === '1234') {
          const dummyUser = { email: 'kwon@example.com', uid: 'kwon-user' } as User
          setUser(dummyUser)
          return { success: true, user: dummyUser }
        } else {
          return { success: false, error: '이메일 또는 비밀번호가 잘못되었습니다.' }
        }
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      return { success: true, user: userCredential.user }
    } catch (error: unknown) {
      const firebaseError = error as { code?: string }
      return { 
        success: false, 
        error: firebaseError.code === 'auth/user-not-found' ? '사용자를 찾을 수 없습니다.' :
               firebaseError.code === 'auth/wrong-password' ? '비밀번호가 잘못되었습니다.' :
               '로그인에 실패했습니다.' 
      }
    }
  }

  // 로그아웃 함수
  const logout = async () => {
    try {
      if (!auth) {
        // Firebase가 설정되지 않은 경우 더미 로그아웃
        setUser(null)
        return { success: true }
      }

      await signOut(auth)
      return { success: true }
    } catch {
      return { success: false, error: '로그아웃에 실패했습니다.' }
    }
  }

  // 인증 상태 변경 감지
  useEffect(() => {
    if (!auth) {
      // Firebase가 설정되지 않은 경우 로딩 완료
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return {
    user,
    loading,
    login,
    logout,
  }
} 