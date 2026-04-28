const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/analytics?startDate=&endDate=&age=&gender=&feature=
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate, age, gender, feature } = req.query;

    // --- Step 1: Filter users by age / gender ---
    const userWhere = {};
    if (gender && gender !== 'All') userWhere.gender = gender;
    if (age && age !== 'All') {
      if (age === '<18') userWhere.age = { lt: 18 };
      else if (age === '18-40') userWhere.age = { gte: 18, lte: 40 };
      else if (age === '>40') userWhere.age = { gt: 40 };
    }

    const users = await prisma.user.findMany({
      where: Object.keys(userWhere).length > 0 ? userWhere : undefined,
      select: { id: true },
    });
    const userIds = users.map((u) => u.id);

    // --- Step 2: Build click filter ---
    const clickWhere = { userId: { in: userIds } };
    if (startDate) {
      clickWhere.timestamp = { ...clickWhere.timestamp, gte: new Date(startDate) };
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      clickWhere.timestamp = { ...clickWhere.timestamp, lte: end };
    }

    // --- Step 3: Bar chart — group by featureName ---
    const barGroups = await prisma.featureClick.groupBy({
      by: ['featureName'],
      where: clickWhere,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    const barData = barGroups.map((g) => ({
      featureName: g.featureName,
      count: g._count.id,
    }));

    // --- Step 4: Line chart — group by date for selected feature ---
    const selectedFeature = feature || barData[0]?.featureName;
    let lineData = [];

    if (selectedFeature) {
      const lineClicks = await prisma.featureClick.findMany({
        where: { ...clickWhere, featureName: selectedFeature },
        select: { timestamp: true },
        orderBy: { timestamp: 'asc' },
      });

      // Group by date in JS — works for both SQLite and Postgres
      const dateMap = {};
      lineClicks.forEach((c) => {
        const date = c.timestamp.toISOString().split('T')[0];
        dateMap[date] = (dateMap[date] || 0) + 1;
      });

      lineData = Object.entries(dateMap)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
    }

    // --- Step 5: Summary stats ---
    const totalClicks = await prisma.featureClick.count({ where: clickWhere });
    const uniqueFeatures = barData.length;

    return res.json({ barData, lineData, selectedFeature, totalClicks, uniqueFeatures });
  } catch (err) {
    console.error('Analytics error:', err);
    return res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;
