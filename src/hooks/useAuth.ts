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
      // Firebase가 설정되지 않은 경우 더미 로그인
      if (!auth) {
        console.log('Firebase가 설정되지 않았습니다. 더미 로그인을 시도합니다.')
        
        if (email === 'kim@example.com' && password === '1234') {
          const dummyUser = { 
            email: 'kim@example.com', 
            uid: 'kim-user',
            displayName: '김영업',
            photoURL: null
          } as User
          setUser(dummyUser)
          return { success: true, user: dummyUser }
        } else if (email === 'kwon@example.com' && password === '1234') {
          const dummyUser = { 
            email: 'kwon@example.com', 
            uid: 'kwon-user',
            displayName: '권영업',
            photoURL: null
          } as User
          setUser(dummyUser)
          return { success: true, user: dummyUser }
        } else {
          return { success: false, error: '이메일 또는 비밀번호가 잘못되었습니다.' }
        }
      }

      // Firebase가 설정된 경우 실제 Firebase 인증 시도
      console.log('Firebase 인증을 시도합니다.')
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      return { success: true, user: userCredential.user }
    } catch (error: unknown) {
      console.error('Firebase 로그인 오류:', error)
      const firebaseError = error as { code?: string }
      
      // Firebase 오류 코드에 따른 메시지
      let errorMessage = '로그인에 실패했습니다.'
      if (firebaseError.code === 'auth/user-not-found') {
        errorMessage = '사용자를 찾을 수 없습니다.'
      } else if (firebaseError.code === 'auth/wrong-password') {
        errorMessage = '비밀번호가 잘못되었습니다.'
      } else if (firebaseError.code === 'auth/invalid-email') {
        errorMessage = '유효하지 않은 이메일 형식입니다.'
      } else if (firebaseError.code === 'auth/too-many-requests') {
        errorMessage = '너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.'
      } else if (firebaseError.code === 'auth/network-request-failed') {
        errorMessage = '네트워크 연결을 확인해주세요.'
      } else if (firebaseError.code === 'auth/invalid-api-key') {
        errorMessage = 'Firebase API 키가 유효하지 않습니다. 관리자에게 문의하세요.'
      }
      
      return { success: false, error: errorMessage }
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