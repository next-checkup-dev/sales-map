'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
} from '@mui/material'
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  Storage as StorageIcon,
  LocalHospital as LocalHospitalIcon,
} from '@mui/icons-material'
import type { HospitalSalesData } from '@/lib/googleSheets'

interface ConnectionTestResult {
  success: boolean
  message: string
  data?: {
    totalRecords: number
    responseTime: string
    sampleData: HospitalSalesData[]
    connectionStatus: string
    timestamp: string
    validation: {
      hasData: boolean
      validRecords: number
      invalidRecords: number
      missingFields: string[]
      dataQuality: {
        hasDepartment: number
        hasHospitalName: number
        hasClientCompany: number
        hasAddress: number
        hasPhone: number
        hasSalesPerson: number
        hasVisitCount: number
        hasSalesStage: number
      }
    }
    dataSummary: {
      totalFields: number
      filledFields: number
      completionRate: number
    }
  }
  details?: {
    message: string
    timestamp: string
    connectionStatus: string
  }
}

interface ConnectionTestModalProps {
  open: boolean
  onClose: () => void
  onTest: () => Promise<ConnectionTestResult>
}

export default function ConnectionTestModal({ 
  open, 
  onClose, 
  onTest 
}: ConnectionTestModalProps) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ConnectionTestResult | null>(null)

  const handleTest = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const testResult = await onTest()
      setResult(testResult)
    } catch (error) {
      setResult({
        success: false,
        message: '테스트 중 오류가 발생했습니다.',
        details: {
          message: error instanceof Error ? error.message : '알 수 없는 오류',
          timestamp: new Date().toISOString(),
          connectionStatus: 'failed'
        }
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setResult(null)
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6" align="center">
          Google Sheets 연동 테스트
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {!result && !loading && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <StorageIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                Google Sheets 연동 상태를 확인합니다
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                연결, 데이터 읽기, 응답 시간을 테스트합니다
              </Typography>
            </Box>
          )}

          {loading && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress size={60} sx={{ mb: 2 }} />
              <Typography variant="body1">
                Google Sheets에 연결 중...
              </Typography>
            </Box>
          )}

          {result && (
            <Box>
              <Alert 
                severity={result.success ? 'success' : 'error'} 
                sx={{ mb: 3 }}
                icon={result.success ? <CheckCircleIcon /> : <ErrorIcon />}
              >
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  {result.message}
                </Typography>
              </Alert>

              {result.success && result.data && (
                <Box>
                                     {/* 연결 상태 */}
                   <Box sx={{ mb: 3 }}>
                     <Typography variant="h6" sx={{ mb: 2 }}>
                       연결 상태
                     </Typography>
                     <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                       <Chip
                         label={`상태: ${result.data.connectionStatus}`}
                         color="success"
                         icon={<CheckCircleIcon />}
                       />
                       <Chip
                         label={`응답시간: ${result.data.responseTime}`}
                         color="primary"
                         icon={<ScheduleIcon />}
                       />
                       <Chip
                         label={`총 레코드: ${result.data.totalRecords}개`}
                         color="info"
                         icon={<StorageIcon />}
                       />
                     </Box>
                   </Box>

                   {/* 데이터 검증 결과 */}
                   <Box sx={{ mb: 3 }}>
                     <Typography variant="h6" sx={{ mb: 2 }}>
                       데이터 검증 결과
                     </Typography>
                     <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                       <Chip
                         label={`유효 레코드: ${result.data.validation.validRecords}개`}
                         color={result.data.validation.validRecords > 0 ? 'success' : 'error'}
                       />
                       <Chip
                         label={`무효 레코드: ${result.data.validation.invalidRecords}개`}
                         color={result.data.validation.invalidRecords > 0 ? 'error' : 'default'}
                       />
                       <Chip
                         label={`완성도: ${result.data.dataSummary.completionRate}%`}
                         color={result.data.dataSummary.completionRate >= 80 ? 'success' : 
                               result.data.dataSummary.completionRate >= 50 ? 'warning' : 'error'}
                       />
                     </Box>
                     
                     {/* 데이터 품질 상세 */}
                     <Box sx={{ mb: 2 }}>
                       <Typography variant="subtitle2" sx={{ mb: 1 }}>
                         필드별 완성도:
                       </Typography>
                       <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                           <Typography variant="body2">진료과</Typography>
                           <Chip 
                             label={`${result.data.validation.dataQuality.hasDepartment}/${result.data.totalRecords}`}
                             size="small"
                             color={result.data.validation.dataQuality.hasDepartment === result.data.totalRecords ? 'success' : 'warning'}
                           />
                         </Box>
                         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                           <Typography variant="body2">의원명</Typography>
                           <Chip 
                             label={`${result.data.validation.dataQuality.hasHospitalName}/${result.data.totalRecords}`}
                             size="small"
                             color={result.data.validation.dataQuality.hasHospitalName === result.data.totalRecords ? 'success' : 'warning'}
                           />
                         </Box>
                         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                           <Typography variant="body2">수탁사</Typography>
                           <Chip 
                             label={`${result.data.validation.dataQuality.hasClientCompany}/${result.data.totalRecords}`}
                             size="small"
                             color={result.data.validation.dataQuality.hasClientCompany === result.data.totalRecords ? 'success' : 'warning'}
                           />
                         </Box>
                         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                           <Typography variant="body2">주소</Typography>
                           <Chip 
                             label={`${result.data.validation.dataQuality.hasAddress}/${result.data.totalRecords}`}
                             size="small"
                             color={result.data.validation.dataQuality.hasAddress === result.data.totalRecords ? 'success' : 'warning'}
                           />
                         </Box>
                         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                           <Typography variant="body2">전화번호</Typography>
                           <Chip 
                             label={`${result.data.validation.dataQuality.hasPhone}/${result.data.totalRecords}`}
                             size="small"
                             color={result.data.validation.dataQuality.hasPhone === result.data.totalRecords ? 'success' : 'warning'}
                           />
                         </Box>
                         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                           <Typography variant="body2">영업담당자</Typography>
                           <Chip 
                             label={`${result.data.validation.dataQuality.hasSalesPerson}/${result.data.totalRecords}`}
                             size="small"
                             color={result.data.validation.dataQuality.hasSalesPerson === result.data.totalRecords ? 'success' : 'warning'}
                           />
                         </Box>
                       </Box>
                     </Box>

                     {/* 누락된 필드 */}
                     {result.data.validation.missingFields.length > 0 && (
                       <Alert severity="warning" sx={{ mt: 2 }}>
                         <Typography variant="body2">
                           누락된 필드: {result.data.validation.missingFields.join(', ')}
                         </Typography>
                       </Alert>
                     )}
                   </Box>

                                                        {/* 실제 데이터 샘플 */}
                   {result.data?.sampleData && result.data.sampleData.length > 0 && (
                     <Box>
                       <Typography variant="h6" sx={{ mb: 2 }}>
                         실제 Google Sheets 데이터 ({result.data?.sampleData.length}개)
                       </Typography>
                      <List>
                        {result.data?.sampleData?.map((hospital, index) => (
                          <Box key={hospital.id || index}>
                            <ListItem alignItems="flex-start">
                              <ListItemAvatar>
                                <Avatar>
                                  <LocalHospitalIcon />
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={hospital.hospitalName || '병원명 없음'}
                                secondary={
                                  <Box>
                                    <Typography variant="body2" color="text.primary">
                                      {hospital.department || '진료과 없음'} • {hospital.address || '주소 없음'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      {hospital.phone || '전화번호 없음'} • 담당: {hospital.salesPerson || '담당자 없음'}
                                    </Typography>
                                    <Chip
                                      label={`방문 ${hospital.visitCount}회`}
                                      size="small"
                                      color={hospital.visitCount > 0 ? 'success' : 'default'}
                                      sx={{ mt: 0.5 }}
                                    />
                                  </Box>
                                }
                              />
                            </ListItem>
                            {index < (result.data?.sampleData?.length || 0) - 1 && <Divider />}
                          </Box>
                        ))}
                      </List>
                    </Box>
                  )}

                  {/* 타임스탬프 */}
                  <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      테스트 시간: {new Date(result.data.timestamp).toLocaleString('ko-KR')}
                    </Typography>
                  </Box>
                </Box>
              )}

              {!result.success && result.details && (
                <Box>
                  <Typography variant="h6" sx={{ mb: 2, color: 'error.main' }}>
                    오류 상세 정보
                  </Typography>
                  <Box sx={{ p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
                    <Typography variant="body2" color="error.contrastText">
                      {result.details.message}
                    </Typography>
                    <Typography variant="body2" color="error.contrastText" sx={{ mt: 1 }}>
                      시간: {new Date(result.details.timestamp).toLocaleString('ko-KR')}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose}>
          닫기
        </Button>
        <Button 
          onClick={handleTest} 
          variant="contained" 
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {result ? '다시 테스트' : '테스트 시작'}
        </Button>
      </DialogActions>
    </Dialog>
  )
} 