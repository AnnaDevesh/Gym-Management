import { NavLink } from 'react-router-dom';
import { getAuthRole } from '../authSession';
import './Sidebar.css'
function Sidebar() {
  const isAdmin = getAuthRole().toUpperCase() === 'ADMIN';

  return (
    <div className="sidebar">

      <div className="logo">
        <h2>GYM</h2>
        <span>MANAGEMENT</span>
      </div>

      <div className="menu">

      <NavLink
        to="/dashboard"
        className="menu-item"
      >
          🏠
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/members"
          className="menu-item"
        >
          👥
          <span>Members</span>
        </NavLink>

        {isAdmin && (
          <NavLink
            to="/membership-plans"
            className="menu-item"
          >
            📋
            <span>Membership Plans</span>
          </NavLink>
        )}

        {isAdmin && (
          <NavLink
            to="/trainers"
            className="menu-item"
          >
            🏋️
            <span>Trainers</span>
          </NavLink>
        )}

      </div>

      <NavLink
        to="/settings"
        className="settings"
      >
        ⚙️
        <span>Settings</span>
      </NavLink>

    </div>
  );
}

export default Sidebar;