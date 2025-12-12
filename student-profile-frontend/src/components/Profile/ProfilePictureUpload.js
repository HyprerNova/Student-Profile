import React, { useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import axios from 'axios';
import { API_BASE_URL } from '../../config.js';

const ProfilePictureUpload = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!file) return;

    const formData = new FormData();
    formData.append('picture', file);

    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      };
      await axios.post(`${API_BASE_URL}/profile/picture`, formData, config);
      setSuccess('Profile picture updated');
      onUploadSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed (e.g., 15-day lock)');
    }
  };

  return (
    <Form onSubmit={handleSubmit} className="mb-3">
      <Form.Group controlId="picture" className="mb-2">
        <Form.Label className="fw-semibold">Upload Profile Picture</Form.Label>
        <Form.Control type="file" onChange={(e) => setFile(e.target.files[0])} accept="image/*" />
        <Form.Text className="text-muted-2">JPG/PNG recommended.</Form.Text>
      </Form.Group>
      <Button variant="primary" type="submit" className="w-100">
        Upload
      </Button>
      {error && (
        <Alert variant="danger" className="mt-2 mb-0">
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" className="mt-2 mb-0">
          {success}
        </Alert>
      )}
    </Form>
  );
};

export default ProfilePictureUpload;
