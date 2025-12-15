import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Container, Button } from 'react-bootstrap';
import { AuthProvider } from './context/AuthContext';
import AppNavbar from './components/Navbar';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import Profile from './components/Profile/Profile';

function Home() {
  return (
    <Container className="app-main">
      <div className="p-4 p-md-5 bg-white rounded-4 border shadow-soft">
        <div className="row align-items-center g-4">
          <div className="col-lg-7">
            <h1 className="display-6 fw-semibold page-title mb-2">
              Student Profile Management
            </h1>
            <p className="text-muted-2 fs-5 mb-4">
              Securely manage your profile, upload your picture, and store marks
              cards — all in one place.
            </p>
            <div className="d-flex flex-wrap gap-2">
              <Button as={Link} to="/login" variant="primary" size="lg">
                Log in
              </Button>
              <Button
                as={Link}
                to="/signup"
                variant="outline-primary"
                size="lg"
              >
                Create account
              </Button>
            </div>
          </div>
          <div className="col-lg-5">
            <div className="p-4 rounded-4 border bg-light">
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="brand-badge" />
                <div>
                  <div className="fw-semibold">Quick actions</div>
                  <div className="text-muted-2 small">
                    Profile • Picture • Marks cards
                  </div>
                </div>
              </div>
              <ul className="mb-0 text-muted-2">
                <li>Clean, modern UI</li>
                <li>Responsive layout</li>
                <li>Accessible contrast & spacing</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppNavbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/" element={<Home />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
