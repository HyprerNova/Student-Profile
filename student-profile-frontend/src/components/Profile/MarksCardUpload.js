import React, { useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import axios from 'axios';
import { API_BASE_URL } from '../../config.js';

const MarksCardUpload = ({ grade, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setUploading(true);

    if (!file) {
      setUploading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');

      const formData = new FormData();
      formData.append('markscard', file);
      formData.append('type', grade);

      await axios.post(`${API_BASE_URL}/profile/markscard`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess(`${grade} marks card uploaded successfully!`);
      onUploadSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group controlId={`${grade}-markscard`} className="mb-2">
        <Form.Label className="fw-semibold">
          Upload {grade} Marks Card
        </Form.Label>
        <Form.Control
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          accept=".pdf,image/*"
          disabled={uploading}
        />
      </Form.Group>
      <Button
        variant="primary"
        type="submit"
        className="w-100"
        disabled={uploading}
      >
        {uploading ? 'Uploading...' : 'Upload'}
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

export default MarksCardUpload;
