const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/track
router.post('/', authMiddleware, async (req, res) => {
  const { feature_name } = req.body;
  if (!feature_name) {
    return res.status(400).json({ error: 'feature_name is required' });
  }
  try {
    const click = await prisma.featureClick.create({
      data: {
        userId: req.user.id,
        featureName: feature_name,
        timestamp: new Date(),
      },
    });
    return res.status(201).json({ success: true, click });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to track event' });
  }
});

module.exports = router;
