'use client'

import { useState, useRef, useCallback } from 'react'
import {
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Box,
  Typography,
  Chip,
  IconButton,
  Divider,
  CircularProgress,
} from '@mui/material'
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocalHospital as LocalHospitalIcon,
} from '@mui/icons-material'
import type { HospitalSalesData } from '@/lib/googleSheets'

interface VirtualizedListProps {
  data: HospitalSalesData[]
  itemHeight?: number
  containerHeight?: number
  onEdit?: (item: HospitalSalesData) => void
  onDelete?: (id: string) => void
  loading?: boolean
}

export default function VirtualizedList({
  data,
  itemHeight = 100,
  containerHeight = 500,
  onEdit,
  onDelete,
  loading = false
}: VirtualizedListProps) {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // 가상화 계산
  const visibleItemCount = Math.ceil(containerHeight / itemHeight)
  const startIndex = Math.floor(scrollTop / itemHeight)
  const endIndex = Math.min(startIndex + visibleItemCount + 1, data.length)
  const visibleItems = data.slice(startIndex, endIndex)

  // 스크롤 핸들러
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop)
  }, [])

  // 스크롤 위치 조정
  const offsetY = startIndex * itemHeight

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        py: 8,
        height: containerHeight,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        bgcolor: 'background.paper'
      }}>
        <CircularProgress size={40} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          데이터를 불러오는 중...
        </Typography>
      </Box>
    )
  }

  if (data.length === 0) {
    return (
      <Box sx={{ 
        textAlign: 'center', 
        py: 8,
        height: containerHeight,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        bgcolor: 'background.paper'
      }}>
        <LocalHospitalIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
          데이터가 없습니다
        </Typography>
        <Typography variant="body2" color="text.secondary">
          검색 조건을 변경하거나 새 병원을 추가해보세요
        </Typography>
      </Box>
    )
  }

  return (
    <Box
      ref={containerRef}
      sx={{
        height: containerHeight,
        overflow: 'auto',
        position: 'relative',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
      }}
      onScroll={handleScroll}
    >
      <Box sx={{ height: data.length * itemHeight, position: 'relative' }}>
        <Box
          sx={{
            position: 'absolute',
            top: offsetY,
            left: 0,
            right: 0,
          }}
        >
          <List sx={{ p: 0 }}>
            {visibleItems.map((hospital, index) => (
              <Box key={hospital.id}>
                <ListItem 
                  alignItems="flex-start" 
                  sx={{ 
                    px: 2, 
                    py: 1.5,
                    minHeight: itemHeight,
                    '&:hover': {
                      bgcolor: 'action.hover',
                    }
                  }}
                >
                  <ListItemAvatar sx={{ minWidth: 40 }}>
                    <Avatar sx={{ width: 32, height: 32 }}>
                      <LocalHospitalIcon fontSize="small" />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography 
                          variant="subtitle1" 
                          sx={{ 
                            fontWeight: 600,
                            fontSize: '0.95rem',
                            lineHeight: 1.2
                          }}
                        >
                          {hospital.hospitalName || '병원명 없음'}
                        </Typography>
                        <Chip
                          label={`방문 ${hospital.visitCount}회`}
                          size="small"
                          color={hospital.visitCount > 0 ? 'success' : 'default'}
                          sx={{ fontSize: '0.75rem', height: 20 }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Typography 
                          variant="body2" 
                          color="text.primary"
                          sx={{ 
                            fontSize: '0.8rem',
                            lineHeight: 1.3,
                            mb: 0.5
                          }}
                        >
                          {hospital.department || '진료과 없음'} • {hospital.address || '주소 없음'}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ 
                            fontSize: '0.75rem',
                            lineHeight: 1.2,
                            mb: 0.5
                          }}
                        >
                          {hospital.phone || '전화번호 없음'} • 담당: {hospital.salesPerson || '담당자 없음'} • {hospital.salesStage || '단계 없음'}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ 
                            fontSize: '0.75rem',
                            lineHeight: 1.2
                          }}
                        >
                          {hospital.contactPerson && `담당자: ${hospital.contactPerson}`} 
                          {hospital.contactPerson && hospital.tendency && ' • '}
                          {hospital.tendency && `성향: ${hospital.tendency}`}
                        </Typography>
                      </Box>
                    }
                    sx={{ 
                      '& .MuiListItemText-primary': { mb: 0 },
                      '& .MuiListItemText-secondary': { mt: 0 }
                    }}
                  />
                  <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
                    {onEdit && (
                      <IconButton 
                        size="small" 
                        onClick={() => onEdit(hospital)}
                        sx={{ 
                          width: 32, 
                          height: 32,
                          '&:hover': { bgcolor: 'primary.light' }
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    )}
                    {onDelete && (
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => onDelete(hospital.id)}
                        sx={{ 
                          width: 32, 
                          height: 32,
                          '&:hover': { bgcolor: 'error.light' }
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </ListItem>
                {index < visibleItems.length - 1 && <Divider sx={{ mx: 2 }} />}
              </Box>
            ))}
          </List>
        </Box>
      </Box>
    </Box>
  )
} 