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
  itemHeight = 80,
  containerHeight = 400,
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
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (data.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          데이터가 없습니다.
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
          <List>
            {visibleItems.map((hospital, index) => (
              <Box key={hospital.id}>
                <ListItem alignItems="flex-start" sx={{ px: 2, height: itemHeight }}>
                  <ListItemAvatar>
                    <Avatar>
                      <LocalHospitalIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="subtitle1">{hospital.hospitalName}</Typography>
                        <Chip
                          label={`방문 ${hospital.visitCount}회`}
                          size="small"
                          color={hospital.visitCount > 0 ? 'success' : 'default'}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.primary">
                          {hospital.department} • {hospital.address}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {hospital.phone} • 담당: {hospital.salesPerson}
                        </Typography>
                      </Box>
                    }
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {onEdit && (
                      <IconButton 
                        size="small" 
                        onClick={() => onEdit(hospital)}
                      >
                        <EditIcon />
                      </IconButton>
                    )}
                    {onDelete && (
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => onDelete(hospital.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Box>
                </ListItem>
                {index < visibleItems.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        </Box>
      </Box>
    </Box>
  )
} 