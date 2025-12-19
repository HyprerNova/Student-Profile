import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Image,
  Alert,
  Card,
  Badge,
  Button,
} from 'react-bootstrap';
import axios from 'axios';
import ProfilePictureUpload from './ProfilePictureUpload';
import ProfilePictureRestore from './ProfilePictureRestore';
import MarksCardUpload from './MarksCardUpload';
import { API_BASE_URL } from '../../config.js';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [marksCards, setMarksCards] = useState({ tenth: null });
  const [error, setError] = useState('');

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`${API_BASE_URL}/profile`, config);
      console.log('Profile:', res.data);
      console.log('Profile URL:', res.data.profilePictureUrl);
      setProfile(res.data);
    } catch (err) {
      setError('Failed to fetch profile');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      localStorage.removeItem('token');
      alert('Your account has been permanently deleted.');
      window.location.href = '/';
    } catch (err) {
      alert(
        'Failed to delete account: ' +
          (err.response?.data?.message || 'Unknown error')
      );
    }
  };

  const fetchMarksCards = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`${API_BASE_URL}/profile/markscard`, config);
      console.log('Marks cards:', res.data);
      console.log('10th URL:', res.data.tenthUrl);
      setMarksCards({ tenth: res.data.tenthUrl });
    } catch (err) {
      setError('Failed to fetch marks cards');
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchMarksCards();
  }, []);

  if (!profile) {
    return (
      <Container className="app-main">
        <div className="text-muted-2">Loading profile…</div>
      </Container>
    );
  }

  return (
    <Container className="app-main">
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
        <div>
          <h2 className="h3 fw-semibold page-title mb-1">Profile Settings</h2>
          <div className="text-muted-2">
            Change your profile picture and marks card.
          </div>
        </div>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <Badge bg="light" text="dark" className="border">
            Signed in as <span className="fw-semibold">{profile.email}</span>
          </Badge>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              if (
                window.confirm(
                  'Delete your account? This permanently removes all data including S3 files.'
                )
              ) {
                handleDeleteAccount();
              }
            }}
          >
            Delete Account
          </Button>
        </div>
      </div>
      {error && <Alert variant="danger">{error}</Alert>}
      <Row className="g-4">
        <Col lg={4}>
          <Card className="shadow-soft">
            <Card.Body className="p-4">
              <div className="text-center">
                <Image
                  src={profile.profilePictureUrl}
                  alt="Profile"
                  className="profile-avatar"
                />
                <div className="mt-3">
                  <div className="fw-semibold fs-5">{profile.name}</div>
                  <div className="text-muted-2">{profile.email}</div>
                </div>
              </div>

              <div className="mt-4">
                <ProfilePictureUpload onUploadSuccess={fetchProfile} />
                <ProfilePictureRestore onRestoreSuccess={fetchProfile} />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={8}>
          <Card className="shadow-soft">
            <Card.Body className="p-4 p-md-5">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                <div>
                  <h3 className="h5 fw-semibold mb-1">Marks Cards</h3>
                  <div className="text-muted-2">
                    Upload PDFs or images. Use the links to view.
                  </div>
                </div>
              </div>

              <Row className="g-3 mb-3">
                <Col md={6}>
                  <Card className="h-100">
                    <Card.Body>
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="fw-semibold">10th Grade</div>
                        {marksCards.tenth ? (
                          <Badge bg="success">Uploaded</Badge>
                        ) : (
                          <Badge bg="secondary">Missing</Badge>
                        )}
                      </div>
                      <div className="mt-3 d-flex gap-2 flex-wrap">
                        <Button
                          variant={
                            marksCards.tenth
                              ? 'outline-primary'
                              : 'outline-secondary'
                          }
                          size="sm"
                          as="a"
                          href={marksCards.tenth || undefined}
                          target="_blank"
                          rel="noreferrer"
                          disabled={!marksCards.tenth}
                        >
                          View
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <div className="border-top pt-3">
                <Row className="g-3">
                  <Col md={6}>
                    <MarksCardUpload
                      grade="10th"
                      onUploadSuccess={fetchMarksCards}
                    />
                  </Col>
                </Row>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Profile;
