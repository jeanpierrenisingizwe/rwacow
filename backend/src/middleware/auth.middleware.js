const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied: insufficient permissions' });
  }
  next();
};

/**
 * scopeByRole — appends SQL WHERE clauses to scope data by role.
 * Farmers only see their own cows/owners.
 * Vets see all cows but not financial data.
 * Slaughterhouse sees only slaughter-relevant cows.
 * Government & Admin see everything.
 */
const ROLE_PERMISSIONS = {
  admin:         { canReadAll: true,  canReadFinancial: true,  canExport: true,  canBackup: true  },
  government:    { canReadAll: true,  canReadFinancial: true,  canExport: true,  canBackup: false },
  vet:           { canReadAll: true,  canReadFinancial: false, canExport: true,  canBackup: false },
  farmer:        { canReadAll: false, canReadFinancial: false, canExport: true,  canBackup: false },
  slaughterhouse:{ canReadAll: false, canReadFinancial: false, canExport: false, canBackup: false },
};

const getPermissions = (role) => ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.farmer;

module.exports = { authenticate, authorize, getPermissions };
