import React, { useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import axios from 'axios';
import { API_BASE_URL } from '../../config.js';

const MarksCardUpload = ({ grade, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!file) return;

    const formData = new FormData();
    formData.append('markscard', file);
    formData.append('type', grade);

    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      };
      await axios.post(`${API_BASE_URL}/profile/markscard`, formData, config);
      setSuccess(`${grade} marks card updated`);
      onUploadSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group controlId={`${grade}-markscard`} className="mb-2">
        <Form.Label className="fw-semibold">Upload {grade} Marks Card</Form.Label>
        <Form.Control
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          accept=".pdf,image/*"
        />
        <Form.Text className="text-muted-2">PDF or image (JPG/PNG).</Form.Text>
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

export default MarksCardUpload;
