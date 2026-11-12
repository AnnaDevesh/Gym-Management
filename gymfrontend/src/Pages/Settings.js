
import { useState } from 'react';
import './Settings.css';
import { authenticatedFetch } from '../authSession';

function Settings() {

  const [adminData, setAdminData] = useState({
    name: 'Admin',
    email: 'admin@gym.com',
    phone: '9876543210'
  });

  const [gymData, setGymData] = useState({
    name: 'FitZone Gym',
    address: 'Chennai, Tamil Nadu',
    phone: '9876543210',
    email: 'info@fitzonegym.com'
  });

  // const [generalData, setGeneralData] = useState({
  //   currency: 'INR (₹)',
  //   timezone: 'Asia/Kolkata',
  //   dateFormat: 'DD/MM/YYYY'
  // });

  const [notifications, setNotifications] = useState({
    membershipExpiry: true,
    payment: true,
    newMember: true
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordSaving, setPasswordSaving] = useState(false);


  const handleAdminChange = (e) => {

    const { name, value } = e.target;

    setAdminData({
      ...adminData,
      [name]: value
    });

  };


  const handleGymChange = (e) => {

    const { name, value } = e.target;

    setGymData({
      ...gymData,
      [name]: value
    });

  };


  // const handleGeneralChange = (e) => {

  //   const { name, value } = e.target;

  //   setGeneralData({
  //     ...generalData,
  //     [name]: value
  //   });

  // };


  const handlePasswordChange = (e) => {

    const { name, value } = e.target;

    setPasswordData({
      ...passwordData,
      [name]: value
    });

  };


  const handleNotificationChange = (name) => {

    setNotifications({
      ...notifications,
      [name]: !notifications[name]
    });

  };


  const saveAdminProfile = () => {
    alert('Admin profile saved successfully.');
  };


  const saveGymInformation = () => {
    alert('Gym information saved successfully.');
  };


  // const saveGeneralSettings = () => {
  //   alert('General settings saved successfully.');
  // };


  const changePassword = async () => {

    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      alert('Please fill all password fields.');
      return;
    }

    if (
      passwordData.newPassword !==
      passwordData.confirmPassword
    ) {
      alert('New password and confirm password do not match.');
      return;
    }

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    if (!token) {
      alert('Please log in again to change your password.');
      return;
    }

    setPasswordSaving(true);

    try {
      const response = await authenticatedFetch('http://localhost:8081/api/account/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });
      const message = await response.text();

      if (!response.ok) {
        throw new Error(message || 'Unable to change password.');
      }

      alert(message || 'Password changed successfully.');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      alert(error.message || 'Unable to change password.');
    } finally {
      setPasswordSaving(false);
    }

  };


  return (
    <div className="settings-page">


      {/* Page Header */}

      <div className="settings-header">

        <div>

          <h1>Settings</h1>

          <p>
            Manage your gym information and application settings.
          </p>

        </div>

      </div>


      {/* Admin Profile */}

      <div className="settings-card">

        <div className="settings-card-header">

          <div className="settings-section-icon">
            👤
          </div>

          <div>

            <h2>Admin Profile</h2>

            <p>
              Manage your administrator account information.
            </p>

          </div>

        </div>


        <div className="settings-card-body">

          <div className="settings-profile">

            <div className="settings-profile-avatar">
              {adminData.name.charAt(0)}
            </div>

            <div>

              <h3>
                {adminData.name}
              </h3>

              <span>
                Gym Administrator
              </span>

            </div>

          </div>


          <div className="settings-form-grid">

            <div className="settings-form-group">

              <label>Full Name</label>

              <input
                type="text"
                name="name"
                value={adminData.name}
                onChange={handleAdminChange}
              />

            </div>


            <div className="settings-form-group">

              <label>Email Address</label>

              <input
                type="email"
                name="email"
                value={adminData.email}
                onChange={handleAdminChange}
              />

            </div>


            <div className="settings-form-group">

              <label>Phone Number</label>

              <input
                type="text"
                name="phone"
                value={adminData.phone}
                onChange={handleAdminChange}
              />

            </div>

          </div>


          <div className="settings-save-row">

            <button
              className="settings-save-btn"
              onClick={saveAdminProfile}
            >
              Save Profile
            </button>

          </div>

        </div>

      </div>


      {/* Gym Information */}

      <div className="settings-card">

        <div className="settings-card-header">

          <div className="settings-section-icon">
            🏢
          </div>

          <div>

            <h2>Gym Information</h2>

            <p>
              Update your gym's basic information and contact details.
            </p>

          </div>

        </div>


        <div className="settings-card-body">

          <div className="settings-form-grid">

            <div className="settings-form-group">

              <label>Gym Name</label>

              <input
                type="text"
                name="name"
                value={gymData.name}
                onChange={handleGymChange}
              />

            </div>


            <div className="settings-form-group">

              <label>Phone Number</label>

              <input
                type="text"
                name="phone"
                value={gymData.phone}
                onChange={handleGymChange}
              />

            </div>


            <div className="settings-form-group">

              <label>Email Address</label>

              <input
                type="email"
                name="email"
                value={gymData.email}
                onChange={handleGymChange}
              />

            </div>


            <div className="settings-form-group full-width">

              <label>Gym Address</label>

              <textarea
                name="address"
                rows="3"
                value={gymData.address}
                onChange={handleGymChange}
              ></textarea>

            </div>

          </div>


          <div className="settings-save-row">

            <button
              className="settings-save-btn"
              onClick={saveGymInformation}
            >
              Save Gym Information
            </button>

          </div>

        </div>

      </div>

      {/* Notifications */}

      <div className="settings-card">
        <div className="settings-card-header">
          <div className="settings-section-icon">
            🔔
          </div>
          <div>
            <h2>Notifications</h2>
            <p>
              Choose which notifications you want to receive.
            </p>
          </div>
        </div>
        <div className="settings-card-body">
          <div className="notification-settings">
            <div className="notification-setting">
              <div>
                <strong>
                  Membership Expiry
                </strong>
                <span>
                  Get notified when a member's membership is about to expire.
                </span>
              </div>
              <button
                className={`settings-toggle ${
                  notifications.membershipExpiry
                    ? 'active'
                    : ''
                }`}
                onClick={() =>
                  handleNotificationChange('membershipExpiry')
                }
              >
                <span></span>
              </button>
            </div>
            
          </div>

        </div>

      </div>


      {/* Change Password */}

      <div className="settings-card">

        <div className="settings-card-header">

          <div className="settings-section-icon">
            🔐
          </div>

          <div>

            <h2>Change Password</h2>

            <p>
              Update your administrator account password.
            </p>

          </div>

        </div>


        <div className="settings-card-body">

          <div className="settings-form-grid">

            <div className="settings-form-group full-width">

              <label>Current Password</label>

              <input
                type="password"
                name="currentPassword"
                placeholder="Enter current password"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
              />

            </div>


            <div className="settings-form-group">

              <label>New Password</label>

              <input
                type="password"
                name="newPassword"
                placeholder="Enter new password"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
              />

            </div>


            <div className="settings-form-group">

              <label>Confirm Password</label>

              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm new password"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
              />

            </div>

          </div>


          <div className="settings-save-row">

            <button
              className="settings-save-btn"
              onClick={changePassword}
              disabled={passwordSaving}
            >
              {passwordSaving ? 'Changing...' : 'Change Password'}
            </button>

          </div>

        </div>

      </div>


    </div>
  );
}

export default Settings;

