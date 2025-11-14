// controllers/dashboardController.js

import User from '../model/User.js';
import Order from '../model/Order.js';
import ApiService from '../utility/apiService.js';

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

    // If admin, fetch the original balance from the API and total spent from the Order table
    if (user.role === 'admin') {
      // Get the balance from the third-party API
      const apiBalance = await ApiService.getBalance(); // API service call to get balance
      const totalUsers = await User.countDocuments({ role: 'user' });

      // Aggregate total spent from the Order model (sum of 'charge' for all users)
      const totalSpentAgg = await Order.aggregate([
        {
          $group: {
            _id: null,
            totalSpent: { $sum: '$charge' },
          },
        },
      ]);
      const totalSpentFromOrders = totalSpentAgg[0]?.totalSpent || 0;

      dashboardData.apiBalance = parseFloat(apiBalance.balance || 0); // API balance
      dashboardData.totalSpentFromOrders = parseFloat(totalSpentFromOrders.toFixed(4)); // Total spent from orders
      dashboardData.totalUsers = totalUsers;

      // Aggregate total profit from orders
      const totalProfitAgg = await Order.aggregate([
        {
          $group: {
            _id: null,
            totalProfit: { $sum: '$profit' },
          },
        },
      ]);
      const totalProfit = totalProfitAgg[0]?.totalProfit || 0;
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