require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const cowRoutes = require('./routes/cow.routes');
const ownerRoutes = require('./routes/owner.routes');
const vaccinationRoutes = require('./routes/vaccination.routes');
const offspringRoutes = require('./routes/offspring.routes');
const slaughterRoutes = require('./routes/slaughter.routes');
const transferRoutes = require('./routes/transfer.routes');
const exportRoutes = require('./routes/export.routes');
const ensureApprovalColumns = require('./database/ensureApprovalColumns');

const app = express();

// CORS — allow the frontend origin(s). Set FRONTEND_URL in production.
// Supports a comma-separated list for multiple origins.
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000,http://localhost:3001')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, same-origin)
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    return callback(null, true); // permissive for testing; tighten later if needed
  },
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cows', cowRoutes);
app.use('/api/owners', ownerRoutes);
app.use('/api/vaccinations', vaccinationRoutes);
app.use('/api/offspring', offspringRoutes);
app.use('/api/slaughter', slaughterRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/export', exportRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Cow Tracking API is running' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  // Ensure approval-workflow columns exist (safe, idempotent)
  await ensureApprovalColumns();
});

module.exports = app;
