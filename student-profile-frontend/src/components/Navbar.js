import React, { useContext } from 'react';
import { Navbar, Nav, Button, Container, Image } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import { NavLink, useNavigate } from 'react-router-dom';

const AppNavbar = () => {
  const { isAuthenticated, logout, user } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <Navbar expand="lg" className="app-navbar" sticky="top">
      <Container>
        <Navbar.Brand
          as={NavLink}
          to="/"
          className="d-flex align-items-center gap-2"
        >
          <span className="brand-badge" aria-hidden="true" />
          <span className="fw-semibold">Student Profile</span>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto align-items-lg-center gap-2">
            {isAuthenticated ? (
              <>
                <Nav.Link
                  as={NavLink}
                  to="/profile"
                  className="d-flex align-items-center"
                  aria-label="Open profile settings"
                >
                  {user?.profilePictureUrl ? (
                    <Image
                      src={user.profilePictureUrl}
                      alt="Profile"
                      className="navbar-avatar"
                    />
                  ) : (
                    <span className="navbar-avatar navbar-avatar--placeholder" />
                  )}
                </Nav.Link>

                <Button
                  variant="outline-primary"
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Nav.Link as={NavLink} to="/login">
                  Login
                </Nav.Link>
                <Button as={NavLink} to="/signup" variant="primary">
                  Signup
                </Button>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AppNavbar;
