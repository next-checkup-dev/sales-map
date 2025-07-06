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
} from '@mui/material'
import type { HospitalSalesData } from '@/lib/googleSheets'

interface HospitalSalesModalProps {
  open: boolean
  onClose: () => void
  hospitalSales: HospitalSalesData | null
  onSave: (data: Omit<HospitalSalesData, 'id'>) => Promise<{ success: boolean; message?: string; error?: string }>
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
    phone: '',
    salesPerson: '',
    visitCount: 0,
    firstVisitDate: '',
    lastVisitDate: '',
    response: '',
    salesStage: '',
    nextStep: '',
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
    lastUpdate: '',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (hospitalSales && mode === 'edit') {
      setFormData({
        department: hospitalSales.department || '',
        hospitalName: hospitalSales.hospitalName || '',
        clientCompany: hospitalSales.clientCompany || '',
        address: hospitalSales.address || '',
        phone: hospitalSales.phone || '',
        salesPerson: hospitalSales.salesPerson || '',
        visitCount: hospitalSales.visitCount || 0,
        firstVisitDate: hospitalSales.firstVisitDate || '',
        lastVisitDate: hospitalSales.lastVisitDate || '',
        response: hospitalSales.response || '',
        salesStage: hospitalSales.salesStage || '',
        nextStep: hospitalSales.nextStep || '',
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
    } else {
      setFormData({
        department: '',
        hospitalName: '',
        clientCompany: '',
        address: '',
        phone: '',
        salesPerson: '',
        visitCount: 0,
        firstVisitDate: '',
        lastVisitDate: '',
        response: '',
        salesStage: '',
        nextStep: '',
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
        lastUpdate: '',
      })
    }
  }, [hospitalSales, mode, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const result = await onSave(formData)
      if (result.success) {
        onClose()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof Omit<HospitalSalesData, 'id'>) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }))
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
              <TextField
                fullWidth
                label="진료과"
                value={formData.department}
                onChange={handleChange('department')}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="의원명"
                value={formData.hospitalName}
                onChange={handleChange('hospitalName')}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="수탁사"
                value={formData.clientCompany}
                onChange={handleChange('clientCompany')}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="전화번호"
                value={formData.phone}
                onChange={handleChange('phone')}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="주소"
                value={formData.address}
                onChange={handleChange('address')}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="영업담당자"
                value={formData.salesPerson}
                onChange={handleChange('salesPerson')}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="방문횟수"
                type="number"
                value={formData.visitCount}
                onChange={handleChange('visitCount')}
                required
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
                label="최초방문일자"
                type="date"
                value={formData.firstVisitDate}
                onChange={handleChange('firstVisitDate')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="최종방문일자"
                type="date"
                value={formData.lastVisitDate}
                onChange={handleChange('lastVisitDate')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* 영업 현황 */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" sx={{ mb: 2 }}>영업 현황</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="반응"
                value={formData.response}
                onChange={handleChange('response')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>세일즈 단계</InputLabel>
                <Select
                  value={formData.salesStage}
                  label="세일즈 단계"
                  onChange={handleChange('salesStage')}
                >
                  <MenuItem value="S">S (최우선)</MenuItem>
                  <MenuItem value="A">A (우선)</MenuItem>
                  <MenuItem value="B">B (일반)</MenuItem>
                  <MenuItem value="C">C (보류)</MenuItem>
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