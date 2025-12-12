import React, { useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import axios from 'axios';

const ProfilePictureUpload = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    const formData = new FormData();
    formData.append('picture', file);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } };
      await axios.post('http://localhost:3000/profile/picture', formData, config);
      setSuccess('Profile picture updated');
      onUploadSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed (e.g., 15-day lock)');
    }
  };

  return (
    <Form onSubmit={handleSubmit} className="mt-3">
      <Form.Group controlId="picture">
        <Form.Label>Upload Profile Picture</Form.Label>
        <Form.Control type="file" onChange={(e) => setFile(e.target.files[0])} accept="image/*" />
      </Form.Group>
      <Button variant="primary" type="submit">Upload</Button>
      {error && <Alert variant="danger" className="mt-2">{error}</Alert>}
      {success && <Alert variant="success" className="mt-2">{success}</Alert>}
    </Form>
  );
};

export default ProfilePictureUpload;