import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Image, Button, Alert } from 'react-bootstrap';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import ProfilePictureUpload from './ProfilePictureUpload';
import ProfilePictureRestore from './ProfilePictureRestore';
import MarksCardUpload from './MarksCardUpload';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [marksCards, setMarksCards] = useState({ tenth: null, twelfth: null });
  const [error, setError] = useState('');
  const { user } = useContext(AuthContext);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get('http://localhost:3000/profile', config);
      setProfile(res.data);
    } catch (err) {
      setError('Failed to fetch profile');
    }
  };

  const fetchMarksCards = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get('http://localhost:3000/profile/markscard', config);
      setMarksCards({ tenth: res.data.tenthUrl, twelfth: res.data.twelfthUrl });  // Assuming pre-signed URLs
    } catch (err) {
      setError('Failed to fetch marks cards');
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchMarksCards();
  }, []);

  if (!profile) return <p>Loading...</p>;

  return (
    <Container className="mt-5">
      <h2>Profile</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      <Row>
        <Col md={4}>
          <Image src={profile.profilePictureUrl} rounded fluid />  // Pre-signed URL from backend
          <ProfilePictureUpload onUploadSuccess={fetchProfile} />
          <ProfilePictureRestore onRestoreSuccess={fetchProfile} />
        </Col>
        <Col md={8}>
          <p><strong>Name:</strong> {profile.name}</p>
          <p><strong>Email:</strong> {profile.email}</p>
          <h4>Marks Cards</h4>
          <p>10th Grade: {marksCards.tenth ? <a href={marksCards.tenth}>View</a> : 'Not uploaded'}</p>
          <p>12th Grade: {marksCards.twelfth ? <a href={marksCards.twelfth}>View</a> : 'Not uploaded'}</p>
          <MarksCardUpload grade="10th" onUploadSuccess={fetchMarksCards} />
          <MarksCardUpload grade="12th" onUploadSuccess={fetchMarksCards} />
        </Col>
      </Row>
    </Container>
  );
};

export default Profile;