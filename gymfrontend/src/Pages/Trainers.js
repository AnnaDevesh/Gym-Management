
import { useEffect, useState } from 'react';
import './Trainers.css';
import { authenticatedFetch, getAuthRole } from '../authSession';

const API_URL = `${process.env.REACT_APP_API_URL}/api/trainers`;
const MEMBERS_API_URL = `${process.env.REACT_APP_API_URL}/api/members`;

function Trainers() {
  const isAdmin = getAuthRole().toUpperCase() === 'ADMIN';

  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingTrainerId, setEditingTrainerId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingTrainerId, setDeletingTrainerId] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [formData, setFormData] = useState({
    name: '',
    specialization: '',
    experience: '',
    phone: '',
    email: '',
    password: '',
    status: 'Active'
  });

  const fetchTrainers = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token') ||
        sessionStorage.getItem('token');

      if (!token) {
        throw new Error('Your session has expired. Please log in again.');
      }

      const requestOptions = {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      const [response, membersResponse] = await Promise.all([
        authenticatedFetch(API_URL, requestOptions),
        authenticatedFetch(MEMBERS_API_URL, requestOptions)
      ]);

      if ([response, membersResponse].some((item) => item.status === 401)) {
        throw new Error('Authentication failed. Please log in again.');
      }

      if ([response, membersResponse].some((item) => item.status === 403)) {
        throw new Error('You do not have permission to view this information.');
      }

      if (!response.ok || !membersResponse.ok) {
        throw new Error('Failed to load trainers and assigned members.');
      }

      const [data, members] = await Promise.all([
        response.json(),
        membersResponse.json()
      ]);

      if (!Array.isArray(data) || !Array.isArray(members)) {
        throw new Error('The server returned invalid trainer or member data.');
      }

      const assignedMemberCounts = members.reduce((counts, member) => {
        const trainerId = member.trainerId ?? member.trainer?.id;

        if (trainerId !== null && trainerId !== undefined) {
          const id = String(trainerId);
          counts[id] = (counts[id] || 0) + 1;
        }

        return counts;
      }, {});

      setTrainers(data.map((trainer) => ({
        ...trainer,
        name: trainer.name || '',
        specialization: trainer.specialization || '',
        experience: trainer.experience ?? 0,
        phone: trainer.phone || '',
        email: trainer.email || '',
        status: trainer.status || 'Active',
        members: assignedMemberCounts[String(trainer.id)] || 0
      })));
    } catch (err) {
      setError(err.message || 'Unable to load trainers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainers();
  }, []);


  const handleInputChange = (e) => {

    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value
    });

  };


  const openAddForm = () => {

    setEditingTrainerId(null);

    setFormData({
      name: '',
      specialization: '',
      experience: '',
      phone: '',
      email: '',
      password: '',
      status: 'Active'
    });

    setShowForm(true);

  };


  const openEditForm = (trainer) => {

    setEditingTrainerId(trainer.id);

    setFormData({
      name: trainer.name,
      specialization: trainer.specialization,
      experience: trainer.experience,
      phone: trainer.phone,
      email: trainer.email,
      password: '',
      status: trainer.status
    });

    setShowForm(true);

  };


  const closeForm = () => {

    setShowForm(false);
    setEditingTrainerId(null);

  };


  const handleSaveTrainer = async () => {

    if (
      !formData.name ||
      !formData.specialization ||
      !formData.experience ||
      !formData.phone ||
      !formData.email ||
      (editingTrainerId === null && formData.password.length < 8)
    ) {
      alert('Please complete all required fields. New trainer passwords must be at least 8 characters.');
      return;
    }


    const token = localStorage.getItem('token') ||
      sessionStorage.getItem('token');

    if (!token) {
      setError('Your session has expired. Please log in again.');
      return;
    }

    const trainerData = {
      name: formData.name.trim(),
      specialization: formData.specialization.trim(),
      experience: Number(formData.experience),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      status: formData.status
    };

    if (editingTrainerId === null) {
      trainerData.password = formData.password;
    }

    try {
      setSaving(true);
      setError('');

      const response = await authenticatedFetch(
        editingTrainerId !== null
          ? `${API_URL}/${editingTrainerId}`
          : API_URL,
        {
          method: editingTrainerId !== null ? 'PUT' : 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(trainerData)
        }
      );

      if (response.status === 401 || response.status === 403) {
        throw new Error(response.status === 401
          ? 'Authentication failed. Please log in again.'
          : 'Only an admin can create or update trainers.');
      }

      if (!response.ok) {
        const fallbackMessage =
          `Failed to save trainer (HTTP ${response.status}).`;
        const responseText = await response.text();
        let message = responseText || fallbackMessage;

        try {
          const errorData = JSON.parse(responseText);
          message = errorData.message || message;
        } catch {
          // Keep the response text when the server does not return JSON.
        }

        throw new Error(message);
      }

      setShowForm(false);
      setEditingTrainerId(null);
      setFormData({
        name: '',
        specialization: '',
        experience: '',
        phone: '',
        email: '',
        password: '',
        status: 'Active'
      });

      await fetchTrainers();
    } catch (err) {
      setError(err.message || 'Unable to save trainer.');
    } finally {
      setSaving(false);
    }

  };

  const handleDeleteTrainer = async (trainer) => {
    const confirmed = window.confirm(
      `Delete ${trainer.name}? Their assigned members will remain but become unassigned.`
    );

    if (!confirmed) {
      return;
    }

    const token = localStorage.getItem('token') ||
      sessionStorage.getItem('token');

    if (!token) {
      setError('Your session has expired. Please log in again.');
      return;
    }

    try {
      setDeletingTrainerId(trainer.id);
      setError('');

      const response = await authenticatedFetch(`${API_URL}/${trainer.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error(response.status === 401
          ? 'Authentication failed. Please log in again.'
          : 'Only an admin can delete trainers.');
      }

      if (!response.ok) {
        throw new Error(`Failed to delete trainer (HTTP ${response.status}).`);
      }

      await fetchTrainers();
    } catch (err) {
      setError(err.message || 'Unable to delete trainer.');
    } finally {
      setDeletingTrainerId(null);
    }
  };


  const filteredTrainers = trainers.filter((trainer) => {

    const matchesSearch =
      trainer.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      trainer.specialization
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'All' ||
      trainer.status === statusFilter;

    return matchesSearch && matchesStatus;

  });


  return (
    <div className="trainers-page">


      {/* Header */}

      <div className="trainers-header">

        <div>

          <h1>Trainers</h1>

          <p>
            Manage your gym trainers and their information.
          </p>

        </div>

        {isAdmin && (
          <button
            className="add-trainer-btn"
            onClick={openAddForm}
          >
            + Add Trainer
          </button>
        )}

      </div>


      {/* Filters */}

      <div className="trainers-filters">

        <div className="trainers-search">

          <span>🔍</span>

          <input
            type="text"
            placeholder="Search trainers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

        </div>


        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >

          <option value="All">
            All Trainers
          </option>

          <option value="Active">
            Active
          </option>

          <option value="Inactive">
            Inactive
          </option>

        </select>

      </div>


      {/* Trainers */}

      <div className="trainers-grid">

        {loading ? (
          <div className="no-trainers">
            <h3>Loading trainers...</h3>
          </div>
        ) : error ? (
          <div className="no-trainers" role="alert">
            <h3>Unable to load trainers</h3>
            <p>{error}</p>
            <button onClick={fetchTrainers}>Retry</button>
          </div>
        ) : filteredTrainers.map((trainer) => (

          <div
            className="trainer-card"
            key={trainer.id}
          >


            <div className="trainer-card-top">

              <div className="trainer-avatar">
                {trainer.name.charAt(0)}
              </div>

              <span
                className={`trainer-status ${
                  trainer.status.toLowerCase()
                }`}
              >
                {trainer.status}
              </span>

            </div>


            <div className="trainer-info">

              <h2>
                {trainer.name}
              </h2>

              <p className="trainer-specialization">
                {trainer.specialization}
              </p>

            </div>


            <div className="trainer-details">

              <div className="trainer-detail">

                <span>💼</span>

                <div>
                  <small>Experience</small>
                  <strong>
                    {trainer.experience} Years
                  </strong>
                </div>

              </div>


              <div className="trainer-detail">

                <span>👥</span>

                <div>
                  <small>Members</small>
                  <strong>
                    {trainer.members}
                  </strong>
                </div>

              </div>


              <div className="trainer-detail">

                <span>📞</span>

                <div>
                  <small>Phone</small>
                  <strong>
                    {trainer.phone}
                  </strong>
                </div>

              </div>


              <div className="trainer-detail">

                <span>✉️</span>

                <div>
                  <small>Email</small>
                  <strong>
                    {trainer.email}
                  </strong>
                </div>

              </div>

            </div>


            <div className="trainer-footer">

              <span>
                {trainer.members} Assigned Members
              </span>

              {isAdmin && (
                <div className="trainer-actions">
                  <button
                    className="edit-trainer-btn"
                    onClick={() => openEditForm(trainer)}
                  >
                    Edit
                  </button>
                  <button
                    className="delete-trainer-btn"
                    onClick={() => handleDeleteTrainer(trainer)}
                    disabled={deletingTrainerId === trainer.id}
                  >
                    {deletingTrainerId === trainer.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              )}

            </div>

          </div>

        ))}


        {!loading && !error && filteredTrainers.length === 0 && (

          <div className="no-trainers">

            <div>
              👥
            </div>

            <h3>
              No trainers found
            </h3>

            <p>
              Try changing your search or filter.
            </p>

          </div>

        )}

      </div>


      {/* Add / Edit Modal */}

      {showForm && (

        <div className="trainer-modal-overlay">

          <div className="trainer-modal">


            <div className="trainer-modal-header">

              <div>

                <h2>
                  {editingTrainerId !== null
                    ? 'Edit Trainer'
                    : 'Add New Trainer'}
                </h2>

                <p>
                  {editingTrainerId !== null
                    ? 'Update trainer information.'
                    : 'Add a new trainer to your gym.'}
                </p>

              </div>


              <button
                className="trainer-close-btn"
                onClick={closeForm}
              >
                ×
              </button>

            </div>


            <div className="trainer-modal-body">

              <div className="trainer-form-grid">


                <div className="trainer-form-group">

                  <label>
                    Trainer Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    placeholder="Example: Rahul Kumar"
                    value={formData.name}
                    onChange={handleInputChange}
                  />

                </div>

                {editingTrainerId === null && (
                  <div className="trainer-form-group">
                    <label htmlFor="trainer-password">Login Password</label>
                    <input
                      id="trainer-password"
                      type="password"
                      name="password"
                      placeholder="At least 8 characters"
                      minLength="8"
                      value={formData.password}
                      onChange={handleInputChange}
                      autoComplete="new-password"
                      required
                    />
                    <small>This password will be used by the trainer to log in.</small>
                  </div>
                )}


                <div className="trainer-form-group">

                  <label>
                    Specialization
                  </label>

                  <input
                    type="text"
                    name="specialization"
                    placeholder="Example: Strength Training"
                    value={formData.specialization}
                    onChange={handleInputChange}
                  />

                </div>


                <div className="trainer-form-group">

                  <label>
                    Experience
                  </label>

                  <div className="experience-input">

                    <input
                      type="number"
                      name="experience"
                      placeholder="Example: 5"
                      min="0"
                      value={formData.experience}
                      onChange={handleInputChange}
                    />

                    <span>
                      Years
                    </span>

                  </div>

                </div>


                <div className="trainer-form-group">

                  <label>
                    Phone Number
                  </label>

                  <input
                    type="text"
                    name="phone"
                    placeholder="Example: 9876543210"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />

                </div>


                <div className="trainer-form-group">

                  <label>
                    Email
                  </label>

                  <input
                    type="email"
                    name="email"
                    placeholder="Example: trainer@gym.com"
                    value={formData.email}
                    onChange={handleInputChange}
                  />

                </div>


                <div className="trainer-form-group">

                  <label>
                    Status
                  </label>

                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >

                    <option value="Active">
                      Active
                    </option>

                    <option value="Inactive">
                      Inactive
                    </option>

                  </select>

                </div>

              </div>

            </div>


            <div className="trainer-modal-footer">

              <button
                className="trainer-cancel-btn"
                onClick={closeForm}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                className="save-trainer-btn"
                onClick={handleSaveTrainer}
                disabled={saving}
              >
                {saving
                  ? 'Saving...'
                  : editingTrainerId !== null
                  ? 'Update Trainer'
                  : 'Save Trainer'}
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default Trainers;
