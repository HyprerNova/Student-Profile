import React, { useState, useContext } from 'react';
import { Form, Button, Alert, Container, Card } from 'react-bootstrap';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config.js';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await axios.post(`${API_BASE_URL}/auth/signin`, {
        email,
        password,
      });
      login(res.data.token, res.data.user);
      // Redirect admin to /admin, others to home
      navigate(res.data.user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <Container className="app-main">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-5">
          <Card className="shadow-soft">
            <Card.Body className="p-4 p-md-5">
              <div className="mb-4">
                <h2 className="h3 fw-semibold page-title mb-1">Welcome back</h2>
                <div className="text-muted-2">
                  Log in to manage your profile.
                </div>
              </div>

              {error && <Alert variant="danger">{error}</Alert>}

              <Form onSubmit={handleSubmit}>
                <Form.Group controlId="email" className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </Form.Group>
                <Form.Group controlId="password" className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </Form.Group>

                <Button
                  variant="primary"
                  type="submit"
                  className="w-100"
                  size="lg"
                >
                  Login
                </Button>
              </Form>

              <div className="text-center text-muted-2 mt-3">
                New here? <Link to="/signup">Create an account</Link>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>
    </Container>
  );
};

export default Login;
