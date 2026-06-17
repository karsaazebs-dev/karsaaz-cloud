import { Routes, Route, Navigate } from 'react-router-dom'
import SplashScreen from './pages/SplashScreen'
import Onboarding1 from './pages/onboarding/Onboarding1'
import Onboarding2 from './pages/onboarding/Onboarding2'
import Onboarding3 from './pages/onboarding/Onboarding3'
import ConnectToServer from './pages/auth/ConnectToServer'
import Login from './pages/auth/Login'
import AppShell from './components/layout/AppShell'
import Dashboard from './pages/dashboard/Dashboard'
import RecentFiles from './pages/files/RecentFiles'
import AllFiles from './pages/files/AllFiles'
import PersonalFiles from './pages/files/PersonalFiles'
import Favourites from './pages/files/Favourites'
import SharedFiles from './pages/files/SharedFiles'
import Media from './pages/Media'
import Uploads from './pages/Uploads'
import OnDevice from './pages/OnDevice'
import DeletedFiles from './pages/DeletedFiles'
import Activities from './pages/Activities'
import Requests from './pages/Requests'
import UserManagement from './pages/UserManagement'
import Settings from './pages/Settings'

function App(): JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/splash" replace />} />
      <Route path="/splash" element={<SplashScreen />} />
      <Route path="/onboarding/1" element={<Onboarding1 />} />
      <Route path="/onboarding/2" element={<Onboarding2 />} />
      <Route path="/onboarding/3" element={<Onboarding3 />} />
      <Route path="/auth/connect" element={<ConnectToServer />} />
      <Route path="/auth/login" element={<Login />} />
      <Route path="/app" element={<AppShell />}>
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="files/recent" element={<RecentFiles />} />
        <Route path="files/all" element={<AllFiles />} />
        <Route path="files/personal" element={<PersonalFiles />} />
        <Route path="files/favourites" element={<Favourites />} />
        <Route path="files/shared" element={<SharedFiles />} />
        <Route path="media" element={<Media />} />
        <Route path="requests" element={<Requests />} />
        <Route path="user-management" element={<UserManagement />} />
        <Route path="uploads" element={<Uploads />} />
        <Route path="on-device" element={<OnDevice />} />
        <Route path="deleted" element={<DeletedFiles />} />
        <Route path="activities" element={<Activities />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}

export default App
