import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Container, Card, Table, Button, Badge, Image } from 'react-bootstrap';
import { API_BASE_URL } from '../../config';

const AdminDashboard = () => {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/students`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      //console.log(res);
      setStudents(res.data);
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  };

  const handleVerify = async (id) => {
    try {
      await axios.post(
        `${API_BASE_URL}/admin/verify/${id}`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      fetchStudents();
    } catch (err) {
      console.error('Error verifying student:', err);
    }
  };

  return (
    <Container className="app-main">
      <Card className="shadow-soft mt-4">
        <Card.Body>
          <h2 className="h4 fw-semibold mb-4">Student Verification Panel</h2>
          <Table responsive bordered hover>
            <thead className="table-light">
              <tr>
                <th>Profile</th>
                <th>Name</th>
                <th>Email</th>
                <th>Marks Card</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id}>
                  <td>
                    <Image
                      src={s.profilePicUrl || '/default-avatar.png'}
                      roundedCircle
                      width={40}
                      height={40}
                      alt="Profile"
                    />
                  </td>
                  <td>{s.name}</td>
                  <td>{s.email}</td>
                  <td>
                    <a href={s.marksCardUrl} target="_blank" rel="noreferrer">
                      View PDF
                    </a>
                  </td>
                  <td>
                    {s.is_verified ? (
                      <Badge bg="success">Verified</Badge>
                    ) : (
                      <Badge bg="warning" text="dark">
                        Not Verified
                      </Badge>
                    )}
                  </td>
                  <td>
                    {!s.is_verified && s.marksCardUrl && (
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleVerify(s.id)}
                      >
                        Verify
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AdminDashboard;
