import { NextResponse } from 'next/server'
import { google } from 'googleapis'

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets']
const SPREADSHEET_ID = '12pcRCN5bqqupjtVi06O3iW6VG8Q1Xr9qWV51ORUMyIA'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    console.log('Google Sheets 연결 테스트 시작...')
    
    // 키 파일 경로 확인
    const path = require('path')
    const fs = require('fs')
    const keyFilePath = path.join(process.cwd(), 'google-service-account-key.json')
    
    if (!fs.existsSync(keyFilePath)) {
      return NextResponse.json({
        success: false,
        error: 'Google Sheets API 키 파일을 찾을 수 없습니다.',
        keyFilePath
      })
    }
    
    // 키 파일 내용 확인
    const keyContent = JSON.parse(fs.readFileSync(keyFilePath, 'utf8'))
    const clientEmail = keyContent.client_email
    
    console.log('서비스 계정 이메일:', clientEmail)
    
    // Google Sheets 클라이언트 생성
    const auth = new google.auth.GoogleAuth({
      scopes: SCOPES,
      keyFile: keyFilePath,
    })
    
    const sheets = google.sheets({ version: 'v4', auth })
    
    // 스프레드시트 메타데이터 조회
    console.log('스프레드시트 메타데이터 조회 중...')
    const metadata = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
      ranges: [],
      includeGridData: false,
    })
    
    console.log('스프레드시트 접근 성공!')
    
    return NextResponse.json({
      success: true,
      message: 'Google Sheets 연결이 성공했습니다!',
      data: {
        spreadsheetTitle: metadata.data.properties?.title,
        spreadsheetId: SPREADSHEET_ID,
        clientEmail: clientEmail,
        sheets: metadata.data.sheets?.map((sheet: any) => ({
          title: sheet.properties?.title,
          sheetId: sheet.properties?.sheetId
        }))
      }
    })
    
  } catch (error) {
    console.error('Google Sheets 연결 테스트 실패:', error)
    
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
    
    return NextResponse.json({
      success: false,
      error: 'Google Sheets 연결에 실패했습니다.',
      details: {
        message: errorMessage,
        suggestion: 'Google Sheets 문서에 서비스 계정 이메일을 편집자로 추가해주세요.',
        clientEmail: 'dev-773@rich-window-465113-k7.iam.gserviceaccount.com'
      }
    }, { status: 500 })
  }
} 