import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from "./layouts/MainLayout";
import Dashboard from "./pages/Dashboard.tsx";
import DataSensor from "./pages/DataSensor.tsx";
import History from "./pages/History.tsx";
import Profile from "./pages/Profile.tsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="datasensor" element={<DataSensor />} />
          <Route path="history" element={<History />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
