import Order from '../model/Order.js';
import User from '../model/User.js';
import Transaction from '../model/Transaction.js';
import apiService from '../utility/apiService.js';

export const viewOrderList = async (req, res) => {
  try {
    const result = await Order.find();
    res.json({ status: 'Success', data: result });
  } catch (error) {
    res.json({ status: 'Failed', message: error });
  }
};


// Get all services directly from the third-party API
export async function getServicesFromAPI(req, res) {
  try {
    // Extract the profit percentage from the query parameters
    const profitPercentage = parseFloat(req.query.profit);
    
    // Validate the profit percentage (ensure it’s a positive number)
    if (isNaN(profitPercentage) || profitPercentage < 0) {
      return res.status(400).json({ message: 'Invalid profit percentage. Must be a positive number.' });
    }

    // Pagination parameters from the query string
    const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
    const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page if not provided

    // Validate page and limit (ensure they are positive integers)
    if (page < 1 || limit < 1) {
      return res.status(400).json({ message: 'Page and limit must be greater than zero.' });
    }

    // Fetch services from the third-party API
    const services = await apiService.getServices(profitPercentage);

    if (!services || services.length === 0) {
      return res.status(404).json({ message: 'No services found' });
    }

    // Calculate the starting index for the current page
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    // Slice the array based on the pagination values
    const paginatedServices = services.slice(startIndex, endIndex);

    // Metadata for pagination (total pages, current page, etc.)
    const totalServices = services.length;
    const totalPages = Math.ceil(totalServices / limit);

    // Send response with paginated data and pagination metadata
    res.json({
      success: true,
      services: paginatedServices,
      pagination: {
        totalServices,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch services from API', error: error.message });
  }
}

// Place new order
export async function placeNewOrder(req, res) {
  try {
    const { serviceId, link, quantity } = req.body;
    const profitPercentage = parseFloat(req.body.profit);
    const email = req.headers['email'];

    // Get service details
    const services = await apiService.getServices(profitPercentage);
    const service = services.find(service => service.service === serviceId);

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

  const userRate = parseFloat(service.userRate);
  const baseRate = parseFloat(service.rate);
  const qty = parseInt(quantity);   
  
if (isNaN(userRate) || isNaN(baseRate) || isNaN(qty)) {
  return res.status(400).json({
    message: 'Invalid rate or quantity provided. Make sure rate and quantity are numbers.',
    details: { userRate, baseRate, quantity }
  });
}  

    // Check min/max quantity
    if (quantity < service.min || quantity > service.max) {
      return res.status(400).json({ 
        message: `Quantity must be between ${service.min} and ${service.max}` 
      });
    }

    // Calculate charges (Make sure we parse numbers correctly)
const charge = parseFloat((userRate * qty / 1000).toFixed(4));
const actualCharge = parseFloat((baseRate * qty / 1000).toFixed(4));
const profit = parseFloat((charge - actualCharge).toFixed(4));

    // Validate that charge and profit are valid numbers
    if (isNaN(charge) || isNaN(actualCharge) || isNaN(profit)) {
      return res.status(400).json({ message: 'Invalid charge, actualCharge, or profit value' });
    }    

    // Get user
    const user = await User.findOne({ email });
    if (user.balance < charge) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Place order to third-party API
    const apiResponse = await apiService.placeOrder(serviceId, link, quantity);
    
    if (!apiResponse.order) {
      return res.status(400).json({ message: 'Failed to place order to API' });
    }

    // Deduct balance
    const balanceBefore = user.balance;
    user.balance -= parseFloat(charge);
    user.totalSpent += parseFloat(charge);
    user.adminProfit += parseFloat(profit);
    await user.save();

    // Create order
    const order = new Order({
      email,
      serviceId: service.service,
      serviceName: service.name,
      link,
      quantity,
      charge: parseFloat(charge),
      actualCharge: parseFloat(actualCharge),
      profit: parseFloat(profit),
      apiOrderId: apiResponse.order,
      status: 'Processing'
    });

    await order.save();

    // Create transaction record
    const transaction = new Transaction({
      email,
      type: 'order',
      amount: -parseFloat(charge),
      description: `Order #${order._id} - ${service.name}`,
      balanceBefore,
      balanceAfter: user.balance,
      orderId: order._id
    });

    await transaction.save();

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order: {
        id: order._id,
        serviceId: order.serviceId,
        serviceName: order.serviceName,
        quantity: order.quantity,
        charge: order.charge,
        status: order.status,
        apiOrderId: order.apiOrderId
      },
      balance: user.balance
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to place order', error: error.message });
  }
}

// Mass order (multiple orders at once)
export async function placeMassOrder(req, res) {
  try {
    const { orders } = req.body; // Array of {serviceId, link, quantity}
    const profitPercentage = parseFloat(req.body.profit);
    const email = req.headers['email'];
    const results = [];
    let totalCharge = 0;

    // Fetch services from third-party API
    const services = await apiService.getServices(profitPercentage);    

    // Calculate total charge first
    for (let orderData of orders) {
      const service = services.find(service => service.service === orderData.serviceId)
      if (!service) continue;
      
      const charge = (service.userRate * orderData.quantity / 1000);
      totalCharge += charge;
    }

    // Check balance
    const user = await User.findOne({ email });
    if (user.balance < totalCharge) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Place each order
    for (let orderData of orders) {
      try {
        const service = services.find(service => service.service === orderData.serviceId);
        if (!service) {
          results.push({ 
            link: orderData.link, 
            status: 'failed', 
            message: 'Service not found' 
          });
          continue;
        }

        const charge = (service.userRate * orderData.quantity / 1000).toFixed(4);
        const actualCharge = (service.rate * orderData.quantity / 1000).toFixed(4);
        const profit = (charge - actualCharge).toFixed(4);

        const apiResponse = await apiService.placeOrder(
          orderData.serviceId, 
          orderData.link, 
          orderData.quantity
        );

        if (apiResponse.order) {
          const order = new Order({
            email,
            serviceId: service.service,
            serviceName: service.name,
            link: orderData.link,
            quantity: orderData.quantity,
            charge: parseFloat(charge),
            actualCharge: parseFloat(actualCharge),
            profit: parseFloat(profit),
            apiOrderId: apiResponse.order,
            status: 'Processing'
          });

          await order.save();

          const balanceBefore = user.balance;
          user.balance -= parseFloat(charge);
          user.totalSpent += parseFloat(charge);
          user.adminProfit += parseFloat(profit);

          // ✅ Create transaction record
          const transaction = new Transaction({
            email,
            type: 'order',
            amount: -charge,
            description: `Order #${order._id} - ${service.name}`,
            balanceBefore: balanceBefore,
            balanceAfter: user.balance,
            orderId: order._id
          });

          await transaction.save();          

          results.push({ 
            link: orderData.link, 
            status: 'success', 
            orderId: order.apiOrderId 
          });
        } else {
          results.push({ 
            link: orderData.link, 
            status: 'failed', 
            message: 'API error' 
          });
        }
      } catch (error) {
        results.push({ 
          link: orderData.link, 
          status: 'failed', 
          message: error.message 
        });
      }
    }

    await user.save();

    res.json({
      success: true,
      message: 'Mass order processed',
      results,
      balance: user.balance
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to process mass order', error: error.message });
  }
}

// Get user orders
export async function getUserOrders(req, res) {
  try {
    const email = req.headers['email'];
    const { page = 1, limit = 20 } = req.query;

    const orders = await Order.find({ email })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Order.countDocuments({ email });

    res.json({
      success: true,
      orders,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Get order details
export async function getOrderDetails(req, res) {
  try {
    const { orderId } = req.params;
    const email = req.headers['email'];

    const order = await Order.findOne({ _id: orderId, email });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Get latest status from API
    if (order.apiOrderId) {
      try {
        const statusResponse = await apiService.getOrderStatus(order.apiOrderId);
        if (statusResponse.status) {
          order.status = statusResponse.status;
          order.startCount = statusResponse.start_count;
          order.remains = statusResponse.remains;
          await order.save();
        }
      } catch (error) {
        // Continue even if status check fails
      }
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

  // Cancel orders
export async function cancelOrders(req, res) {
  try {
    const { orderIds } = req.body;  // Array of order IDs to be cancelled
    const email = req.headers['email'];

    if (!Array.isArray(orderIds) || orderIds.length === 0 || orderIds.length > 100) {
      return res.status(400).json({ message: 'Provide a valid list of order IDs (within 1 to 100)' });
    }

    // Get the orders by order IDs and validate if they are from the current user
    const orders = await Order.find({ _id: { $in: orderIds }, email });
    if (orders.length !== orderIds.length) {
      return res.status(404).json({ message: 'Some orders not found or do not belong to the user.' });
    }

    // Prepare the list of orders that need to be cancelled (only those with a valid apiOrderId)
    const ordersToCancel = orders.filter(order => order.apiOrderId && (order.status !== 'Canceled' && order.status !== 'Completed'));

    if (ordersToCancel.length === 0) {
      return res.status(400).json({ message: 'All selected orders are already canceled, completed, or do not have a valid apiOrderId.' });
    }

    // Extract the apiOrderIds from the orders that need to be canceled
    const apiOrderIds = ordersToCancel.map(order => order.apiOrderId);

    // Call third-party API to cancel the orders using the apiOrderIds
    const apiResponse = await apiService.cancelOrders(apiOrderIds);

    // Process the API response and update the order status
    const updatedOrders = [];
    apiResponse.forEach(apiOrderResponse => {
      const order = ordersToCancel.find(order => order.apiOrderId === apiOrderResponse.order.toString());
      if (order) {
        if (apiOrderResponse.cancel.error) {
          // If there's an error in canceling the order, mark it as "Cancel Failed"
          order.status = 'Cancel Failed';
          order.cancelErrorMessage = apiOrderResponse.cancel.error;  // Optionally save the error message
          updatedOrders.push({ orderId: order._id, status: 'failed', message: apiOrderResponse.cancel.error });
        } else {
          // Successfully canceled, update the status to "Canceled"
          order.status = 'Canceled';
          updatedOrders.push({ orderId: order._id, status: 'success' });
        }
        order.save();  // Save updated order status
      }
    });

    res.json({
      success: true,
      message: 'Orders processed for cancellation',
      results: updatedOrders
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to cancel orders', error: error.message });
  }
}