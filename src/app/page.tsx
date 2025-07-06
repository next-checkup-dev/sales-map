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
  CircularProgress,
  Button,
  Alert,
  Snackbar,
} from '@mui/material'
import {
  Map as MapIcon,
  Business as BusinessIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Home as HomeIcon,
  LocationOn as LocationIcon,
  BarChart as ChartIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocalHospital as LocalHospitalIcon,
} from '@mui/icons-material'
import { useAuth } from '@/hooks/useAuth'
import { useGoogleSheets } from '@/hooks/useGoogleSheets'
import LoginModal from '@/components/LoginModal'
import HospitalSalesModal from '@/components/HospitalSalesModal'
import ConnectionTestModal from '@/components/ConnectionTestModal'
import type { HospitalSalesData } from '@/lib/googleSheets'

export default function Home() {
  const [currentTab, setCurrentTab] = useState(0)
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [hospitalSalesModalOpen, setHospitalSalesModalOpen] = useState(false)
  const [connectionTestModalOpen, setConnectionTestModalOpen] = useState(false)
  const [editingHospitalSales, setEditingHospitalSales] = useState<HospitalSalesData | null>(null)
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
  const [searchTerm, setSearchTerm] = useState('')
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error'
  }>({ open: false, message: '', severity: 'success' })

  const { user, loading, logout } = useAuth()
  const { 
    hospitalSales, 
    loading: sheetsLoading, 
    error: sheetsError,
    fetchData,
    addHospitalSales,
    updateHospitalSales,
    deleteHospitalSales 
  } = useGoogleSheets()

  const handleLogout = async () => {
    await logout()
  }

  const handleAddHospitalSales = () => {
    setModalMode('add')
    setEditingHospitalSales(null)
    setHospitalSalesModalOpen(true)
  }

  const handleEditHospitalSales = (hospitalSales: HospitalSalesData) => {
    setModalMode('edit')
    setEditingHospitalSales(hospitalSales)
    setHospitalSalesModalOpen(true)
  }

  const handleDeleteHospitalSales = async (id: string) => {
    if (window.confirm('정말로 이 병원 영업 데이터를 삭제하시겠습니까?')) {
      const result = await deleteHospitalSales(id)
      setSnackbar({
        open: true,
        message: result.success ? result.message! : result.error!,
        severity: result.success ? 'success' : 'error'
      })
    }
  }

  const handleSaveHospitalSales = async (data: Omit<HospitalSalesData, 'id'>) => {
    if (modalMode === 'add') {
      return await addHospitalSales(data)
    } else {
      if (editingHospitalSales) {
        return await updateHospitalSales({ ...editingHospitalSales, ...data })
      }
      return { success: false, error: '편집할 병원 영업 데이터가 없습니다.' }
    }
  }

  const handleGoogleSheetsTest = () => {
    setConnectionTestModalOpen(true)
  }

  const handleConnectionTest = async () => {
    try {
      const response = await fetch('/api/salespeople/test')
      const result = await response.json()
      return result
    } catch (error) {
      return {
        success: false,
        message: 'Google Sheets 연동에 실패했습니다.',
        details: {
          message: error instanceof Error ? error.message : '알 수 없는 오류',
          timestamp: new Date().toISOString(),
          connectionStatus: 'failed'
        }
      }
    }
  }

  const filteredHospitalSales = hospitalSales.filter(hospital =>
    hospital.hospitalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hospital.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hospital.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hospital.salesPerson.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const speedDialActions = [
    { 
      icon: <AddIcon />, 
      name: '새 병원 추가', 
      action: handleAddHospitalSales 
    },
    { 
      icon: <RefreshIcon />, 
      name: '데이터 새로고침', 
      action: fetchData 
    },
    { 
      icon: <NotificationsIcon />, 
      name: '알림', 
      action: () => console.log('알림') 
    },
  ]

  const renderHomeTab = () => (
    <Box sx={{ pb: 7 }}>
      {sheetsError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {sheetsError}
        </Alert>
      )}

      {/* 통계 카드들 */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6}>
          <Card sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h4" color="primary">
              {sheetsLoading ? <CircularProgress size={24} /> : hospitalSales.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              총 병원
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={6}>
          <Card sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h4" color="success.main">
              {sheetsLoading ? <CircularProgress size={24} /> : hospitalSales.filter(h => h.visitCount > 0).length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              방문 병원
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
          {sheetsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress />
            </Box>
          ) : (
            <List>
              {hospitalSales.slice(0, 3).map((hospital, index) => (
                <Box key={hospital.id}>
                  <ListItem alignItems="flex-start">
                    <ListItemAvatar>
                      <Avatar>
                        <LocalHospitalIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={hospital.hospitalName}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.primary">
                            {hospital.department} • {hospital.address}
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
                  {index < Math.min(2, hospitalSales.length - 1) && <Divider variant="inset" component="li" />}
                </Box>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Box>
  )

  const renderMapTab = () => (
    <Box sx={{ pb: 7, height: 'calc(100vh - 120px)' }}>
      <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6">병원 위치</Typography>
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
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {hospitalSales.length}개의 병원 위치 정보
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  )

  const renderHospitalSalesTab = () => (
    <Box sx={{ pb: 7 }}>
      {/* 검색 */}
      <Box sx={{ p: 2, pb: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="병원 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
        />
      </Box>

      {sheetsError && (
        <Alert severity="error" sx={{ m: 2 }}>
          {sheetsError}
        </Alert>
      )}

      {/* 병원 리스트 */}
      {sheetsLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <List>
          {filteredHospitalSales.map((hospital, index) => (
            <Box key={hospital.id}>
              <ListItem alignItems="flex-start" sx={{ px: 2 }}>
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
                  <IconButton 
                    size="small" 
                    onClick={() => handleEditHospitalSales(hospital)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => handleDeleteHospitalSales(hospital.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </ListItem>
              {index < filteredHospitalSales.length - 1 && <Divider />}
            </Box>
          ))}
        </List>
      )}
    </Box>
  )

  const renderAnalyticsTab = () => (
    <Box sx={{ pb: 7 }}>
      <Card sx={{ m: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            병원 영업 현황
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {sheetsLoading ? <CircularProgress size={32} /> : hospitalSales.length}
                </Typography>
                <Typography variant="body2">총 병원</Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {sheetsLoading ? <CircularProgress size={32} /> : hospitalSales.filter(h => h.visitCount > 0).length}
                </Typography>
                <Typography variant="body2">방문 병원</Typography>
              </Box>
            </Grid>
          </Grid>
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
          <ListItemText 
            primary="Google Sheets 연동" 
            secondary="데이터 동기화 설정" 
          />
          <Button 
            variant="outlined" 
            size="small" 
            onClick={handleGoogleSheetsTest}
            disabled={sheetsLoading}
            startIcon={sheetsLoading ? <CircularProgress size={16} /> : <RefreshIcon />}
          >
            연동 테스트
          </Button>
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
            {user ? <LogoutIcon /> : <LoginIcon />}
          </ListItemIcon>
          <ListItemText 
            primary={user ? "로그아웃" : "로그인"} 
            secondary={user ? "계정에서 로그아웃" : "계정에 로그인"}
          />
          {user && (
            <Button 
              variant="outlined" 
              size="small" 
              onClick={handleLogout}
              startIcon={<LogoutIcon />}
            >
              로그아웃
            </Button>
          )}
        </ListItem>
      </List>
    </Box>
  )

  const tabs = [
    { label: '홈', icon: <HomeIcon />, content: renderHomeTab },
    { label: '지도', icon: <MapIcon />, content: renderMapTab },
    { label: '병원', icon: <LocalHospitalIcon />, content: renderHospitalSalesTab },
    { label: '현황', icon: <ChartIcon />, content: renderAnalyticsTab },
    { label: '설정', icon: <SettingsIcon />, content: renderSettingsTab },
  ]

  // 로딩 중일 때
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <CircularProgress />
      </Box>
    )
  }

  // 로그인하지 않은 경우
  if (!user) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        p: 3
      }}>
        <Typography variant="h4" sx={{ mb: 2, textAlign: 'center' }}>
          병원 영업 관리 시스템
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
          병원 영업 현황을 관리하세요
        </Typography>
        <Button 
          variant="contained" 
          size="large"
          onClick={() => setLoginModalOpen(true)}
          startIcon={<LoginIcon />}
        >
          로그인
        </Button>
        
        <LoginModal 
          open={loginModalOpen} 
          onClose={() => setLoginModalOpen(false)} 
        />
      </Box>
    )
  }

  return (
    <Box sx={{ flexGrow: 1, pb: 7 }}>
      {/* 헤더 */}
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            병원 영업 관리
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {user.email}
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

      {/* 병원 영업 모달 */}
      <HospitalSalesModal
        open={hospitalSalesModalOpen}
        onClose={() => setHospitalSalesModalOpen(false)}
        hospitalSales={editingHospitalSales}
        onSave={handleSaveHospitalSales}
        mode={modalMode}
      />

      {/* 연동 테스트 모달 */}
      <ConnectionTestModal
        open={connectionTestModalOpen}
        onClose={() => setConnectionTestModalOpen(false)}
        onTest={handleConnectionTest}
      />

      {/* 스낵바 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
} 