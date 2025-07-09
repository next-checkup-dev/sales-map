'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Divider,
  SelectChangeEvent,
  List,
  ListItem,
  ListItemText,
  Paper,
  Box,
  IconButton,
} from '@mui/material'
import PhoneIcon from '@mui/icons-material/Phone'
import type { HospitalSalesData } from '@/lib/googleSheets'
import { addVisitLog, getVisitLogs, type VisitLogEntry } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'

interface HospitalSalesModalProps {
  open: boolean
  onClose: () => void
  hospitalSales: HospitalSalesData | null
  onSave: (data: HospitalSalesData | Omit<HospitalSalesData, 'id'>) => Promise<{ success: boolean; message?: string; error?: string }>
  mode: 'add' | 'edit'
}

export default function HospitalSalesModal({
  open,
  onClose,
  hospitalSales,
  onSave,
  mode
}: HospitalSalesModalProps) {
  const [formData, setFormData] = useState<Omit<HospitalSalesData, 'id'>>({
    department: '',
    hospitalName: '',
    clientCompany: '',
    address: '',
    lat: undefined,
    lng: undefined,
    phone: '',
    fax: '',
    directorName: '',
    contactPerson: '',
    contactPhone: '',
    salesStage: '',
    tendency: '',
    nextStep: '',
    needs: '',
    visitCount: 0,
    progress: '',
    firstVisitDate: '',
    lastVisitDate: '',
    salesPerson: '',
    visit1: '',
    visit1Content: '',
    visit2: '',
    visit2Content: '',
    visit3: '',
    visit3Content: '',
    visit4: '',
    visit4Content: '',
    visit5: '',
    visit5Content: '',
    visit6: '',
    visit6Content: '',
    lastUpdate: new Date().toISOString().split('T')[0],
  })
  const [loading, setLoading] = useState(false)
  const [visitLogs, setVisitLogs] = useState<VisitLogEntry[]>([])
  const [showLogs, setShowLogs] = useState(false)
  const [needsRecommendations, setNeedsRecommendations] = useState<string[]>([])
  const [progressRecommendations, setProgressRecommendations] = useState<string[]>([])
  const { user } = useAuth()



  // 방문 기록 수정 시 로그 추가
  const handleVisitContentChange = async (field: string, oldValue: string, newValue: string) => {
    if (oldValue !== newValue && hospitalSales?.id && user?.email) {
      try {
        const visitNumber = parseInt(field.replace('visit', '').replace('Content', ''))
        const result = await addVisitLog({
          hospitalId: hospitalSales.id,
          hospitalName: hospitalSales.hospitalName,
          visitNumber,
          oldContent: oldValue,
          newContent: newValue,
          modifiedBy: user.email,
          field
        })
        
        if (result.success) {
          console.log('방문 로그 저장 성공')
        } else {
          console.warn('방문 로그 저장 실패:', result.error || result.warning)
        }
      } catch (error) {
        console.error('방문 로그 저장 오류:', error)
      }
    }
  }

  // 추천 내용 로드
  const loadRecommendations = async (field: 'needs' | 'progress', value: string) => {
    if (value.length > 2) {
      try {
        const response = await fetch(`/api/salespeople?field=${field}&value=${encodeURIComponent(value)}`)
        const result = await response.json()
        
        if (result.success && result.recommendations) {
          if (field === 'needs') {
            setNeedsRecommendations(result.recommendations)
          } else {
            setProgressRecommendations(result.recommendations)
          }
        }
      } catch (error) {
        console.error('추천 데이터 로드 실패:', error)
      }
    } else {
      if (field === 'needs') {
        setNeedsRecommendations([])
      } else {
        setProgressRecommendations([])
      }
    }
  }

  // 전화번호 형식 정리
  const formatPhoneNumber = (phone: string) => {
    // 숫자만 추출
    const numbers = phone.replace(/\D/g, '')
    
    // 한국 전화번호 형식으로 변환
    if (numbers.length === 11) {
      return numbers.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')
    } else if (numbers.length === 10) {
      return numbers.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')
    }
    
    return phone
  }

  useEffect(() => {
    if (hospitalSales && mode === 'edit') {
      setFormData({
        department: hospitalSales.department || '',
        hospitalName: hospitalSales.hospitalName || '',
        clientCompany: hospitalSales.clientCompany || '',
        address: hospitalSales.address || '',
        lat: hospitalSales.lat,
        lng: hospitalSales.lng,
        phone: hospitalSales.phone || '',
        fax: hospitalSales.fax || '',
        directorName: hospitalSales.directorName || '',
        contactPerson: hospitalSales.contactPerson || '',
        contactPhone: hospitalSales.contactPhone || '',
        salesStage: hospitalSales.salesStage || '',
        tendency: hospitalSales.tendency || '',
        nextStep: hospitalSales.nextStep || '',
        needs: hospitalSales.needs || '',
        visitCount: hospitalSales.visitCount || 0,
        progress: hospitalSales.progress || '',
        firstVisitDate: hospitalSales.firstVisitDate || '',
        lastVisitDate: hospitalSales.lastVisitDate || '',
        salesPerson: hospitalSales.salesPerson || '',
        visit1: hospitalSales.visit1 || '',
        visit1Content: hospitalSales.visit1Content || '',
        visit2: hospitalSales.visit2 || '',
        visit2Content: hospitalSales.visit2Content || '',
        visit3: hospitalSales.visit3 || '',
        visit3Content: hospitalSales.visit3Content || '',
        visit4: hospitalSales.visit4 || '',
        visit4Content: hospitalSales.visit4Content || '',
        visit5: hospitalSales.visit5 || '',
        visit5Content: hospitalSales.visit5Content || '',
        visit6: hospitalSales.visit6 || '',
        visit6Content: hospitalSales.visit6Content || '',
        lastUpdate: hospitalSales.lastUpdate || '',
      })
      // 방문 로그 로드
      if (hospitalSales.id) {
        getVisitLogs(hospitalSales.id).then(result => {
          if (result.success) {
            setVisitLogs(result.logs)
          } else {
            console.warn('방문 로그 로드 실패:', result.error || result.warning)
            setVisitLogs([])
          }
        })
      }
    } else {
      setFormData({
        department: '',
        hospitalName: '',
        clientCompany: '',
        address: '',
        lat: undefined,
        lng: undefined,
        phone: '',
        fax: '',
        directorName: '',
        contactPerson: '',
        contactPhone: '',
        salesStage: '',
        tendency: '',
        nextStep: '',
        needs: '',
        visitCount: 0,
        progress: '',
        firstVisitDate: '',
        lastVisitDate: '',
        salesPerson: user?.email || '',
        visit1: '',
        visit1Content: '',
        visit2: '',
        visit2Content: '',
        visit3: '',
        visit3Content: '',
        visit4: '',
        visit4Content: '',
        visit5: '',
        visit5Content: '',
        visit6: '',
        visit6Content: '',
        lastUpdate: new Date().toISOString().split('T')[0],
      })
      setVisitLogs([])
    }
  }, [hospitalSales, mode, open, user?.email])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // 수정 모드일 때 기존 데이터와 병합
      let dataToSave = formData
      if (mode === 'edit' && hospitalSales) {
        dataToSave = {
          ...hospitalSales, // 기존 데이터를 먼저 스프레드
          ...formData, // 새 데이터로 덮어쓰기
          id: hospitalSales.id, // ID는 항상 기존 것 유지
        } as HospitalSalesData
        
        console.log('수정 모드 데이터 전송:', {
          id: (dataToSave as HospitalSalesData).id,
          hospitalName: dataToSave.hospitalName,
          phone: dataToSave.phone,
          mode: mode
        })
      }

      const result = await onSave(dataToSave)
      if (result.success) {
        onClose()
      } else {
        alert(result.error)
      }
    } catch (error) {
      console.error('저장 오류:', error)
      alert('저장 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof Omit<HospitalSalesData, 'id'>) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>
  ) => {
    let newValue = e.target.value
    const oldValue = formData[field] as string
    
    // 전화번호 형식 자동 변환
    if (field === 'phone' || field === 'contactPhone') {
      newValue = formatPhoneNumber(newValue)
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: newValue
    }))

    // 방문 기록 내용 변경 시 로그 추가
    if (field.includes('Content') && mode === 'edit') {
      handleVisitContentChange(field, oldValue, newValue)
    }

    // 추천 내용 로드
    if (field === 'needs' || field === 'progress') {
      loadRecommendations(field, newValue)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {mode === 'add' ? '새 병원 추가' : '병원 정보 수정'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={2}>
            {/* 기본 정보 */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2 }}>기본 정보</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                진료과
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                {formData.department || '-'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                의원명
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                {formData.hospitalName || '-'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                수탁사
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                {formData.clientCompany || '-'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                전화번호
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="body1" sx={{ flex: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                  {formData.phone || '-'}
                </Typography>
                {formData.phone && (
                  <IconButton
                    size="small"
                    onClick={() => window.open(`tel:${formData.phone}`)}
                    sx={{ ml: 1 }}
                    title="전화 걸기"
                  >
                    <PhoneIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                주소
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                {formData.address || '-'}
              </Typography>
            </Grid>
            {/* 위도, 경도는 숨김 처리 */}
            <input type="hidden" value={formData.lat} />
            <input type="hidden" value={formData.lng} />
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="팩스"
                value={formData.fax}
                onChange={handleChange('fax')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="원장이름"
                value={formData.directorName}
                onChange={handleChange('directorName')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="담당자명"
                value={formData.contactPerson}
                onChange={handleChange('contactPerson')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="담당자 연락처"
                value={formData.contactPhone}
                onChange={handleChange('contactPhone')}
                placeholder="010-1234-5678"
                helperText="전화 아이콘을 클릭하면 전화가 연결됩니다"
                InputProps={{
                  endAdornment: formData.contactPhone && (
                    <IconButton
                      size="small"
                      onClick={() => window.open(`tel:${formData.contactPhone}`)}
                      sx={{ mr: -1 }}
                      title="전화 걸기"
                    >
                      <PhoneIcon fontSize="small" />
                    </IconButton>
                  )
                }}
              />
            </Grid>

            {/* 영업 현황 */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" sx={{ mb: 2 }}>영업 현황</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>세일즈 단계</InputLabel>
                <Select
                  value={formData.salesStage}
                  label="세일즈 단계"
                  onChange={handleChange('salesStage')}
                >
                  <MenuItem value="S">S</MenuItem>
                  <MenuItem value="A">A</MenuItem>
                  <MenuItem value="B">B</MenuItem>
                  <MenuItem value="C">C</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>성향</InputLabel>
                <Select
                  value={formData.tendency}
                  label="성향"
                  onChange={handleChange('tendency')}
                >
                  <MenuItem value="-2">-2</MenuItem>
                  <MenuItem value="-1">-1</MenuItem>
                  <MenuItem value="0">0</MenuItem>
                  <MenuItem value="1">1</MenuItem>
                  <MenuItem value="2">2</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Next Step"
                value={formData.nextStep}
                onChange={handleChange('nextStep')}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="과제(니즈)"
                value={formData.needs}
                onChange={handleChange('needs')}
                placeholder="간단한 니즈를 입력하세요"
                helperText="이전에 입력한 유사한 내용이 추천됩니다"
              />
              {needsRecommendations.length > 0 && (
                <Paper sx={{ mt: 1, p: 1, maxHeight: 150, overflow: 'auto' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    추천 내용:
                  </Typography>
                  {needsRecommendations.map((rec, index) => (
                    <Button
                      key={index}
                      size="small"
                      variant="outlined"
                      sx={{ mr: 1, mb: 1, textTransform: 'none' }}
                      onClick={() => setFormData(prev => ({ ...prev, needs: rec }))}
                    >
                      {rec}
                    </Button>
                  ))}
                </Paper>
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="진행상황"
                value={formData.progress}
                onChange={handleChange('progress')}
                placeholder="간단한 진행상황을 입력하세요"
                helperText="이전에 입력한 유사한 내용이 추천됩니다"
              />
              {progressRecommendations.length > 0 && (
                <Paper sx={{ mt: 1, p: 1, maxHeight: 150, overflow: 'auto' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    추천 내용:
                  </Typography>
                  {progressRecommendations.map((rec, index) => (
                    <Button
                      key={index}
                      size="small"
                      variant="outlined"
                      sx={{ mr: 1, mb: 1, textTransform: 'none' }}
                      onClick={() => setFormData(prev => ({ ...prev, progress: rec }))}
                    >
                      {rec}
                    </Button>
                  ))}
                </Paper>
              )}
            </Grid>
             <Grid item xs={12} sm={6}>
               <TextField
                 fullWidth
                 label="영업담당자 (자동등록)"
                 value={formData.salesPerson}
                 disabled
                 helperText="최초 작성자가 자동으로 등록됩니다"
               />
             </Grid>
             <Grid item xs={12} sm={6}>
               <TextField
                 fullWidth
                 label="방문횟수 (자동계산)"
                 type="number"
                 value={formData.visitCount}
                 disabled
                 helperText="방문 기록을 기반으로 자동 계산됩니다"
               />
             </Grid>

            {/* 방문 일자 */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" sx={{ mb: 2 }}>방문 일자</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="최초방문일자 (자동계산)"
                type="date"
                value={formData.firstVisitDate}
                disabled
                InputLabelProps={{ shrink: true }}
                helperText="방문 기록을 기반으로 자동 계산됩니다"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="최종방문일자 (자동계산)"
                type="date"
                value={formData.lastVisitDate}
                disabled
                InputLabelProps={{ shrink: true }}
                helperText="방문 기록을 기반으로 자동 계산됩니다"
              />
            </Grid>

            {/* 방문 기록 */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" sx={{ mb: 2 }}>방문 기록</Typography>
            </Grid>
            
            {/* 1차 방문 */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>1차 방문</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="1차 방문일"
                type="date"
                value={formData.visit1}
                onChange={handleChange('visit1')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="1차 방문 내용"
                value={formData.visit1Content}
                onChange={handleChange('visit1Content')}
                multiline
                rows={2}
              />
            </Grid>

            {/* 2차 방문 */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>2차 방문</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="2차 방문일"
                type="date"
                value={formData.visit2}
                onChange={handleChange('visit2')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="2차 방문 내용"
                value={formData.visit2Content}
                onChange={handleChange('visit2Content')}
                multiline
                rows={2}
              />
            </Grid>

            {/* 3차 방문 */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>3차 방문</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="3차 방문일"
                type="date"
                value={formData.visit3}
                onChange={handleChange('visit3')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="3차 방문 내용"
                value={formData.visit3Content}
                onChange={handleChange('visit3Content')}
                multiline
                rows={2}
              />
            </Grid>

            {/* 4차 방문 */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>4차 방문</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="4차 방문일"
                type="date"
                value={formData.visit4}
                onChange={handleChange('visit4')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="4차 방문 내용"
                value={formData.visit4Content}
                onChange={handleChange('visit4Content')}
                multiline
                rows={2}
              />
            </Grid>

            {/* 5차 방문 */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>5차 방문</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="5차 방문일"
                type="date"
                value={formData.visit5}
                onChange={handleChange('visit5')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="5차 방문 내용"
                value={formData.visit5Content}
                onChange={handleChange('visit5Content')}
                multiline
                rows={2}
              />
            </Grid>

            {/* 6차 방문 */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>6차 방문</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="6차 방문일"
                type="date"
                value={formData.visit6}
                onChange={handleChange('visit6')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="6차 방문 내용"
                value={formData.visit6Content}
                onChange={handleChange('visit6Content')}
                multiline
                rows={2}
              />
            </Grid>

            {/* 방문 기록 수정 로그 (수정 모드에서만 표시) */}
            {mode === 'edit' && (
              <>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">방문 기록 수정 로그</Typography>
                    <Button 
                      size="small" 
                      onClick={() => setShowLogs(!showLogs)}
                    >
                      {showLogs ? '숨기기' : '보기'}
                    </Button>
                  </Box>
                </Grid>
                {showLogs && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2, maxHeight: 300, overflow: 'auto' }}>
                      {visitLogs.length > 0 ? (
                        <List dense>
                          {visitLogs.map((log, index) => (
                            <ListItem key={index} divider>
                              <ListItemText
                                primary={`${log.visitNumber}차 방문 내용 수정`}
                                secondary={
                                  <>
                                    <Typography variant="body2" color="text.secondary">
                                      수정자: {log.modifiedBy}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      수정일: {log.modifiedAt.toDate().toLocaleString()}
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: 1 }}>
                                      <strong>이전 내용:</strong> {log.oldContent || '(없음)'}
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: 1 }}>
                                      <strong>새 내용:</strong> {log.newContent || '(없음)'}
                                    </Typography>
                                  </>
                                }
                              />
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Typography variant="body2" color="text.secondary" align="center">
                          수정 로그가 없습니다.
                        </Typography>
                      )}
                    </Paper>
                  </Grid>
                )}
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>취소</Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading}
          >
            {loading ? '저장 중...' : (mode === 'add' ? '추가' : '수정')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
} 