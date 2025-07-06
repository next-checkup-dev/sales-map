'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material'
import type { SalesPersonData } from '@/lib/googleSheets'

interface SalesPersonModalProps {
  open: boolean
  onClose: () => void
  salesPerson?: SalesPersonData | null
  onSave: (data: Omit<SalesPersonData, 'id'>) => Promise<{ success: boolean; message?: string; error?: string }>
  mode: 'add' | 'edit'
}

export default function SalesPersonModal({ 
  open, 
  onClose, 
  salesPerson, 
  onSave, 
  mode 
}: SalesPersonModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    position: '',
    status: '활성' as '활성' | '비활성',
    location: '',
    sales: 0,
    phone: '',
    latitude: '',
    longitude: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 폼 데이터 초기화
  useEffect(() => {
    if (salesPerson && mode === 'edit') {
      setFormData({
        name: salesPerson.name || '',
        email: salesPerson.email || '',
        position: salesPerson.position || '',
        status: salesPerson.status || '활성',
        location: salesPerson.location || '',
        sales: salesPerson.sales || 0,
        phone: salesPerson.phone || '',
        latitude: salesPerson.latitude?.toString() || '',
        longitude: salesPerson.longitude?.toString() || '',
      })
    } else {
      setFormData({
        name: '',
        email: '',
        position: '',
        status: '활성',
        location: '',
        sales: 0,
        phone: '',
        latitude: '',
        longitude: '',
      })
    }
  }, [salesPerson, mode, open])

  const handleSubmit = async () => {
    if (!formData.name || !formData.email) {
      setError('이름과 이메일은 필수 입력 항목입니다.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await onSave({
        name: formData.name,
        email: formData.email,
        position: formData.position,
        status: formData.status,
        location: formData.location,
        sales: formData.sales,
        phone: formData.phone,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
        lastUpdate: new Date().toISOString().split('T')[0],
      })

      if (result.success) {
        onClose()
      } else {
        setError(result.error || '저장에 실패했습니다.')
      }
    } catch {
      setError('저장 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      name: '',
      email: '',
      position: '',
      status: '활성',
      location: '',
      sales: 0,
      phone: '',
      latitude: '',
      longitude: '',
    })
    setError('')
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6" align="center">
          {mode === 'add' ? '새 영업사원 추가' : '영업사원 정보 수정'}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <TextField
            fullWidth
            label="이름 *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            disabled={loading}
          />
          
          <TextField
            fullWidth
            label="이메일 *"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            margin="normal"
            disabled={loading}
          />

          <TextField
            fullWidth
            label="직책"
            value={formData.position}
            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
            margin="normal"
            disabled={loading}
          />

          <FormControl fullWidth margin="normal" disabled={loading}>
            <InputLabel>상태</InputLabel>
            <Select
              value={formData.status}
              label="상태"
              onChange={(e) => setFormData({ ...formData, status: e.target.value as '활성' | '비활성' })}
            >
              <MenuItem value="활성">활성</MenuItem>
              <MenuItem value="비활성">비활성</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="위치"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            margin="normal"
            disabled={loading}
          />

          <TextField
            fullWidth
            label="매출"
            type="number"
            value={formData.sales}
            onChange={(e) => setFormData({ ...formData, sales: parseInt(e.target.value) || 0 })}
            margin="normal"
            disabled={loading}
          />

          <TextField
            fullWidth
            label="전화번호"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            margin="normal"
            disabled={loading}
          />

          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <TextField
              fullWidth
              label="위도"
              type="number"
              value={formData.latitude}
              onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
              disabled={loading}
            />
            <TextField
              fullWidth
              label="경도"
              type="number"
              value={formData.longitude}
              onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
              disabled={loading}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          취소
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {mode === 'add' ? '추가' : '수정'}
        </Button>
      </DialogActions>
    </Dialog>
  )
} 