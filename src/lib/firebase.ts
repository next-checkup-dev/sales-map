import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore, collection, addDoc, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore'

// 방문 기록 수정 로그 타입
export interface VisitLogEntry {
  hospitalId: string
  hospitalName: string
  visitNumber: number
  oldContent: string
  newContent: string
  modifiedBy: string
  modifiedAt: Timestamp
  field: string // 'visit1Content', 'visit2Content' 등
}

// Firebase 설정
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
}

// Firebase 앱 초기화
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let app: any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let auth: any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any

// Firebase 설정이 완전한지 확인
const isFirebaseConfigured = firebaseConfig.apiKey && 
  firebaseConfig.authDomain && 
  firebaseConfig.projectId && 
  firebaseConfig.storageBucket && 
  firebaseConfig.messagingSenderId && 
  firebaseConfig.appId

try {
  if (isFirebaseConfigured && firebaseConfig.apiKey && firebaseConfig.apiKey.trim() !== '') {
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)
    db = getFirestore(app)
    console.log('Firebase 초기화 성공')
  } else {
    console.warn('Firebase 설정이 불완전합니다. 더미 설정을 사용합니다.')
    // 더미 객체로 초기화
    auth = null
    db = null
  }
} catch (error) {
  console.warn('Firebase 초기화 실패:', error)
  // 더미 객체로 초기화
  auth = null
  db = null
}

// 방문 기록 수정 로그 추가 함수
export const addVisitLog = async (logEntry: Omit<VisitLogEntry, 'modifiedAt'>) => {
  try {
    if (!db) {
      console.warn('Firebase가 초기화되지 않았습니다. 방문 로그는 저장되지 않습니다.')
      return { success: true, warning: 'Firebase 미설정으로 로그가 저장되지 않습니다.' }
    }

    const logData = {
      ...logEntry,
      modifiedAt: Timestamp.now()
    }

    await addDoc(collection(db, 'visitLogs'), logData)
    return { success: true }
  } catch (error) {
    console.error('방문 로그 추가 실패:', error)
    return { success: false, error: '로그 저장 실패' }
  }
}

// 병원별 방문 로그 조회 함수
export const getVisitLogs = async (hospitalId: string) => {
  try {
    if (!db) {
      console.warn('Firebase가 초기화되지 않았습니다. 빈 로그를 반환합니다.')
      return { success: true, logs: [], warning: 'Firebase 미설정으로 로그를 불러올 수 없습니다.' }
    }

    const q = query(
      collection(db, 'visitLogs'),
      where('hospitalId', '==', hospitalId),
      orderBy('modifiedAt', 'desc')
    )

    const querySnapshot = await getDocs(q)
    const logs: VisitLogEntry[] = []
    
    querySnapshot.forEach((doc) => {
      logs.push(doc.data() as VisitLogEntry)
    })

    return { success: true, logs }
  } catch (error) {
    console.error('방문 로그 조회 실패:', error)
    return { success: false, error: '로그 조회 실패', logs: [] }
  }
}

export { auth, db }
export default app 