import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import TeacherLogin from './pages/TeacherLogin';
import StudentLogin from './pages/StudentLogin';
import PrivateRoute from './components/PrivateRoute';
import StudentRoute from './components/StudentRoute';
import TeacherLayout from './components/TeacherLayout';
import TypingGame from './pages/TypingGame';
import ClassManagement from './pages/ClassManagement';
import TeacherManagement from './pages/TeacherManagement';
import TeacherHome from './pages/TeacherHome';
import TeachingTools from './pages/TeachingTools';
import LearningTools from './pages/LearningTools';
import PsychologicalTools from './pages/PsychologicalTools';
import QRCodeScanner from './pages/QRCodeScanner';
import StudentQRCodeScanner from './pages/StudentQRCodeScanner';
import EmotionCards from './pages/EmotionCards';
import StudentEmotionCards from './pages/StudentEmotionCards';
import WhiteBoard from './pages/WhiteBoard';
import StudentWhiteBoard from './pages/StudentWhiteBoard';
import ImageFilter from './pages/ImageFilter';
import StudentImageFilter from './pages/StudentImageFilter';
import StudentPicker from './pages/StudentPicker';
import GroupingTool from './pages/GroupingTool';
import WebsiteTools from './pages/WebsiteTools';
import NumberFlow from './pages/NumberFlow';
import AnswerBook from './pages/AnswerBook';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<TeacherLogin />} />
          <Route path="/teacher" element={
            <PrivateRoute>
              <TeacherLayout />
            </PrivateRoute>
          }>
            <Route index element={<TeacherHome />} />
            <Route path="teaching-tools" element={<TeachingTools />} />
            <Route path="learning-tools" element={<LearningTools />} />
            <Route path="psychological-tools" element={<PsychologicalTools />} />
            <Route path="website-tools" element={<WebsiteTools />} />
            <Route path="student-picker" element={<StudentPicker />} />
            <Route path="emotion-cards" element={<EmotionCards />} />
            <Route path="qrcode-scanner" element={<QRCodeScanner />} />
            <Route path="whiteboard" element={<WhiteBoard />} />
            <Route path="typing-game" element={<TypingGame />} />
            <Route path="answer-book" element={<AnswerBook />} />
            <Route path="class-management" element={<ClassManagement />} />
            <Route path="teacher-management" element={<TeacherManagement />} />
            <Route path="image-filter" element={<ImageFilter />} />
            <Route path="grouping-tool" element={<GroupingTool />} />
            <Route path="number-flow" element={<NumberFlow />} />
          </Route>
          <Route path="/student" element={<StudentRoute />} />
          <Route path="/student/login" element={<StudentLogin />} />
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/qrcode-scanner" element={<StudentQRCodeScanner />} />
          <Route path="/student/emotion-cards" element={<StudentEmotionCards />} />
          <Route path="/student/whiteboard" element={<StudentWhiteBoard />} />
          <Route path="/student/image-filter" element={<StudentImageFilter />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;