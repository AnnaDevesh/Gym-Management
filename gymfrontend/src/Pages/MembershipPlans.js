
import { useEffect, useState } from 'react';
import './MembershipPlans.css';
import { authenticatedFetch } from '../authSession';

const API_URL = 'http://localhost:8081/api/membership-plans';

function getToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

async function apiRequest(url, options = {}) {
  const token = getToken();

  const response = await authenticatedFetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      errorText || `Request failed with status ${response.status}`
    );
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

function MembershipPlans() {
  const [plans, setPlans] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    duration: '',
    price: '',
    description: '',
    status: 'Active'
  });

  // Load membership plans from the backend
  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      setError('');

      const data = await apiRequest(API_URL);

      setPlans(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load membership plans.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value
    }));
  };

  const openAddForm = () => {
    setEditingPlanId(null);

    setFormData({
      name: '',
      duration: '',
      price: '',
      description: '',
      status: 'Active'
    });

    setError('');
    setShowForm(true);
  };

  const handleEditPlan = (plan) => {
    setEditingPlanId(plan.id);

    setFormData({
      name: plan.name || '',
      duration: plan.duration ?? '',
      price: plan.price ?? '',
      description: plan.description || '',
      status: plan.status || 'Active'
    });

    setError('');
    setShowForm(true);
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();

    if (
      !formData.name.trim() ||
      formData.duration === '' ||
      formData.price === '' ||
      !formData.description.trim() ||
      !formData.status
    ) {
      alert('Please fill in all required fields.');
      return;
    }

    if (Number(formData.duration) <= 0 || Number(formData.price) < 0) {
      alert('Duration must be greater than 0 and price cannot be negative.');
      return;
    }

    const planData = {
      name: formData.name.trim(),
      duration: Number(formData.duration),
      price: Number(formData.price),
      description: formData.description.trim(),
      status: formData.status
    };

    try {
      setSaving(true);
      setError('');

      if (editingPlanId !== null) {
        // Update an existing plan in the database
        await apiRequest(`${API_URL}/${editingPlanId}`, {
          method: 'PUT',
          body: JSON.stringify(planData)
        });
      } else {
        // Save a new plan in the database
        await apiRequest(API_URL, {
          method: 'POST',
          body: JSON.stringify(planData)
        });
      }

      setShowForm(false);
      setEditingPlanId(null);

      await loadPlans();
    } catch (err) {
      setError(err.message || 'Failed to save membership plan.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlan = async (plan) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the ${plan.name} plan?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError('');

      await apiRequest(`${API_URL}/${plan.id}`, {
        method: 'DELETE'
      });

      await loadPlans();
    } catch (err) {
      setError(err.message || 'Failed to delete membership plan.');
    }
  };

  const filteredPlans = plans.filter((plan) => {
    const matchesSearch = (plan.name || '')
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'All' || plan.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="plans-page">
      <div className="plans-header">
        <div>
          <h1>Membership Plans</h1>
          <p>Manage your gym membership plans.</p>
        </div>

        <button className="add-plan-btn" onClick={openAddForm}>
          + Add Plan
        </button>
      </div>

      {error && (
        <div className="error-message" role="alert">
          {error}
          <button
            type="button"
            onClick={() => setError('')}
            aria-label="Close error message"
          >
            ×
          </button>
        </div>
      )}

      <div className="plans-filters">
        <input
          type="text"
          className="plans-search"
          placeholder="Search membership plans..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {loading ? (
        <p className="plans-message">Loading membership plans...</p>
      ) : filteredPlans.length === 0 ? (
        <p className="plans-message">No membership plans found.</p>
      ) : (
        <div className="plans-grid">
          {filteredPlans.map((plan) => (
            <div className="plan-card" key={plan.id}>
              <div className="plan-card-top">
                <div className="plan-icon">
                  <span>🏋️</span>
                </div>

                <span
                  className={`plan-status ${
                    plan.status === 'Active' ? 'active' : 'inactive'
                  }`}
                >
                  {plan.status}
                </span>
              </div>

              <div className="plan-info">
                <h3>{plan.name}</h3>

                <p className="plan-duration">
                  {plan.duration}{' '}
                  {Number(plan.duration) === 1 ? 'Month' : 'Months'}
                </p>

                <p className="plan-description">{plan.description}</p>
              </div>

              <div className="plan-price">
                ₹{Number(plan.price).toLocaleString('en-IN')}
                <span> / plan</span>
              </div>

              <div className="plan-footer">
                <div className="plan-members">
                  <span>Membership duration</span>
                  <strong>
                    {plan.duration}{' '}
                    {Number(plan.duration) === 1 ? 'month' : 'months'}
                  </strong>
                </div>

                <div className="plan-actions">
                  <button
                    className="edit-plan-btn"
                    onClick={() => handleEditPlan(plan)}
                  >
                    Edit
                  </button>

                  <button
                    className="delete-plan-btn"
                    onClick={() => handleDeletePlan(plan)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div
          className="plan-modal-overlay"
          onClick={() => !saving && setShowForm(false)}
        >
          <div
            className="plan-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="plan-modal-header">
              <h2>
                {editingPlanId !== null
                  ? 'Edit Membership Plan'
                  : 'Add Membership Plan'}
              </h2>

              <button
                type="button"
                className="plan-close-btn"
                onClick={() => setShowForm(false)}
                disabled={saving}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSavePlan}>
              <div className="plan-modal-body">
                <div className="plan-form-grid">
                  <div className="plan-form-group">
                    <label htmlFor="name">Plan Name *</label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="e.g. Monthly"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="plan-form-group">
                    <label htmlFor="duration">Duration (Months) *</label>
                    <input
                      id="duration"
                      name="duration"
                      type="number"
                      min="1"
                      placeholder="e.g. 1"
                      value={formData.duration}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="plan-form-group">
                    <label htmlFor="price">Price (₹) *</label>
                    <input
                      id="price"
                      name="price"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="e.g. 1500"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="plan-form-group">
                    <label htmlFor="status">Status *</label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  <div className="plan-form-group full-width">
                    <label htmlFor="description">Description *</label>
                    <textarea
                      id="description"
                      name="description"
                      placeholder="Enter plan description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="3"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="plan-modal-footer">
                <button
                  type="button"
                  className="plan-cancel-btn"
                  onClick={() => setShowForm(false)}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-plan-btn"
                  disabled={saving}
                >
                  {saving
                    ? 'Saving...'
                    : editingPlanId !== null
                    ? 'Update Plan'
                    : 'Save Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MembershipPlans;
