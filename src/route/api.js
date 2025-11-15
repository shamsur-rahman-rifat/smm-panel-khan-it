import { Router } from 'express'
import { registration, login, profileUpdate, profileDelete, profileDetails, viewTransactionHistory, verifyEmail, verifyOTP, passwordReset,viewUserList } from '../controller/userController.js'
import { getServicesFromAPI, placeNewOrder, placeMassOrder, getUserOrders, getOrderDetails, cancelOrders,viewOrderList } from '../controller/orderController.js'
import { createTicket, getMyTickets, getAllTickets, replyToTicket, updateTicketStatus } from '../controller/ticketController.js';
import { requestRefill, requestMultipleRefills, checkRefillStatus, checkMultipleRefillStatuses} from '../controller/refillController.js';
import { getDashboardData } from '../controller/dashboardController.js'
import { initiatePayment, verifyPayment } from '../controller/paymentController.js';

import Authentication from '../middleware/auth.js'
import checkRole from '../middleware/checkRole.js'

const router=Router()

// User Reg & Login Routes

router.post('/registration', registration)
router.post('/login', login);

// User Reset Password Routes

router.get('/verifyEmail/:email', verifyEmail);
router.get('/verifyOTP/:email/:otp', verifyOTP);
router.get('/passwordReset/:email/:otp/:password', passwordReset);

// User Profile Routes

router.put('/profileUpdate/:id',Authentication , profileUpdate);
router.post('/profileDetails',Authentication , profileDetails);
router.get('/viewTransactionHistory', Authentication , viewTransactionHistory);

// Order Routes

router.get('/getServicesFromAPI' , Authentication, getServicesFromAPI);
router.post('/placeNewOrder' , Authentication, placeNewOrder);
router.post('/placeMassOrder' , Authentication, placeMassOrder);
router.get('/getUserOrders' , Authentication, getUserOrders);
router.post('/cancelOrders' , Authentication, cancelOrders);
router.post('/getOrderDetails/:orderId' , Authentication, getOrderDetails);

// Ticketing Routes

router.post('/createTicket', Authentication, createTicket);
router.get('/getMyTickets', Authentication, getMyTickets);
router.post('/replyToTicket/:ticketId', Authentication , checkRole('user', 'admin', 'agent'), replyToTicket);

// Admin Dashboard Routes

router.get('/getDashboardData', Authentication , getDashboardData);
router.delete('/profileDelete/:id',Authentication , checkRole('admin') , profileDelete);
router.get('/getAllTickets', Authentication, checkRole( 'admin', 'agent'), getAllTickets);
router.post('/updateTicketStatus/:ticketId', Authentication, checkRole( 'admin', 'agent'), updateTicketStatus);
router.get('/viewUserList', Authentication , checkRole('admin') , viewUserList);
router.get('/viewOrderList', Authentication , checkRole('admin') , viewOrderList);

// Admin Refill Routes

router.post('/requestRefill', Authentication, checkRole( 'admin', 'agent'), requestRefill);
router.post('/requestMultipleRefills', Authentication, checkRole( 'admin', 'agent'), requestMultipleRefills);
router.get('/checkRefillStatus/:refillId', Authentication, checkRole( 'admin', 'agent'), checkRefillStatus);
router.post('/checkMultipleRefillStatuses', Authentication, checkRole( 'admin', 'agent'), checkMultipleRefillStatuses);

//Payment Routes

router.post('/initiatePayment', Authentication, initiatePayment);
router.get('/verifyPayment', verifyPayment);

export default router;