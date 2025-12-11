import express from 'express';
import pool from '../db.js';
import jwt from 'jsonwebtoken';
import {
  s3, PIC_BUCKET, MARKS_BUCKET,
  generatePresignedPutUrl, generatePresignedGetUrl,
  logMarksCardChange
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
  const result = await pool.query('SELECT name, email FROM users WHERE id = $1', [req.userId]);
  const profilePicUrl = await generatePresignedGetUrl(PIC_BUCKET, `${req.userId}/current/profile.jpg`);
  res.json({ ...result.rows[0], profilePictureUrl: profilePicUrl });
});

router.post('/picture', authenticate, async (req, res) => {
  const userRes = await pool.query('SELECT profile_pic_changed_at FROM users WHERE id = $1', [req.userId]);
  const lastChange = userRes.rows[0]?.profile_pic_changed_at;

  if (lastChange) {
    const daysSince = (Date.now() - new Date(lastChange)) / (1000 * 60 * 60 * 24);
    if (daysSince < 15) {
      return res.status(403).json({ message: 'You can only change profile picture once every 15 days' });
    }
  }

  // Archive old picture
  try {
    const oldKey = `${req.userId}/current/profile.jpg`;
    const archiveKey = `${req.userId}/archive/profile_old_${Date.now()}.jpg`;
    await s3.copyObject({
      Bucket: PIC_BUCKET,
      CopySource: `${PIC_BUCKET}/${oldKey}`,
      Key: archiveKey,
    }).promise();

    await pool.query(
      'INSERT INTO old_profile_pics (user_id, s3_key) VALUES ($1, $2)',
      [req.userId, archiveKey]
    );
  } catch (err) {
    console.log("No old picture to archive (first time)");
  }

  const newKey = `${req.userId}/current/profile.jpg`;
  const uploadUrl = await generatePresignedPutUrl(PIC_BUCKET, newKey);

  // Update timestamp after upload (client uploads immediately)
  setTimeout(async () => {
    await pool.query('UPDATE users SET profile_pic_changed_at = NOW() WHERE id = $1', [req.userId]);
  }, 8000);

  res.json({ uploadUrl, message: 'Upload new picture - locked for 15 days' });
});

router.post('/picture/restore', authenticate, async (req, res) => {
  const old = await pool.query(
    'SELECT s3_key FROM old_profile_pics WHERE user_id = $1 ORDER BY uploaded_at DESC LIMIT 1',
    [req.userId]
  );

  if (old.rowCount === 0) return res.status(404).json({ message: 'No old picture to restore' });

  await s3.copyObject({
    Bucket: PIC_BUCKET,
    CopySource: `${PIC_BUCKET}/${old.rows[0].s3_key}`,
    Key: `${req.userId}/current/profile.jpg`,
  }).promise();

  res.json({ message: 'Old profile picture restored successfully' });
});

router.post('/markscard', authenticate, async (req, res) => {
  const { type } = req.body; // "10th" or "12th"
  const key = `${req.userId}/${type === '10th' ? '10th_markscard.pdf' : '12th_markscard.pdf'}`;
  const uploadUrl = await generatePresignedPutUrl(MARKS_BUCKET, key);

  await logMarksCardChange(req.userId, type);

  res.json({ uploadUrl });
});

router.get('/markscard', authenticate, async (req, res) => {
  const tenthUrl = await generatePresignedGetUrl(MARKS_BUCKET, `${req.userId}/10th_markscard.pdf`).catch(() => null);
  const twelfthUrl = await generatePresignedGetUrl(MARKS_BUCKET, `${req.userId}/12th_markscard.pdf`).catch(() => null);

  res.json({ tenthUrl, twelfthUrl });
});

export default router;