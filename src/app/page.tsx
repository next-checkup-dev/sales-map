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
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Divider,
  IconButton,
  BottomNavigation,
  BottomNavigationAction,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  ListItemIcon,
} from '@mui/material'
import {
  Map as MapIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Home as HomeIcon,
  LocationOn as LocationIcon,
  People as PeopleIcon,
  BarChart as ChartIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material'

export default function Home() {
  const [currentTab, setCurrentTab] = useState(0)
  const [isLoggedIn] = useState(false)

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
      phone: '010-1234-5678',
    },
    {
      id: 2,
      name: '이매니저',
      position: '영업매니저',
      status: '활성',
      location: '서울시 서초구',
      sales: 25000000,
      lastUpdate: '2024-01-14',
      phone: '010-2345-6789',
    },
    {
      id: 3,
      name: '박대리',
      position: '영업사원',
      status: '비활성',
      location: '부산시 해운대구',
      sales: 8000000,
      lastUpdate: '2024-01-13',
      phone: '010-3456-7890',
    },
  ]



  const speedDialActions = [
    { icon: <AddIcon />, name: '새 영업사원', action: () => console.log('새 영업사원') },
    { icon: <RefreshIcon />, name: '데이터 새로고침', action: () => console.log('새로고침') },
    { icon: <NotificationsIcon />, name: '알림', action: () => console.log('알림') },
  ]

  const renderHomeTab = () => (
    <Box sx={{ pb: 7 }}>
      {/* 통계 카드들 */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6}>
          <Card sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h4" color="primary">
              {salesPeople.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              총 영업사원
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={6}>
          <Card sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h4" color="success.main">
              {salesPeople.filter(p => p.status === '활성').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              활성 사원
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={6}>
          <Card sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h6" color="primary">
              {Math.round(salesPeople.reduce((sum, p) => sum + p.sales, 0) / 1000000)}M
            </Typography>
            <Typography variant="body2" color="text.secondary">
              총 매출
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={6}>
          <Card sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h6" color="secondary">
              {Math.round(salesPeople.reduce((sum, p) => sum + p.sales, 0) / salesPeople.length / 1000000)}M
            </Typography>
            <Typography variant="body2" color="text.secondary">
              평균 매출
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* 최근 활동 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            최근 활동
          </Typography>
          <List>
            {salesPeople.slice(0, 3).map((person, index) => (
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
                        <Typography variant="body2" color="text.primary">
                          {person.position} • {person.location}
                        </Typography>
                        <Chip
                          label={person.status}
                          size="small"
                          color={person.status === '활성' ? 'success' : 'default'}
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                    }
                  />
                </ListItem>
                {index < 2 && <Divider variant="inset" component="li" />}
              </Box>
            ))}
          </List>
        </CardContent>
      </Card>
    </Box>
  )

  const renderMapTab = () => (
    <Box sx={{ pb: 7, height: 'calc(100vh - 120px)' }}>
      <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6">영업사원 위치</Typography>
        </Box>
        <Box
          sx={{
            flexGrow: 1,
            bgcolor: 'grey.100',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <LocationIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              카카오맵이 여기에 표시됩니다
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  )

  const renderSalesPeopleTab = () => (
    <Box sx={{ pb: 7 }}>
      {/* 검색 */}
      <Box sx={{ p: 2, pb: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="영업사원 검색..."
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
        />
      </Box>

      {/* 영업사원 리스트 */}
      <List>
        {salesPeople.map((person, index) => (
          <Box key={person.id}>
            <ListItem alignItems="flex-start" sx={{ px: 2 }}>
              <ListItemAvatar>
                <Avatar>
                  <PersonIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1">{person.name}</Typography>
                    <Chip
                      label={person.status}
                      size="small"
                      color={person.status === '활성' ? 'success' : 'default'}
                    />
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" color="text.primary">
                      {person.position} • {person.location}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {person.phone}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      매출: {person.sales.toLocaleString()}원
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
            {index < salesPeople.length - 1 && <Divider />}
          </Box>
        ))}
      </List>
    </Box>
  )

  const renderAnalyticsTab = () => (
    <Box sx={{ pb: 7 }}>
      <Card sx={{ m: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            영업 현황
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {salesPeople.length}
                </Typography>
                <Typography variant="body2">총 영업사원</Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {salesPeople.filter(p => p.status === '활성').length}
                </Typography>
                <Typography variant="body2">활성 사원</Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ m: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            매출 현황
          </Typography>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h3" color="primary">
              {Math.round(salesPeople.reduce((sum, p) => sum + p.sales, 0) / 1000000)}M
            </Typography>
            <Typography variant="body2" color="text.secondary">
              총 매출
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )

  const renderSettingsTab = () => (
    <Box sx={{ pb: 7 }}>
      <List>
        <ListItem>
          <ListItemIcon>
            <BusinessIcon />
          </ListItemIcon>
          <ListItemText primary="Google Sheets 연동" secondary="데이터 동기화 설정" />
        </ListItem>
        <Divider />
        <ListItem>
          <ListItemIcon>
            <NotificationsIcon />
          </ListItemIcon>
          <ListItemText primary="알림 설정" secondary="푸시 알림 관리" />
        </ListItem>
        <Divider />
        <ListItem>
          <ListItemIcon>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText primary="일반 설정" secondary="앱 설정 관리" />
        </ListItem>
        <Divider />
        <ListItem>
          <ListItemIcon>
            {isLoggedIn ? <LogoutIcon /> : <LoginIcon />}
          </ListItemIcon>
          <ListItemText 
            primary={isLoggedIn ? "로그아웃" : "로그인"} 
            secondary={isLoggedIn ? "계정에서 로그아웃" : "계정에 로그인"}
          />
        </ListItem>
      </List>
    </Box>
  )

  const tabs = [
    { label: '홈', icon: <HomeIcon />, content: renderHomeTab },
    { label: '지도', icon: <MapIcon />, content: renderMapTab },
    { label: '영업사원', icon: <PeopleIcon />, content: renderSalesPeopleTab },
    { label: '현황', icon: <ChartIcon />, content: renderAnalyticsTab },
    { label: '설정', icon: <SettingsIcon />, content: renderSettingsTab },
  ]

  return (
    <Box sx={{ flexGrow: 1, pb: 7 }}>
      {/* 헤더 */}
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            영업사원 관리
          </Typography>
          <IconButton color="inherit">
            <NotificationsIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* 메인 컨텐츠 */}
      <Container maxWidth="sm" sx={{ px: 0 }}>
        {tabs[currentTab].content()}
      </Container>

      {/* 하단 네비게이션 */}
      <BottomNavigation
        value={currentTab}
        onChange={(event, newValue) => setCurrentTab(newValue)}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
        {tabs.map((tab, index) => (
          <BottomNavigationAction
            key={index}
            label={tab.label}
            icon={tab.icon}
          />
        ))}
      </BottomNavigation>

      {/* 플로팅 액션 버튼 */}
      <SpeedDial
        ariaLabel="SpeedDial"
        sx={{ position: 'fixed', bottom: 80, right: 16 }}
        icon={<SpeedDialIcon />}
      >
        {speedDialActions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={action.name}
            onClick={action.action}
          />
        ))}
      </SpeedDial>
    </Box>
  )
}
