import "./App.css";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useNavigate,
} from "react-router-dom";
import { useEffect } from "react";

import Sidebar from "./Components/Sidebar";
import Navbar from "./Components/Navbar";

import Login from "./Components/Login";

import Dashboard from "./Pages/Dashboard";
import Members from "./Pages/Members";
import MembershipPlans from "./Pages/MembershipPlans";
import Trainers from "./Pages/Trainers";
import Settings from "./Pages/Settings";
import { getAuthRole } from "./authSession";

function AuthRedirectHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    const redirectToLogin = () => {
      navigate("/", { replace: true, state: { loginRequired: true } });
    };

    window.addEventListener("gym:auth-expired", redirectToLogin);

    return () => {
      window.removeEventListener("gym:auth-expired", redirectToLogin);
    };
  }, [navigate]);

  return null;
}

function RequireAuth() {
  const hasToken = Boolean(
    localStorage.getItem("token") || sessionStorage.getItem("token"),
  );

  return hasToken ? (
    <Outlet />
  ) : (
    <Navigate to="/" replace state={{ loginRequired: true }} />
  );
}

function RequireAdmin() {
  return getAuthRole().toUpperCase() === "ADMIN" ? (
    <Outlet />
  ) : (
    <Navigate to="/dashboard" replace />
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthRedirectHandler />

      <Routes>
        {/* Login */}

        <Route path="/" element={<Login />} />

        {/* Dashboard and Application */}

        <Route element={<RequireAuth />}>
          <Route
            path="/dashboard"
            element={
              <div className="app">
                <Sidebar />

                <div className="main">
                  <Navbar />

                  <div className="content">
                    <Dashboard />
                  </div>
                </div>
              </div>
            }
          />

          <Route
            path="/members"
            element={
              <div className="app">
                <Sidebar />

                <div className="main">
                  <Navbar />

                  <div className="content">
                    <Members />
                  </div>
                </div>
              </div>
            }
          />

          <Route element={<RequireAdmin />}>
            <Route
              path="/membership-plans"
              element={
                <div className="app">
                  <Sidebar />

                  <div className="main">
                    <Navbar />

                    <div className="content">
                      <MembershipPlans />
                    </div>
                  </div>
                </div>
              }
            />
          </Route>

          <Route element={<RequireAdmin />}>
            <Route
              path="/trainers"
              element={
                <div className="app">
                  <Sidebar />

                  <div className="main">
                    <Navbar />

                    <div className="content">
                      <Trainers />
                    </div>
                  </div>
                </div>
              }
            />
          </Route>

          <Route
            path="/settings"
            element={
              <div className="app">
                <Sidebar />

                <div className="main">
                  <Navbar />

                  <div className="content">
                    <Settings />
                  </div>
                </div>
              </div>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
