const analyticsService = require('./analytics.service');

async function getAnalytics(req, res, next) {
  try {
    const data = await analyticsService.getAnalytics();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAnalytics
};
