import React, { useEffect, useState, useContext } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Image,
  Badge,
  Button,
  Alert,
} from 'react-bootstrap';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
const API_BASE_URL = 'http://13.203.203.10:5000';
//import API_BASE_URL from '../../config'

const Dashboard = () => {
  const { user, refreshProfile } = useContext(AuthContext);
  const [marksCardUrl, setMarksCardUrl] = useState(null);
  const [error, setError] = useState('');

  const fetchMarksCard = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const res = await axios.get(`${API_BASE_URL}/profile/markscard`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    setMarksCardUrl(res.data?.tenthUrl || null);
  };

  useEffect(() => {
    const load = async () => {
      try {
        setError('');
        await refreshProfile?.();
        await fetchMarksCard();
      } catch (err) {
        setError('Failed to load your details. Please try again.');
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user) {
    return (
      <Container className="app-main">
        <div className="text-muted-2">Loading…</div>
      </Container>
    );
  }

  return (
    <Container className="app-main">
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
        <div>
          <h2 className="h3 fw-semibold page-title mb-1">Home</h2>
          <div className="text-muted-2">Your details and marks card.</div>
        </div>
        <Badge bg="light" text="dark" className="border">
          Signed in as <span className="fw-semibold">{user.email}</span>
        </Badge>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row className="g-4">
        <Col lg={4}>
          <Card className="shadow-soft">
            <Card.Body className="p-4">
              <div className="text-center">
                {user.profilePictureUrl ? (
                  <Image
                    src={user.profilePictureUrl}
                    alt="Profile"
                    className="profile-avatar"
                  />
                ) : (
                  <div className="profile-avatar profile-avatar--placeholder" />
                )}
                <div className="mt-3">
                  <div className="fw-semibold fs-5">{user.name}</div>
                  <div className="text-muted-2">{user.email}</div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={8}>
          <Card className="shadow-soft">
            <Card.Body className="p-4 p-md-5">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                <div>
                  <h3 className="h5 fw-semibold mb-1">Marks Card</h3>
                  <div className="text-muted-2">10th grade marks card.</div>
                </div>
                {marksCardUrl ? (
                  <Badge bg="success">Uploaded</Badge>
                ) : (
                  <Badge bg="secondary">Missing</Badge>
                )}
              </div>

              <div className="d-flex gap-2 flex-wrap">
                <Button
                  variant={
                    marksCardUrl ? 'outline-primary' : 'outline-secondary'
                  }
                  as="a"
                  href={marksCardUrl || undefined}
                  target="_blank"
                  rel="noreferrer"
                  disabled={!marksCardUrl}
                >
                  View
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;
