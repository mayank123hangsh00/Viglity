require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const SEED_USERS = [
  { username: 'alice',   password: 'password123', age: 25, gender: 'Female' },
  { username: 'bob',     password: 'password123', age: 17, gender: 'Male'   },
  { username: 'charlie', password: 'password123', age: 45, gender: 'Male'   },
  { username: 'diana',   password: 'password123', age: 35, gender: 'Female' },
  { username: 'eve',     password: 'password123', age: 28, gender: 'Other'  },
  { username: 'frank',   password: 'password123', age: 52, gender: 'Male'   },
  { username: 'grace',   password: 'password123', age: 14, gender: 'Female' },
];

const FEATURES = ['date_filter', 'age_filter', 'gender_filter', 'bar_chart_click', 'line_chart_view'];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - randomInt(0, daysAgo));
  d.setHours(randomInt(0, 23), randomInt(0, 59), randomInt(0, 59));
  return d;
}

async function seed() {
  console.log('🌱 Seeding Vigility database...\n');

  // Clear existing
  await prisma.featureClick.deleteMany();
  await prisma.user.deleteMany();
  console.log('🗑️  Cleared existing data');

  // Create users
  const createdUsers = [];
  for (const u of SEED_USERS) {
    const hashed = await bcrypt.hash(u.password, 10);
    const user = await prisma.user.create({
      data: { username: u.username, password: hashed, age: u.age, gender: u.gender },
    });
    createdUsers.push(user);
    console.log(`   ✅ Created user: ${u.username} (age ${u.age}, ${u.gender})`);
  }

  // Generate click records — 250 records spread across 90 days
  const clicksData = [];

  // Weighted distribution: date_filter and bar_chart_click are most popular
  const weightedFeatures = [
    'date_filter', 'date_filter', 'date_filter',
    'age_filter', 'age_filter',
    'gender_filter', 'gender_filter',
    'bar_chart_click', 'bar_chart_click', 'bar_chart_click',
    'line_chart_view',
  ];

  for (let i = 0; i < 250; i++) {
    const user = createdUsers[randomInt(0, createdUsers.length - 1)];
    const feature = weightedFeatures[randomInt(0, weightedFeatures.length - 1)];
    clicksData.push({
      userId: user.id,
      featureName: feature,
      timestamp: randomDate(90),
    });
  }

  await prisma.featureClick.createMany({ data: clicksData });
  console.log(`\n📊 Created ${clicksData.length} interaction records`);

  console.log('\n🎉 Seeding complete!\n');
  console.log('📋 Demo login credentials:');
  SEED_USERS.forEach((u) => console.log(`   username: ${u.username.padEnd(10)} | password: ${u.password}`));
}

seed()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
