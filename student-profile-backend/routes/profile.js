import express from 'express';
import pool from '../db.js';
import jwt from 'jsonwebtoken';
import multer from 'multer';
const upload = multer(); // no storage — we don't save file on server
import {
  s3,
  PIC_BUCKET,
  MARKS_BUCKET,
  logMarksCardChange,
} from '../utils/s3.js';

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

// To display the profile basic information and profile picture
router.get('/', authenticate, async (req, res) => {
  const result = await pool.query(
    'SELECT name, email, profile_pic_key FROM users WHERE id = $1',
    [req.userId]
  );
  const user = result.rows[0];

  let profilePictureUrl = null;
  if (user.profile_pic_key) {
    profilePictureUrl = `https://${PIC_BUCKET}.s3.amazonaws.com/${user.profile_pic_key}`;
    console.log(profilePictureUrl);
  }

  res.json({ ...user, profilePictureUrl });
});

// For uploading the profile picture
router.post(
  '/picture',
  authenticate,
  upload.single('picture'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      // Upload to S3 from server
      const key = `${req.userId}/current/profile.jpg`;
      await s3
        .putObject({
          Bucket: PIC_BUCKET,
          Key: key,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
        })
        .promise();

      // Save key to RDS
      await pool.query('UPDATE users SET profile_pic_key = $1 WHERE id = $2', [
        key,
        req.userId,
      ]);

      console.log('Profile picture uploaded and saved successfully');
      console.log('Key:', key);
      console.log('URL:', `https://${PIC_BUCKET}.s3.amazonaws.com/${key}`);
      // Save key to RDS
      res.json({
        message: 'Profile picture uploaded and saved successfully',
        key,
        url: `https://${PIC_BUCKET}.s3.amazonaws.com/${key}`,
      });
    } catch (err) {
      console.error('Upload error:', err);
      res.status(500).json({ message: 'Upload failed' });
    }
  }
);

// Return profile picture key and URL (if exists)
router.get('/picture', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT profile_pic_key FROM users WHERE id = $1',
      [req.userId]
    );

    const key = result.rows[0]?.profile_pic_key || null;

    console.log('Key:', key);
    console.log('URL:', `https://${PIC_BUCKET}.s3.amazonaws.com/${key}`);
    if (!key) {
      return res
        .status(404)
        .json({ message: 'No profile picture found', key: null, url: null });
    }

    const url = `https://${PIC_BUCKET}.s3.amazonaws.com/${key}`;
    res.json({ key, url });
  } catch (err) {
    console.error('Error fetching profile picture key:', err);
    res.status(500).json({
      message: err.message || 'Internal server error',
      key: null,
      url: null,
    });
  }
});

// For uploading the marks card
router.post(
  '/markscard',
  authenticate,
  upload.single('markscard'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      // Only 10th marks card is supported
      const key = `${req.userId}/10th_markscard.pdf`;

      await s3
        .putObject({
          Bucket: MARKS_BUCKET,
          Key: key,
          Body: req.file.buffer,
          ContentType: req.file.mimetype || 'application/pdf',
        })
        .promise();

      // Fixed indentation here
      await pool.query('UPDATE users SET marks_card_key = $1 WHERE id = $2', [
        key,
        req.userId,
      ]);

      // Best-effort logging: don't fail the upload if logging/SNS has issues
      try {
        await logMarksCardChange(req.userId, '10th');
      } catch (logErr) {
        console.error('Failed to log marks card change:', logErr);
      }

      res.json({
        message: '10th marks card uploaded successfully',
        key,
        url: `https://${MARKS_BUCKET}.s3.amazonaws.com/${key}`,
      });
    } catch (err) {
      console.error('Marks card upload error:', err);
      res.status(500).json({ message: err.message || 'Upload failed' });
    }
  }
);

// For viewing the marks card
router.get('/markscard', authenticate, async (req, res) => {
  const result = await pool.query(
    'SELECT marks_card_key FROM users WHERE id = $1',
    [req.userId]
  );
  const key = result.rows[0].marks_card_key;
  let marksCardUrl = null;
  if (key) {
    marksCardUrl = `https://${MARKS_BUCKET}.s3.amazonaws.com/${key}`;
  }
  res.json({ tenthUrl: marksCardUrl });
});

// For deleting the account
router.delete('/', authenticate, async (req, res) => {
  try {
    // 1. Get user's S3 keys from RDS
    const result = await pool.query(
      'SELECT profile_pic_key, marks_card_key FROM users WHERE id = $1',
      [req.userId]
    );
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const deletePromises = [];

    // Delete profile picture from PIC_BUCKET
    if (user.profile_pic_key) {
      deletePromises.push(
        s3
          .deleteObject({
            Bucket: PIC_BUCKET,
            Key: user.profile_pic_key,
          })
          .promise()
      );
    }

    // Delete marks card from MARKS_BUCKET
    if (user.marks_card_key) {
      deletePromises.push(
        s3
          .deleteObject({
            Bucket: MARKS_BUCKET,
            Key: user.marks_card_key,
          })
          .promise()
      );
    }

    // 2. Execute all S3 deletions in parallel
    await Promise.all(deletePromises);

    // 3. Delete user from RDS (cascades to markscard_changes, if configured)
    await pool.query('DELETE FROM users WHERE id = $1', [req.userId]);

    res.json({
      message:
        'Account and all associated data permanently deleted from RDS and S3',
    });
  } catch (err) {
    console.error('Account deletion error:', err);
    res.status(500).json({ message: 'Failed to delete account' });
  }
});

export default router;
