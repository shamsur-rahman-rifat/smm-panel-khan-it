import Ticket from '../model/Ticket.js';
import User from '../model/User.js';

// Create new ticket
export const createTicket = async (req, res) => {
  try {
    const { subject, message, orderId } = req.body;
    const email = req.headers['email'];

    const ticket = new Ticket({
      userEmail: email,
      subject,
      message,
      orderId: orderId || null
    });

    await ticket.save();
    res.status(201).json({ success: true, ticket });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create ticket', error: error.message });
  }
};

// Get all tickets (Admin)
export const getAllTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find().sort({ createdAt: -1 });
    res.json({ success: true, tickets });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get tickets', error: error.message });
  }
};

// Get tickets by user
export const getMyTickets = async (req, res) => {
  try {
    const email = req.headers['email'];
    const tickets = await Ticket.find({ userEmail: email }).sort({ createdAt: -1 });
    res.json({ success: true, tickets });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get user tickets', error: error.message });
  }
};

// Reply to a ticket (Admin or user)
export const replyToTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { message } = req.body;

    const sender = req.user.role === 'admin' ? 'admin' : 'user';

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    ticket.replies.push({ sender, message });
    ticket.status = sender === 'admin' ? 'in-progress' : ticket.status;
    await ticket.save();

    res.json({ success: true, ticket });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reply to ticket', error: error.message });
  }
};

// Update ticket status (Admin only)
export const updateTicketStatus = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status } = req.body;

    const validStatuses = ['open', 'in-progress', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    ticket.status = status;
    await ticket.save();

    res.json({ success: true, ticket });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update ticket status', error: error.message });
  }
};
