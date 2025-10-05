// controllers/dashboardController.js

import User from '../model/User.js';
import Order from '../model/Order.js';

export async function getDashboardData(req, res) {
  try {
    const email = req.headers['email'];
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Basic data for both user and admin
    const dashboardData = {
      balance: user.balance,
      totalSpent: user.totalSpent,
    };

    // If admin, add extra data
    if (user.role === 'admin') {
      const totalUsers = await User.countDocuments({ role: 'user' });

      const totalProfitAgg = await Order.aggregate([
        {
          $group: {
            _id: null,
            totalProfit: { $sum: '$profit' },
          },
        },
      ]);

      const totalProfit = totalProfitAgg[0]?.totalProfit || 0;

      dashboardData.totalUsers = totalUsers;
      dashboardData.totalProfit = parseFloat(totalProfit.toFixed(4));
    }

    return res.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load dashboard data', error: error.message });
  }
}
