"use client";

import React, { useState, useEffect } from 'react';

type Worker = {
  id: number;
  displayId: string;
  name: string;
  email: string;
  phone: string;
  userType: string;
  subject: string | null;
  createdAt: string;
};

export default function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    userType: 'teacher',
    subject: ''
  });

  const fetchWorkers = async () => {
    try {
      const res = await fetch('/api/workers');
      const data = await res.json();
      setWorkers(data);
    } catch (error) {
      console.error("Error fetching workers", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Worker Added! ID: ${data.displayId}, Temporary Password: ${data.password}`);
        setFormData({ name: '', email: '', phone: '', address: '', userType: 'teacher', subject: '' });
        fetchWorkers();
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      console.error("Registration error", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this worker?")) return;
    try {
      const res = await fetch(`/api/workers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchWorkers();
      } else {
        alert("Failed to delete.");
      }
    } catch (error) {
      console.error("Delete error", error);
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '24px' }}>Staff & Worker Management</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        {/* Left Column: Form */}
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px' }}>Register New Staff</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input required type="text" name="name" className="form-input" value={formData.name} onChange={handleChange} placeholder="e.g. John Doe" />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input required type="email" name="email" className="form-input" value={formData.email} onChange={handleChange} placeholder="john@school.com" />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input required type="tel" name="phone" className="form-input" value={formData.phone} onChange={handleChange} placeholder="+251 911..." />
            </div>

            <div className="form-group">
              <label className="form-label">Address</label>
              <input required type="text" name="address" className="form-input" value={formData.address} onChange={handleChange} placeholder="Addis Ababa..." />
            </div>

            <div className="form-group">
              <label className="form-label">Role</label>
              <select name="userType" className="form-select" value={formData.userType} onChange={handleChange}>
                <option value="teacher">Teacher</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            {formData.userType === 'teacher' && (
              <div className="form-group">
                <label className="form-label">Subject specialisation</label>
                <input required type="text" name="subject" className="form-input" value={formData.subject} onChange={handleChange} placeholder="e.g. Mathematics" />
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Register Staff Member</button>
          </form>
        </div>

        {/* Right Column: Table */}
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px' }}>Staff Directory</h2>
          
          <div className="table-container">
            {loading ? (
              <p>Loading staff...</p>
            ) : workers.length === 0 ? (
              <p>No staff members found.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Contact</th>
                    <th>Role</th>
                    <th>Subject</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {workers.map(worker => (
                    <tr key={worker.id}>
                      <td style={{ fontWeight: 600 }}>{worker.displayId}</td>
                      <td>{worker.name}</td>
                      <td>
                        <div style={{ fontSize: '0.875rem' }}>{worker.email}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{worker.phone}</div>
                      </td>
                      <td>
                        <span className={`badge ${worker.userType === 'teacher' ? 'badge-teacher' : 'badge-admin'}`}>
                          {worker.userType.charAt(0).toUpperCase() + worker.userType.slice(1)}
                        </span>
                      </td>
                      <td>{worker.subject || '-'}</td>
                      <td>
                        <button onClick={() => handleDelete(worker.id)} className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
