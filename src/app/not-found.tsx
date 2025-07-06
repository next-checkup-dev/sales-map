import { Box, Typography, Button } from '@mui/material'
import Link from 'next/link'

export default function NotFound() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        p: 3,
      }}
    >
      <Typography variant="h4" sx={{ mb: 2 }}>
        404 - 페이지를 찾을 수 없습니다
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
        요청하신 페이지가 존재하지 않습니다.
      </Typography>
      <Button component={Link} href="/" variant="contained">
        홈으로 돌아가기
      </Button>
    </Box>
  )
} 