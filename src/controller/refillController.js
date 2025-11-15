import Order from "../model/Order.js";
import Refill from "../model/Refill.js";
import apiService from "../utility/apiService.js";

// 1️⃣ Request Refill for a Single Order
export async function requestRefill(req, res) {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    const order = await Order.findOne({ _id: orderId});
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (!order.apiOrderId) {
      return res.status(400).json({ message: "Order has no API order ID" });
    }

    if (order.refill !== true){
      return res.status(400).json({ message: "Refill not allowed for this service" });
    }

    // Call API
    const apiResponse = await apiService.createRefill(order.apiOrderId);

    if (!apiResponse.refill) {
      return res.status(400).json({ message: "Failed to create refill" });
    }

    // Create refill entry
    const refill = new Refill({
      orderId: order._id,
      apiOrderId: order.apiOrderId,
      refillId: apiResponse.refill,
      status: "Pending"
    });

    await refill.save();

    res.json({
      success: true,
      message: "Refill request submitted",
      refillId: refill.refillId
    });

  } catch (error) {
    res.status(500).json({ message: "Error requesting refill", error: error.message });
  }
}

// 2️⃣ Bulk Refill Request (Up to 100 Orders)

export async function requestMultipleRefills(req, res) {
  try {
    const { orderIds } = req.body;

    if (!Array.isArray(orderIds) || orderIds.length === 0 || orderIds.length > 100) {
      return res.status(400).json({ message: "Provide 1–100 order IDs" });
    }

    const orders = await Order.find({ _id: { $in: orderIds }});

    if (!orders.length) {
      return res.status(404).json({ message: "Orders not found" });
    }

    const validOrders = orders.filter(o => o.apiOrderId && o.refill);
    const apiOrderIds = validOrders.map(o => o.apiOrderId);

    if (apiOrderIds.length === 0) {
      return res.status(400).json({ message: "No valid orders for refill" });
    }

    const apiResponse = await apiService.createMultipleRefills(apiOrderIds);

    const results = [];

    for (let item of apiResponse) {
      const order = validOrders.find(o => o.apiOrderId == item.order);
      if (!order) continue;

      if (item.refill?.error) {
        results.push({
          orderId: order._id,
          status: "failed",
          message: item.refill.error
        });
        continue;
      }

      const refill = new Refill({
        orderId: order._id,
        apiOrderId: order.apiOrderId,
        refillId: item.refill,
        status: "Pending"
      });

      await refill.save();

      results.push({
        orderId: order._id,
        status: "success",
        refillId: item.refill
      });
    }

    res.json({
      success: true,
      message: "Bulk refill request processed",
      results
    });

  } catch (error) {
    res.status(500).json({ message: "Bulk refill failure", error: error.message });
  }
}

// 3️⃣ Check Single Refill Status

export async function checkRefillStatus(req, res) {
  try {
    const { refillId } = req.params;

    const refill = await Refill.findOne({ refillId });
    if (!refill) {
      return res.status(404).json({ message: "Refill not found" });
    }

    const apiResponse = await apiService.getRefillStatus(refillId);

    // Update database
    if (apiResponse.status) {
      refill.status = apiResponse.status;
      await refill.save();
    }

    res.json({
      success: true,
      refillId,
      status: refill.status
    });

  } catch (error) {
    res.status(500).json({ message: "Failed to get refill status", error: error.message });
  }
}

// 4️⃣ Check Multiple Refill Statuses

export async function checkMultipleRefillStatuses(req, res) {
  try {
    const { refillIds } = req.body;

    if (!Array.isArray(refillIds) || refillIds.length === 0 || refillIds.length > 100) {
      return res.status(400).json({ message: "Provide 1–100 refill IDs" });
    }

    const apiResponse = await apiService.getMultipleRefillStatus(refillIds);

    for (let item of apiResponse) {
      const refill = await Refill.findOne({ refillId: item.refill });
      if (refill && item.status) {
        refill.status = item.status;
        await refill.save();
      }
    }

    res.json({
      success: true,
      results: apiResponse
    });

  } catch (error) {
    res.status(500).json({ message: "Failed to check refill statuses", error: error.message });
  }
}
