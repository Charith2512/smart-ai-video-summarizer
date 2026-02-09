import { AuthProvider } from "./context/AuthContext";
import { UIProvider } from "./context/UIContext";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import History from "./pages/History";



function App() {
  return (
    <Router>
      <UIProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/signup" element={<Navigate to="/" replace />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </AuthProvider>
      </UIProvider>
    </Router>
  );
}

export default App;
