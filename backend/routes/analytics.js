const express = require('express');
const {
  getOverviewStats,
  getTicketTrends,
  getTicketDistribution,
  getAgentPerformance,
  getSatisfactionMetrics,
  getActivityMetrics
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// Analytics routes
router.get('/overview', authorize('admin', 'agent'), getOverviewStats);
router.get('/ticket-trends', authorize('admin', 'agent'), getTicketTrends);
router.get('/ticket-distribution', authorize('admin', 'agent'), getTicketDistribution);
router.get('/agent-performance', authorize('admin'), getAgentPerformance);
router.get('/satisfaction', authorize('admin', 'agent'), getSatisfactionMetrics);
router.get('/activity', authorize('admin'), getActivityMetrics);

module.exports = router;

