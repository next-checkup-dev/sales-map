'use client'

import { useState } from 'react'
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Divider,
  IconButton,
  Drawer,
  ListItemIcon,
} from '@mui/material'
import {
  Map as MapIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Assessment as AssessmentIcon,
  Menu as MenuIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Search as SearchIcon,
} from '@mui/icons-material'

export default function Home() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // 샘플 데이터
  const salesPeople = [
    {
      id: 1,
      name: '김영업',
      position: '영업사원',
      status: '활성',
      location: '서울시 강남구',
      sales: 15000000,
      lastUpdate: '2024-01-15',
    },
    {
      id: 2,
      name: '이매니저',
      position: '영업매니저',
      status: '활성',
      location: '서울시 서초구',
      sales: 25000000,
      lastUpdate: '2024-01-14',
    },
    {
      id: 3,
      name: '박대리',
      position: '영업사원',
      status: '비활성',
      location: '부산시 해운대구',
      sales: 8000000,
      lastUpdate: '2024-01-13',
    },
  ]

  const handleLogin = () => {
    setIsLoggedIn(true)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
  }

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen)
  }

  const drawerItems = [
    { text: '지도 보기', icon: <MapIcon />, href: '/' },
    { text: '영업사원 관리', icon: <PersonIcon />, href: '/salespeople' },
    { text: '영업 현황', icon: <AssessmentIcon />, href: '/analytics' },
    { text: 'Google Sheets 연동', icon: <BusinessIcon />, href: '/sheets' },
  ]

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* 헤더 */}
      <AppBar position="static">
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
            onClick={toggleDrawer}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            영업사원 지도 및 현황 관리
          </Typography>
          {!isLoggedIn ? (
            <Button color="inherit" startIcon={<LoginIcon />} onClick={handleLogin}>
              로그인
            </Button>
          ) : (
            <Button color="inherit" startIcon={<LogoutIcon />} onClick={handleLogout}>
              로그아웃
            </Button>
          )}
        </Toolbar>
      </AppBar>

      {/* 사이드바 */}
      <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer}>
        <Box sx={{ width: 250 }} role="presentation" onClick={toggleDrawer}>
          <List>
            {drawerItems.map((item) => (
              <ListItem key={item.text} component="button">
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* 메인 컨텐츠 */}
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          {/* 지도 영역 */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 600 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <MapIcon sx={{ mr: 1 }} />
                <Typography variant="h6">영업사원 위치 지도</Typography>
              </Box>
              <Box
                sx={{
                  flexGrow: 1,
                  bgcolor: 'grey.100',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 1,
                }}
              >
                <Typography variant="body1" color="text.secondary">
                  카카오맵이 여기에 표시됩니다
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* 영업사원 목록 */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 600 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PersonIcon sx={{ mr: 1 }} />
                <Typography variant="h6">영업사원 목록</Typography>
                <IconButton size="small" sx={{ ml: 'auto' }}>
                  <RefreshIcon />
                </IconButton>
              </Box>
              
              {/* 검색 */}
              <TextField
                fullWidth
                size="small"
                placeholder="영업사원 검색..."
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                sx={{ mb: 2 }}
              />

              {/* 영업사원 리스트 */}
              <List sx={{ flexGrow: 1, overflow: 'auto' }}>
                {salesPeople.map((person, index) => (
                  <Box key={person.id}>
                    <ListItem alignItems="flex-start">
                      <ListItemAvatar>
                        <Avatar>
                          <PersonIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={person.name}
                        secondary={
                          <Box>
                            <Typography component="span" variant="body2" color="text.primary">
                              {person.position} • {person.location}
                            </Typography>
                            <Box sx={{ mt: 1 }}>
                              <Chip
                                label={person.status}
                                size="small"
                                color={person.status === '활성' ? 'success' : 'default'}
                                sx={{ mr: 1 }}
                              />
                              <Typography variant="caption" color="text.secondary">
                                매출: {person.sales.toLocaleString()}원
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < salesPeople.length - 1 && <Divider variant="inset" component="li" />}
                  </Box>
                ))}
              </List>

              <Button
                variant="contained"
                startIcon={<AddIcon />}
                sx={{ mt: 2 }}
              >
                새 영업사원 추가
              </Button>
            </Paper>
          </Grid>

          {/* 통계 카드들 */}
          <Grid item xs={12}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      총 영업사원
                    </Typography>
                    <Typography variant="h4">
                      {salesPeople.length}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      활성 영업사원
                    </Typography>
                    <Typography variant="h4">
                      {salesPeople.filter(p => p.status === '활성').length}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      총 매출
                    </Typography>
                    <Typography variant="h4">
                      {salesPeople.reduce((sum, p) => sum + p.sales, 0).toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      평균 매출
                    </Typography>
                    <Typography variant="h4">
                      {Math.round(salesPeople.reduce((sum, p) => sum + p.sales, 0) / salesPeople.length).toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}
