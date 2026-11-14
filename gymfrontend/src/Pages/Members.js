
import { useCallback, useEffect, useState } from 'react';
import './Members.css';
import { authenticatedFetch } from '../authSession';

const API_URL = `${process.env.REACT_APP_API_URL}/api/members`;
const TRAINERS_API_URL = `${process.env.REACT_APP_API_URL}/api/trainers/active`;

const getToken = () => {
  return localStorage.getItem('token') ||
    sessionStorage.getItem('token');
};

const getAuthHeaders = () => {
  const token = getToken();

  if (!token) {
    throw new Error('Your session has expired. Please log in again.');
  }

  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

const getResponse = async (response) => {
  if (response.status === 401) {
    throw new Error(
      'Authentication failed. Please log in again.'
    );
  }

  if (response.status === 403) {
    throw new Error('You do not have permission to perform this action.');
  }

  if (!response.ok) {
    let message = 'Request failed. Please try again.';

    try {
      const data = await response.json();
      message = data.message || message;
    } catch {
      // Keep the default error message.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

function Members() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [showForm, setShowForm] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [members, setMembers] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [trainerLoadError, setTrainerLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const emptyForm = {
    name: '',
    phone: '',
    email: '',
    dob: '',
    gender: '',
    address: '',
    joiningDate: '',
    plan: '',
    trainerId: '',
    startDate: '',
    endDate: ''
  };

  const [formData, setFormData] = useState(emptyForm);

  const getMemberStatus = useCallback((member) => {
    if (!member.expiryDate) {
      return member.status || 'Active';
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiryDate = new Date(
      `${member.expiryDate}T00:00:00`
    );

    if (expiryDate < today) {
      return 'Expired';
    }

    const daysRemaining = Math.round(
      (expiryDate.getTime() - today.getTime()) /
      (1000 * 60 * 60 * 24)
    );

    if (
      daysRemaining <= 7 &&
      member.status?.toLowerCase() === 'active'
    ) {
      return 'Expiring Soon';
    }

    return member.status || 'Active';
  }, []);

  const mapMember = useCallback((member) => {
    return {
      backendId: member.id,
      id: `GM${String(member.id).padStart(3, '0')}`,
      name: member.name || '',
      phone: member.phone || '',
      email: member.email || '',
      dob: member.dateOfBirth || '',
      gender: member.gender || '',
      address: member.address || '',
      joiningDate: member.joiningDate || '',
      plan: member.membershipPlan || '',
      trainerId: member.trainerId ?? member.trainer?.id ?? '',
      trainerName: member.trainer?.name || member.trainerName || '',
      startDate: member.joiningDate || '',
      endDate: member.expiryDate || '',
      status: getMemberStatus(member)
    };
  }, [getMemberStatus]);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await authenticatedFetch(API_URL, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      const data = await getResponse(response);

      setMembers(data.map(mapMember));
    } catch (err) {
      setError(err.message || 'Unable to load members.');
    } finally {
      setLoading(false);
    }
  }, [mapMember]);

  const fetchTrainers = useCallback(async () => {
    setTrainerLoadError('');

    try {
      const response = await authenticatedFetch(TRAINERS_API_URL, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      const data = await getResponse(response);

      if (!Array.isArray(data)) {
        throw new Error('The server returned invalid trainer data.');
      }

      setTrainers(data);
    } catch (err) {
      setTrainerLoadError(err.message || 'Unable to load trainers.');
    }
  }, []);

  useEffect(() => {
    fetchMembers();
    fetchTrainers();
  }, [fetchMembers, fetchTrainers]);

  const calculateEndDate = (startDate, plan) => {
    if (!startDate || !plan) {
      return '';
    }

    const durations = {
      Monthly: 1,
      Quarterly: 3,
      'Half-Yearly': 6,
      Yearly: 12
    };

    const months = durations[plan];

    if (!months) {
      return '';
    }

    const [year, month, day] = startDate
      .split('-')
      .map(Number);

    const date = new Date(year, month - 1, day);
    const targetMonth = date.getMonth() + months;

    date.setDate(1);
    date.setMonth(targetMonth);

    const lastDayOfMonth = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0
    ).getDate();

    date.setDate(Math.min(day, lastDayOfMonth));

    const resultYear = date.getFullYear();
    const resultMonth = String(
      date.getMonth() + 1
    ).padStart(2, '0');
    const resultDay = String(
      date.getDate()
    ).padStart(2, '0');

    return `${resultYear}-${resultMonth}-${resultDay}`;
  };

  const validateField = (name, value, currentForm = formData) => {
    const trimmedValue = typeof value === 'string'
      ? value.trim()
      : '';

    const today = new Date();
    const todayString = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0')
    ].join('-');

    switch (name) {
      case 'name':
        if (!trimmedValue) {
          return 'Full name is required.';
        }
        if (trimmedValue.length < 2) {
          return 'Name must contain at least 2 characters.';
        }
        return '';

      case 'phone':
        if (!trimmedValue) {
          return 'Phone number is required.';
        }
        if (!/^[0-9]{10}$/.test(trimmedValue)) {
          return 'Enter exactly 10 digits.';
        }
        return '';

      case 'email':
        if (
          trimmedValue &&
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedValue)
        ) {
          return 'Enter a valid email address.';
        }
        return '';

      case 'dob':
        if (value && value > todayString) {
          return 'Date of birth cannot be in the future.';
        }
        return '';

      case 'gender':
        if (!value) {
          return 'Please select a gender.';
        }
        return '';

      case 'address':
        if (!trimmedValue) {
          return 'Address is required.';
        }
        return '';

      case 'joiningDate':
      case 'startDate':
        if (!value) {
          return 'Membership start date is required.';
        }
        if (value > todayString) {
          return 'Membership start date cannot be in the future.';
        }
        return '';

      case 'plan':
        if (!value) {
          return 'Please select a membership plan.';
        }
        return '';

      case 'trainerId':
        if (!value) {
          return 'Please select a trainer.';
        }
        return '';

      case 'endDate':
        if (!currentForm.endDate) {
          return 'Select a start date and membership plan to calculate the end date.';
        }
        return '';

      default:
        return '';
    }
  };

  const validateForm = () => {
    const errors = {};

    const fieldsToValidate = [
      'name',
      'phone',
      'email',
      'dob',
      'gender',
      'address',
      'joiningDate',
      'plan',
      'trainerId',
      'endDate'
    ];

    fieldsToValidate.forEach((field) => {
      const value = field === 'joiningDate'
        ? formData.startDate
        : formData[field];

      const message = validateField(field, value, formData);

      if (message) {
        errors[field] = message;
      }
    });

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    let updatedForm;

    if (name === 'startDate' || name === 'joiningDate') {
      updatedForm = {
        ...formData,
        startDate: value,
        joiningDate: value,
        endDate: calculateEndDate(value, formData.plan)
      };
    } else if (name === 'plan') {
      updatedForm = {
        ...formData,
        plan: value,
        endDate: calculateEndDate(formData.startDate, value)
      };
    } else {
      updatedForm = {
        ...formData,
        [name]: value
      };
    }

    setFormData(updatedForm);

    const fieldsToUpdate = name === 'startDate' || name === 'joiningDate'
      ? ['joiningDate', 'endDate']
      : name === 'plan'
        ? ['plan', 'endDate']
        : [name];

    setFieldErrors((previous) => {
      const updatedErrors = { ...previous };

      fieldsToUpdate.forEach((field) => {
        const fieldValue = field === 'joiningDate'
          ? updatedForm.startDate
          : updatedForm[field];

        const message = validateField(field, fieldValue, updatedForm);

        if (message) {
          updatedErrors[field] = message;
        } else {
          delete updatedErrors[field];
        }
      });

      return updatedErrors;
    });

    setError('');
  };

  const openAddForm = () => {
    setEditingMemberId(null);
    setFormData({ ...emptyForm });
    setFieldErrors({});
    setError('');
    setShowForm(true);
  };

  const openEditForm = (member) => {
    setEditingMemberId(member.backendId);

    setFormData({
      name: member.name,
      phone: member.phone,
      email: member.email,
      dob: member.dob,
      gender: member.gender,
      address: member.address,
      joiningDate: member.joiningDate,
      plan: member.plan,
      trainerId: member.trainerId ?? '',
      startDate: member.startDate,
      endDate: member.endDate
    });

    setFieldErrors({});
    setError('');
    setShowForm(true);
  };

  const handleSaveMember = async () => {
    if (!validateForm()) {
      return;
    }

    const memberData = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      dateOfBirth: formData.dob || null,
      gender: formData.gender,
      address: formData.address.trim(),
      membershipPlan: formData.plan,
      joiningDate: formData.startDate,
      trainer: {
        id: Number(formData.trainerId)
      }
    };

    setSaving(true);
    setError('');

    try {
      const isEditing = editingMemberId !== null;

      const response = await authenticatedFetch(
        isEditing
          ? `${API_URL}/${editingMemberId}`
          : API_URL,
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(memberData)
        }
      );

      await getResponse(response);

      setShowForm(false);
      setEditingMemberId(null);
      setFormData({ ...emptyForm });
      setFieldErrors({});

      await fetchMembers();
    } catch (err) {
      setError(err.message || 'Unable to save member.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMember = async (member) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${member.name}?`
    );

    if (!confirmed) {
      return;
    }

    setError('');

    try {
      const response = await authenticatedFetch(
        `${API_URL}/${member.backendId}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders()
        }
      );

      await getResponse(response);

      await fetchMembers();
    } catch (err) {
      setError(err.message || 'Unable to delete member.');
    }
  };

  const renderFieldError = (field) => {
    if (!fieldErrors[field]) {
      return null;
    }

    return (
      <small className="field-error" role="alert">
        {fieldErrors[field]}
      </small>
    );
  };

  const filteredMembers = members.filter((member) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      member.name.toLowerCase().includes(searchText) ||
      member.id.toLowerCase().includes(searchText) ||
      member.phone.includes(search);

    const matchesStatus =
      statusFilter === 'All Status' ||
      member.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const activeTrainers = trainers;

  return (
    <div className="members-page">

      <div className="members-header">
        <div>
          <h1>Members</h1>
          <p>Manage your gym members and membership details.</p>
        </div>

        <button
          className="add-member-btn"
          onClick={openAddForm}
        >
          + Add Member
        </button>
      </div>

      {error && (
        <div className="members-error" role="alert">
          {error}
          <button
            type="button"
            onClick={() => setError('')}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      <div className="members-card">

        <div className="members-toolbar">
          <div className="search-box">
            <span>🔍</span>

            <input
              type="text"
              placeholder="Search members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option>All Status</option>
            <option>Active</option>
            <option>Expiring Soon</option>
            <option>Expired</option>
          </select>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Member ID</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Plan</th>
                <th>Trainer</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9}>Loading members...</td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    {members.length === 0
                      ? 'No members found in the database.'
                      : 'No members match your search.'}
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr key={member.backendId}>
                    <td>{member.id}</td>

                    <td>
                      <div className="member-name">
                        {member.name}
                      </div>
                    </td>

                    <td>{member.phone}</td>
                    <td>{member.plan}</td>
                    <td>
                      {member.trainerName || trainers.find(
                        (trainer) => String(trainer.id) === String(member.trainerId)
                      )?.name || 'Unassigned'}
                    </td>
                    <td>{member.startDate}</td>
                    <td>{member.endDate}</td>

                    <td>
                      <span
                        className={`member-status ${member.status
                          .toLowerCase()
                          .replace(' ', '-')}`}
                      >
                        {member.status}
                      </span>
                    </td>

                    <td>
                      <div className="action-buttons">
                        <button
                          className="edit-btn"
                          onClick={() => openEditForm(member)}
                        >
                          Edit
                        </button>

                        <button
                          className="edit-btn"
                          onClick={() => handleDeleteMember(member)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="member-modal">

            <div className="modal-header">
              <div>
                <h2>
                  {editingMemberId !== null
                    ? 'Edit Member'
                    : 'Add New Member'}
                </h2>

                <p>
                  {editingMemberId !== null
                    ? 'Update member information.'
                    : 'Add a new member to your gym.'}
                </p>
              </div>

              <button
                className="close-btn"
                onClick={() => {
                  setShowForm(false);
                  setFieldErrors({});
                  setError('');
                }}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-grid">

                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter full name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={fieldErrors.name ? 'input-error' : ''}
                    aria-invalid={Boolean(fieldErrors.name)}
                  />
                  {renderFieldError('name')}
                </div>

                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="10-digit phone number"
                    value={formData.phone}
                    onChange={handleInputChange}
                    maxLength="10"
                    className={fieldErrors.phone ? 'input-error' : ''}
                    aria-invalid={Boolean(fieldErrors.phone)}
                  />
                  {renderFieldError('phone')}
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={fieldErrors.email ? 'input-error' : ''}
                    aria-invalid={Boolean(fieldErrors.email)}
                  />
                  {renderFieldError('email')}
                </div>

                <div className="form-group">
                  <label>Date of Birth</label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleInputChange}
                    max={new Date().toISOString().split('T')[0]}
                    className={fieldErrors.dob ? 'input-error' : ''}
                    aria-invalid={Boolean(fieldErrors.dob)}
                  />
                  {renderFieldError('dob')}
                </div>

                <div className="form-group">
                  <label>Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className={fieldErrors.gender ? 'input-error' : ''}
                    aria-invalid={Boolean(fieldErrors.gender)}
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {renderFieldError('gender')}
                </div>

                <div className="form-group">
                  <label>Joining Date</label>
                  <input
                    type="date"
                    name="joiningDate"
                    value={formData.joiningDate}
                    onChange={handleInputChange}
                    max={new Date().toISOString().split('T')[0]}
                    className={fieldErrors.joiningDate ? 'input-error' : ''}
                    aria-invalid={Boolean(fieldErrors.joiningDate)}
                  />
                  {renderFieldError('joiningDate')}
                </div>

                <div className="form-group full-width">
                  <label>Address</label>
                  <textarea
                    name="address"
                    placeholder="Enter address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows="3"
                    className={fieldErrors.address ? 'input-error' : ''}
                    aria-invalid={Boolean(fieldErrors.address)}
                  />
                  {renderFieldError('address')}
                </div>

                <div className="form-group">
                  <label>Membership Plan</label>
                  <select
                    name="plan"
                    value={formData.plan}
                    onChange={handleInputChange}
                    className={fieldErrors.plan ? 'input-error' : ''}
                    aria-invalid={Boolean(fieldErrors.plan)}
                  >
                    <option value="">Select plan</option>
                    <option value="Monthly">Monthly - 1 Month</option>
                    <option value="Quarterly">Quarterly - 3 Months</option>
                    <option value="Half-Yearly">Half-Yearly - 6 Months</option>
                    <option value="Yearly">Yearly - 12 Months</option>
                  </select>
                  {renderFieldError('plan')}
                </div>

                <div className="form-group">
                  <label>Assigned Trainer</label>
                  <select
                    name="trainerId"
                    value={formData.trainerId}
                    onChange={handleInputChange}
                    className={fieldErrors.trainerId ? 'input-error' : ''}
                    aria-invalid={Boolean(fieldErrors.trainerId)}
                    disabled={activeTrainers.length === 0}
                  >
                    <option value="">
                      {activeTrainers.length === 0
                        ? 'No active trainers available'
                        : 'Select trainer'}
                    </option>
                    {activeTrainers.map((trainer) => (
                      <option key={trainer.id} value={trainer.id}>
                        {trainer.name}
                      </option>
                    ))}
                  </select>
                  {trainerLoadError && (
                    <small className="field-error" role="alert">
                      {trainerLoadError}
                    </small>
                  )}
                  {renderFieldError('trainerId')}
                </div>

                <div className="form-group">
                  <label>Membership Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    max={new Date().toISOString().split('T')[0]}
                    className={fieldErrors.joiningDate ? 'input-error' : ''}
                    aria-invalid={Boolean(fieldErrors.joiningDate)}
                  />
                  {renderFieldError('joiningDate')}
                </div>

                <div className="form-group full-width">
                  <label>Membership End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    readOnly
                    className={fieldErrors.endDate ? 'input-error' : ''}
                    aria-invalid={Boolean(fieldErrors.endDate)}
                  />
                  {renderFieldError('endDate')}
                </div>

              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => {
                  setShowForm(false);
                  setFieldErrors({});
                  setError('');
                }}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="button"
                className="save-member-btn"
                onClick={handleSaveMember}
                disabled={saving}
              >
                {saving
                  ? 'Saving...'
                  : editingMemberId !== null
                    ? 'Save Changes'
                    : 'Save Member'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Members;
