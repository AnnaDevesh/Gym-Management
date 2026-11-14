import '../Pages/Navbar.css';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { authenticatedFetch, clearAuthSession } from '../authSession';

function Navbar() {

  const location = useLocation();
  const navigate = useNavigate();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const profileName =
    localStorage.getItem('name') ||
    sessionStorage.getItem('name') ||
    'Admin';
  const profileEmail =
    localStorage.getItem('email') ||
    sessionStorage.getItem('email') ||
    '';
  const profileRole =
    localStorage.getItem('role') ||
    sessionStorage.getItem('role') ||
    'Administrator';

  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  let pageTitle = 'Dashboard';

  if (location.pathname === '/members') {
    pageTitle = 'Members';
  } else if (location.pathname === '/membership-plans') {
    pageTitle = 'Membership Plans';
  } else if (location.pathname === '/trainers') {
    pageTitle = 'Trainers';
  } else if (location.pathname === '/settings') {
    pageTitle = 'Settings';
  }

  useEffect(() => {

    const handleClickOutside = (event) => {

      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }

      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setShowProfile(false);
      }

    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };

  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      const token =
        localStorage.getItem('token') ||
        sessionStorage.getItem('token');

      if (!token) {
        setNotifications([]);
        return;
      }

      try {
        const response = await authenticatedFetch(
          `${process.env.REACT_APP_API_URL}/api/dashboard/notifications`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          setNotifications(data);
        }
      } catch {
        // Keep the last known notification count if the server is temporarily unavailable.
      }
    };

    fetchNotifications();
    const refreshInterval = window.setInterval(fetchNotifications, 60_000);
    window.addEventListener('focus', fetchNotifications);

    return () => {
      window.clearInterval(refreshInterval);
      window.removeEventListener('focus', fetchNotifications);
    };
  }, []);

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    setShowProfile(false);
  };

  const handleProfileClick = () => {
    setShowProfile(!showProfile);
    setShowNotifications(false);
  };

  const handleSettings = () => {
    setShowProfile(false);
    navigate('/settings');
  };

  const handleMyProfile = () => {
    setShowProfile(false);
    navigate('/settings');
  };

  const handleLogout = () => {
    setShowProfile(false);
    setShowNotifications(false);
    setNotifications([]);
    clearAuthSession();
    navigate('/', { replace: true, state: { loggedOut: true } });
  };

  return (
    <div className="navbar">

      <div className="navbar-title">
        <h3>{pageTitle}</h3>
      </div>


      <div className="navbar-right">


        {/* Notifications */}

        <div
          className="notification-wrapper"
          ref={notificationRef}
        >

          <button
            className="notification-btn"
            onClick={handleNotificationClick}
            aria-label="Membership expiry notifications"
          >
            🔔
            {notifications.length > 0 && (
              <span className="notification-badge">
                {notifications.length}
              </span>
            )}
          </button>


          {showNotifications && (

            <div className="notification-dropdown">

              <div className="dropdown-header">
                <h4>Notifications</h4>
                <span>
                  {notifications.length} expiring tomorrow
                </span>
              </div>

              {notifications.length === 0 ? (
                <div className="notification-empty">
                  No memberships expire tomorrow.
                </div>
              ) : (
                notifications.map((notification) => (
                  <div className="notification-item" key={notification.memberId}>
                    <div className="notification-icon">⚠️</div>
                    <div>
                      <p>
                        {notification.name || 'A member'}'s{' '}
                        {notification.membershipPlan || 'membership'} expires tomorrow
                      </p>
                      <span>Expiry date: {notification.expiryDate}</span>
                    </div>
                  </div>
                ))
              )}

              <button
                className="view-notifications"
                type="button"
                onClick={() => {
                  setShowNotifications(false);
                  navigate('/members');
                }}
              >
                View members
              </button>

            </div>

          )}

        </div>


        {/* Admin Profile */}

        <div
          className="profile-wrapper"
          ref={profileRef}
        >

          <button
            className="profile-btn"
            onClick={handleProfileClick}
            type="button"
            aria-haspopup="menu"
            aria-expanded={showProfile}
            aria-label={`Profile menu for ${profileName}`}
          >

            <div className="profile-avatar">
              {profileName.charAt(0).toUpperCase()}
            </div>

            <div className="profile-info">

              <strong>{profileName}</strong>

              <span>{profileRole}</span>

            </div>

            <span className="profile-arrow">
              ▼
            </span>

          </button>


          {showProfile && (

            <div className="profile-dropdown" role="menu">

              <div className="profile-dropdown-header">

                <div className="large-avatar">
                  {profileName.charAt(0).toUpperCase()}
                </div>

                <div>
                  <strong>{profileName}</strong>
                  {profileEmail && <span>{profileEmail}</span>}
                </div>

              </div>


              <div className="profile-menu">

                <button type="button" role="menuitem" onClick={handleMyProfile}>
                  👤
                  <span>My Profile</span>
                </button>

                <button type="button" role="menuitem" onClick={handleSettings}>
                  ⚙️
                  <span>Settings</span>
                </button>

                <div className="profile-divider"></div>

                <button
                  className="logout-btn"
                  onClick={handleLogout}
                  type="button"
                  role="menuitem"
                >
                  🚪
                  <span>Logout</span>
                </button>

              </div>

            </div>

          )}

        </div>

      </div>

    </div>
  );
}

export default Navbar;