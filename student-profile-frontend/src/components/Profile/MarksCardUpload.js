import React, { useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import axios from 'axios';

const MarksCardUpload = ({ grade, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    const formData = new FormData();
    formData.append('markscard', file);
    formData.append('type', grade);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } };
      await axios.post('http://localhost:3000/profile/markscard', formData, config);
      setSuccess(`${grade} marks card updated`);
      onUploadSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    }
  };

  return (
    <Form onSubmit={handleSubmit} className="mt-3">
      <Form.Group controlId={`${grade}-markscard`}>
        <Form.Label>Upload {grade} Marks Card</Form.Label>
        <Form.Control type="file" onChange={(e) => setFile(e.target.files[0])} accept=".pdf,image/*" />
      </Form.Group>
      <Button variant="primary" type="submit">Upload</Button>
      {error && <Alert variant="danger" className="mt-2">{error}</Alert>}
      {success && <Alert variant="success" className="mt-2">{success}</Alert>}
    </Form>
  );
};

export default MarksCardUpload;