
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Login.css';

function Login() {

  const navigate = useNavigate();
  const location = useLocation();
  const loginRequired = location.state?.loginRequired === true;
  const loggedOut = location.state?.loggedOut === true;
  const loginNotice = loginRequired
    ? 'Please log in to access that page.'
    : loggedOut
      ? 'You have been logged out.'
      : '';

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLoginNotice, setShowLoginNotice] = useState(Boolean(loginNotice));

  useEffect(() => {
    if (!loginNotice) {
      return undefined;
    }

    setShowLoginNotice(true);
    const timeout = window.setTimeout(() => setShowLoginNotice(false), 4500);
    return () => window.clearTimeout(timeout);
  }, [loginNotice]);

  const handleInputChange = (e) => {

    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value
    });

  };

  const handleLogin = async (e) => {

    e.preventDefault();

    if (!formData.email || !formData.password) {
      alert('Please enter email and password.');
      return;
    }

    setLoading(true);

    try {

      const response = await fetch(
        'http://localhost:8081/api/auth/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        }
      );

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Invalid email or password.');
        }

        throw new Error('Login failed. Please try again.');
      }

      const data = await response.json();

      if (!data.token) {
        throw new Error('Login response does not contain a token.');
      }

      const storage = rememberMe
        ? localStorage
        : sessionStorage;

      storage.setItem('token', data.token);
      storage.setItem('name', data.name);
      storage.setItem('email', data.email);
      storage.setItem('role', data.role);

      navigate('/dashboard');

    } catch (error) {

      alert(error.message);

    } finally {

      setLoading(false);

    }

  };

  return (
    <div className="login-page">
      {showLoginNotice && (
        <div className="login-required-toast" role="alert">
          {loginNotice}
        </div>
      )}

      {/* Left Side */}

      <div className="login-left">

        <div className="login-brand">

          <h1>GYM</h1>

          <span>
            MANAGEMENT
          </span>

        </div>

        <div className="login-left-content">

          <h2>
            Manage your gym
            <br />
            <span>smarter.</span>
          </h2>

          <p>
            Manage members, trainers, memberships
            and everything your gym needs in one place.
          </p>

        </div>

        <div className="login-left-footer">
          <span>
            Gym Management System
          </span>
        </div>

      </div>

      {/* Right Side */}

      <div className="login-right">

        <div className="login-container">

          <div className="login-header">

            <div className="mobile-login-logo">
              <h2>GYM</h2>
              <span>MANAGEMENT</span>
            </div>

            <h1>
              Welcome back
            </h1>

            <p>
              Login to your admin or trainer account
            </p>

          </div>

          <form
            className="login-form"
            onSubmit={handleLogin}
          >

            {/* Email */}

            <div className="login-form-group">

              <label>
                Email Address
              </label>

              <div className="login-input-wrapper">

                <span>
                  ✉️
                </span>

                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />

              </div>

            </div>

            {/* Password */}

            <div className="login-form-group">

              <label>
                Password
              </label>

              <div className="login-input-wrapper">

                <span>
                  🔒
                </span>

                <input
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                >
                  {showPassword
                    ? '🙈'
                    : '👁️'}
                </button>

              </div>

            </div>

            {/* Remember Me */}

            <div className="login-options">

              <label className="remember-me">

                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={() =>
                    setRememberMe(!rememberMe)
                  }
                />

                <span>
                  Remember me
                </span>

              </label>

            </div>

            {/* Login */}

            <button
              type="submit"
              className="login-btn"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>

          </form>

          <div className="login-footer">

            <p>
              © 2026 Gym Management System
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Login;
