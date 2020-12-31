const express = require('express');
const connectDB = require('./config/db.js');

// initialize server and database
const app = express();
connectDB();

// Initialize Bodyparser for Json
app.use(express.json({ extended: false }));

// Server Listening to PORT
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`---> Server is running on port ${PORT}`));

// Define Routes
app.use('/api/users', require('./routes/api/users.js'));
app.use('/api/auth', require('./routes/api/auth.js'));
app.use('/api/profile', require('./routes/api/profile.js'));
app.use('/api/posts', require('./routes/api/posts.js'));


// Test api get path
app.get('/', (req, res) => { res.send('API running') });