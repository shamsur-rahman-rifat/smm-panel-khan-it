import axios from 'axios';

class ApiService {
  constructor() {
    this.apiUrl = process.env.THIRD_PARTY_API_URL;
    this.apiKey = process.env.THIRD_PARTY_API_KEY;

    if (!this.apiUrl || !this.apiKey) {
      throw new Error('API URL or API Key not set in environment variables');
    }
  }

  // Get all services from third-party API
  async getServices(profitPercentage) {
    try {
      const response = await axios.post(this.apiUrl, {
        key: this.apiKey,
        action: 'services'
      });
      const services = response.data;

      // Add profit to each service
      const servicesWithProfit = services.map(service => {
        const baseRate = parseFloat(service.rate);
        const profit = (baseRate * profitPercentage / 100);
        const finalRate = parseFloat((baseRate + profit).toFixed(4));

        return {
          ...service,
          rate: baseRate,
          userRate: finalRate // priceWithProfit
        };
      });

      return servicesWithProfit;
    } catch (error) {
      throw new Error('Failed to fetch services from API');
    }
  }

  // Place order to third-party API
  async placeOrder(serviceId, link, quantity) {
    try {
      const response = await axios.post(this.apiUrl, {
        key: this.apiKey,
        action: 'add',
        service: serviceId,
        link: link,
        quantity: quantity
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to place order to API');
    }
  }

  // Check order status
  async getOrderStatus(orderId) {
    try {
      const response = await axios.post(this.apiUrl, {
        key: this.apiKey,
        action: 'status',
        order: orderId
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to get order status');
    }
  }

  // Cancel orders by passing their IDs
  async cancelOrders(orderIds) {
    try {
      const response = await axios.post(this.apiUrl, {
        key: this.apiKey,
        action: 'cancel',
        orders: orderIds.join(',') // Orders should be a comma-separated string of IDs
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to cancel orders through the API');
    }
  }  

  // Get balance from third-party API
  async getBalance() {
    try {
      const response = await axios.post(this.apiUrl, {
        key: this.apiKey,
        action: 'balance'
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to get balance');
    }
  }
}

export default new ApiService();