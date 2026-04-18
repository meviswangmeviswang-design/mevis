import { Routes, Route, HashRouter } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import FormPage from "./pages/FormPage";
import TrackPage from "./pages/TrackPage";
import AdminPage from "./pages/AdminPage";

export default function App() {
  return (
    <HashRouter>
      <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 flex flex-col items-center">
        <Navbar />
        <main className="w-full max-w-5xl flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/form" element={<FormPage />} />
            <Route path="/track" element={<TrackPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}
