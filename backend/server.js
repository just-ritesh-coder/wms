require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { MongoMemoryServer } = require('mongodb-memory-server');
const seedDB = require('./seed');

const app = express();
app.use(cors());
app.use(express.json());

const startServer = async () => {
  try {
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    console.log(`Using In-Memory MongoDB: ${mongoUri}`);

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    console.log('Seeding database...');
    await seedDB();
    console.log('Database seeded successfully. You can login with:\nAdmin: admin / admin123\nParty: sharma_distributors / party123');

    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/admin', require('./routes/admin'));
    app.use('/api/party', require('./routes/party'));
    app.use('/api/client', require('./routes/client'));

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

  } catch (err) {
    console.error('Failed to start server', err);
  }
};

startServer();
