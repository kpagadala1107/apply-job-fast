import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import JobSearch from './pages/JobSearch';
import ResumeTailor from './pages/ResumeTailor';
import Dashboard from './pages/Dashboard';
import PrepPlan from './pages/PrepPlan';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Landing />} />
            <Route path="jobs" element={<JobSearch />} />
            <Route path="tailor/:jobId" element={<ResumeTailor />} />
            <Route path="prep/:jobId" element={<PrepPlan />} />
            <Route path="dashboard" element={<Dashboard />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
