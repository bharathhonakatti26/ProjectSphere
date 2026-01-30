import { useEffect } from 'react';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';

import { theme } from './theme';
import { useAuthStore } from './store/authStore';
import { ProtectedRoute, LoadingScreen } from './components/common';
import { AuthLayout, DashboardLayout } from './layouts';
import {
  Landing,
  Login,
  Register,
  StudentDashboard,
  StudentClassrooms,
  StudentClassroomDetails,
  StudentTeams,
  StudentTeamDetails,
  StudentProjects,
  StudentProjectDetails,
  StudentDiscovery,
  TeacherDashboard,
  TeacherClassrooms,
  TeacherClassroomDetails,
  TeacherTeams,
  TeacherProjects,
  TeacherDiscovery,
  Chat,
  Settings
} from './pages';

import './App.css';

function App() {
  const { isLoading, checkAuth, isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <MantineProvider theme={theme} defaultColorScheme="dark">
        <LoadingScreen />
      </MantineProvider>
    );
  }

  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <Notifications position="top-right" zIndex={2077} />
      <ModalsProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />

            {/* Auth Routes */}
            <Route path="/login" element={<AuthLayout />}>
              <Route index element={<Login />} />
            </Route>
            <Route path="/register" element={<AuthLayout />}>
              <Route index element={<Register />} />
            </Route>

            {/* Student Routes */}
            <Route
              path="/app/student"
              element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<StudentDashboard />} />
              <Route path="classrooms" element={<StudentClassrooms />} />
              <Route path="classrooms/:classroomId" element={<StudentClassroomDetails />} />
              <Route path="teams" element={<StudentTeams />} />
              <Route path="teams/:teamId" element={<StudentTeamDetails />} />
              <Route path="projects" element={<StudentProjects />} />
              <Route path="projects/:projectId" element={<StudentProjectDetails />} />
              <Route path="discovery" element={<StudentDiscovery />} />
              <Route path="chat" element={<Chat />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Teacher Routes */}
            <Route
              path="/app/teacher"
              element={
                <ProtectedRoute allowedRoles={['TEACHER']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<TeacherDashboard />} />
              <Route path="classrooms" element={<TeacherClassrooms />} />
              <Route path="classrooms/:classroomId" element={<TeacherClassroomDetails />} />
              <Route path="teams" element={<TeacherTeams />} />
              <Route path="teams/:teamId" element={<StudentTeamDetails />} />
              <Route path="projects" element={<TeacherProjects />} />
              <Route path="projects/:projectId" element={<StudentProjectDetails />} />
              <Route path="discovery" element={<TeacherDiscovery />} />
              <Route path="chat" element={<Chat />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Catch all - redirect based on auth */}
            <Route
              path="*"
              element={
                isAuthenticated ? (
                  <Navigate to={user?.role === 'TEACHER' ? '/app/teacher' : '/app/student'} replace />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
          </Routes>
        </BrowserRouter>
      </ModalsProvider>
    </MantineProvider>
  );
}

export default App;
