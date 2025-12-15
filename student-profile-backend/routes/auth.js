// routes/auth.js
import express from 'express';
import pool from '../db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();

// ================= SIGNUP =================
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // THIS IS THE MOST IMPORTANT PART
    console.log('Signup request received:', {
      name,
      email,
      password: password ? '***' : 'MISSING',
    });

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: 'Name, email and password are required' });
    }

    if (
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string'
    ) {
      return res.status(400).json({ message: 'Invalid data format' });
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (trimmedName.length < 2)
      return res.status(400).json({ message: 'Name too short' });
    if (!trimmedEmail.includes('@'))
      return res.status(400).json({ message: 'Invalid email' });
    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be 6+ chars' });

    const password_hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash) 
       VALUES ($1, $2, $3) 
       RETURNING id, name, email`,
      [trimmedName, trimmedEmail, password_hash]
    );

    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    console.log('USER CREATED SUCCESSFULLY:', user.id, user.email);

    res.json({ token, user });
  } catch (err) {
    console.error('Signup ERROR:', err);
    if (err.code === '23505') {
      // unique violation
      res.status(400).json({ message: 'Email already exists' });
    } else {
      res.status(500).json({ message: 'Server error', detail: err.message });
    }
  }
});

// ================= SIGNIN =================
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Signin attempt:', email);

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [
      email.trim().toLowerCase(),
    ]);
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });
    console.log('Login successful:', user.id, user.email);

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error('Signin error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
