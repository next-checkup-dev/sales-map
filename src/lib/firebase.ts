import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Firebase 설정
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'dummy-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'dummy-project.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'dummy-project',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'dummy-project.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'dummy-app-id',
}

// Firebase 앱 초기화
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let app: any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let auth: any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any

try {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = getFirestore(app)
} catch (error) {
  console.warn('Firebase 초기화 실패:', error)
  // 개발 환경에서는 더미 객체 제공
  if (typeof window !== 'undefined') {
    console.warn('Firebase 설정이 필요합니다. .env.local 파일을 확인해주세요.')
  }
}

export { auth, db }
export default app 