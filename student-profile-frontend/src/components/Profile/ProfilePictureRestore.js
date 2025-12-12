import React, { useState } from 'react';
import { Button, Alert } from 'react-bootstrap';
import axios from 'axios';

const ProfilePictureRestore = ({ onRestoreSuccess }) => {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRestore = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post('http://localhost:3000/profile/picture/restore', {}, config);
      setSuccess('Old profile picture restored');
      onRestoreSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Restore failed (e.g., no old picture or expired)');
    }
  };

  return (
    <div className="mt-3">
      <Button variant="secondary" onClick={handleRestore}>Restore Old Picture</Button>
      {error && <Alert variant="danger" className="mt-2">{error}</Alert>}
      {success && <Alert variant="success" className="mt-2">{success}</Alert>}
    </div>
  );
};

export default ProfilePictureRestore;