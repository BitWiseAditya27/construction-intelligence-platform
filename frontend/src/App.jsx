import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProjectProvider } from './context/ProjectContext';
import MainLayout from './layouts/MainLayout';

import DashboardPage from './pages/DashboardPage';
import SafetyPage from './pages/SafetyPage';
import CrackAnalysisPage from './pages/CrackAnalysisPage';
import ValuationPage from './pages/ValuationPage';
import PlanningPage from './pages/PlanningPage';
import SiteAssistantPage from './pages/SiteAssistantPage';
import WeatherAdvisoryPage from './pages/WeatherAdvisoryPage';
import KnowledgeAssistantPage from './pages/KnowledgeAssistantPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';

export function App() {
  return (
    <ProjectProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="safety" element={<SafetyPage />} />
            <Route path="cracks" element={<CrackAnalysisPage />} />
            <Route path="valuation" element={<ValuationPage />} />
            <Route path="planning" element={<PlanningPage />} />
            <Route path="assistant" element={<SiteAssistantPage />} />
            <Route path="weather" element={<WeatherAdvisoryPage />} />
            <Route path="knowledge" element={<KnowledgeAssistantPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ProjectProvider>
  );
}

export default App;
