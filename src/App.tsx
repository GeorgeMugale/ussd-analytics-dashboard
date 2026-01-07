import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AnalyticsPage from "./pages/Analytics";

function App() {
  return (
    <div className="App">
      <main>
        <Router>
          <Routes>
            <Route path="/" element={<AnalyticsPage />} />
            <Route path="*" element={<>404: Page Not Found</>} />
          </Routes>
        </Router>
      </main>
    </div>
  );
}

export default App;
