
import './Dashboard.css';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authenticatedFetch } from '../authSession';

function Dashboard() {
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState({
    totalMembers: 0,
    activeMembers: 0,
    expiredMembers: 0,
    expiringSoon: 0,
    totalTrainers: 0,
    activePlans: 0,
    monthlyMembers: 0,
    quarterlyMembers: 0,
    halfYearlyMembers: 0,
    yearlyMembers: 0,
    recentMembers: []
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token =
        localStorage.getItem('token') ||
        sessionStorage.getItem('token');

      if (!token) {
        navigate('/');
        return;
      }

      try {
        const response = await authenticatedFetch(
          `${process.env.REACT_APP_API_URL}/api/dashboard`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.status === 401 || response.status === 403) {
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to load dashboard data.');
        }

        const data = await response.json();

        setDashboardData((previousData) => ({
          ...previousData,
          ...data
        }));
      } catch (error) {
        setError(error.message || 'Unable to connect to the server.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="dashboard">
        <h2>Loading dashboard...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <h2>Unable to load dashboard</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Good Morning, Admin 👋</h1>
          <p>Here is what's happening in your gym today.</p>
        </div>

        <button
          className="add-member-btn"
          onClick={() => navigate('/members')}
        >
          + Add Member
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <p>Total Members</p>
            <h2>{dashboardData.totalMembers}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <p>Active Members</p>
            <h2>{dashboardData.activeMembers}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <p>Expiring Soon</p>
            <h2>{dashboardData.expiringSoon ?? 0}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🏋️</div>
          <div className="stat-info">
            <p>Total Trainers</p>
            <h2>{dashboardData.totalTrainers}</h2>
          </div>
        </div>
      </div>

      <div className="dashboard-bottom">
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Membership Overview</h3>
          </div>

          <div className="membership-overview">
            <div className="membership-item">
              <span>Monthly</span>
              <h2>{dashboardData.monthlyMembers ?? 0}</h2>
            </div>

            <div className="membership-item">
              <span>Quarterly</span>
              <h2>{dashboardData.quarterlyMembers ?? 0}</h2>
            </div>

            <div className="membership-item">
              <span>Half-Yearly</span>
              <h2>{dashboardData.halfYearlyMembers ?? 0}</h2>
            </div>

            <div className="membership-item">
              <span>Yearly</span>
              <h2>{dashboardData.yearlyMembers ?? 0}</h2>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h3>Recent Members</h3>
          </div>

          {dashboardData.recentMembers.length === 0 ? (
            <p>No members found.</p>
          ) : (
            dashboardData.recentMembers.map((member) => (
              <div className="recent-member" key={member.id}>
                <div className="member-info">
                  {/* <div className="member-avatar">
                    {member.name
                      ? member.name.charAt(0).toUpperCase()
                      : '?'}
                  </div> */}

                  <div>
                    <h4>{member.name}</h4>
                    <p>{member.membershipPlan || 'No plan assigned'}</p>
                  </div>
                </div>

                <span
                  className={
                    member.status?.toLowerCase() === 'active'
                      ? 'status active'
                      : 'status expired'
                  }
                >
                  {member.status || 'Unknown'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
