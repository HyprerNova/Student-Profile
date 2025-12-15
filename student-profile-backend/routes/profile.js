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

router.get('/', authenticate, async (req, res) => {
  const result = await pool.query(
    'SELECT name, email, profile_pic_key FROM users WHERE id = $1',
    [req.userId]
  );
  const user = result.rows[0];

  let profilePictureUrl = null;
  if (user.profile_pic_key) {
    profilePictureUrl = `https://${PIC_BUCKET}.s3.amazonaws.com/${user.profile_pic_key}`;
  }

  res.json({ ...user, profilePictureUrl });
});

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

      res.json({ message: 'Profile picture uploaded and saved successfully' });
    } catch (err) {
      console.error('Upload error:', err);
      res.status(500).json({ message: 'Upload failed' });
    }
  }
);

router.post('/picture/restore', authenticate, async (req, res) => {
  const old = await pool.query(
    'SELECT s3_key FROM old_profile_pics WHERE user_id = $1 ORDER BY uploaded_at DESC LIMIT 1',
    [req.userId]
  );

  if (old.rowCount === 0)
    return res.status(404).json({ message: 'No old picture to restore' });

  await s3
    .copyObject({
      Bucket: PIC_BUCKET,
      CopySource: `${PIC_BUCKET}/${old.rows[0].s3_key}`,
      Key: `${req.userId}/current/profile.jpg`,
    })
    .promise();

  res.json({ message: 'Old profile picture restored successfully' });
});

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

      await logMarksCardChange(req.userId, '10th');

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

    // Delete old archived profile pictures from PIC_BUCKET
    const oldPics = await pool.query(
      'SELECT s3_key FROM old_profile_pics WHERE user_id = $1',
      [req.userId]
    );
    if (oldPics.rowCount > 0) {
      const oldKeys = oldPics.rows.map((row) => ({ Key: row.s3_key }));
      deletePromises.push(
        s3
          .deleteObjects({
            Bucket: PIC_BUCKET,
            Delete: { Objects: oldKeys },
          })
          .promise()
      );
    }

    // 2. Execute all S3 deletions in parallel
    await Promise.all(deletePromises);

    // 3. Delete user from RDS (cascades to old_profile_pics and markscard_changes)
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
