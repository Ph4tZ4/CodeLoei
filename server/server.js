const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const newsRoutes = require('./routes/newsRoutes');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    process.env.CLIENT_URL
].filter(Boolean);
app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Allow any localhost origin
        if (/^http:\/\/localhost:\d+$/.test(origin) || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) {
            return callback(null, true);
        }

        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/history', require('./routes/historyRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/news', newsRoutes);
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/it-student-repo')
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error(err));

// Base Route
app.get('/', (req, res) => {
    res.send('CodeLoei API is running');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
