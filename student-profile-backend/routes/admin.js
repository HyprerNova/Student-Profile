import express from 'express';
import pool from '../db.js';
import jwt from 'jsonwebtoken';
import { PIC_BUCKET, MARKS_BUCKET } from '../utils/s3.js';

const router = express.Router();

// Auth middleware
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Admin middleware - checks if user is admin
const requireAdmin = async (req, res, next) => {
  try {
    const result = await pool.query('SELECT role FROM users WHERE id = $1', [
      req.userId,
    ]);
    const user = result.rows[0];

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  } catch (err) {
    res.status(500).json({ message: 'Error checking admin status' });
  }
};

// Test route to verify admin routes are working
router.get('/', authenticate, requireAdmin, (req, res) => {
  res.json({ message: 'Admin routes are working', userId: req.userId });
});

// Get all students (admin only)
router.get('/students', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, profile_pic_key, marks_card_key, status 
       FROM users 
       WHERE role = 'student' 
       ORDER BY created_at DESC`
    );

    const students = result.rows.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      profilePicUrl: user.profile_pic_key
        ? `https://${PIC_BUCKET}.s3.amazonaws.com/${user.profile_pic_key}`
        : null,
      marksCardUrl: user.marks_card_key
        ? `https://${MARKS_BUCKET}.s3.amazonaws.com/${user.marks_card_key}`
        : null,
      is_verified: user.status === 'verified',
    }));

    res.json(students);
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).json({ message: 'Failed to fetch students' });
  }
});

// Verify a student (admin only)
router.post('/verify/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const studentId = parseInt(req.params.id);

    await pool.query(
      'UPDATE users SET status = $1 WHERE id = $2 AND role = $3',
      ['verified', studentId, 'student']
    );

    res.json({ message: 'Student verified successfully' });
  } catch (err) {
    console.error('Error verifying student:', err);
    res.status(500).json({ message: 'Failed to verify student' });
  }
});

export default router;
