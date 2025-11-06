import { Router } from 'express'
import { registration, login, profileUpdate, profileDelete, profileDetails, viewTransactionHistory, verifyEmail, verifyOTP, passwordReset } from '../controller/userController.js'
import { getServicesFromAPI, placeNewOrder, placeMassOrder, getUserOrders, getOrderDetails, cancelOrders } from '../controller/orderController.js'
import { createTicket, getMyTickets, getAllTickets, replyToTicket, updateTicketStatus } from '../controller/ticketController.js';
import { getDashboardData } from '../controller/dashboardController.js'


// import { initiatePayment, verifyPayment } from '../controller/paymentController.js';


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
router.delete('/profileDelete/:id',Authentication , checkRole('admin') , profileDelete);
router.post('/profileDetails',Authentication , profileDetails);
router.get('/viewTransactionHistory', Authentication , viewTransactionHistory);


// Order Routes

router.get('/getServicesFromAPI' , Authentication, getServicesFromAPI);
router.post('/placeNewOrder' , Authentication, placeNewOrder);
router.post('/placeMassOrder' , Authentication, placeMassOrder);
router.get('/getUserOrders' , Authentication, getUserOrders);
router.post('/getOrderDetails/:orderId' , Authentication, getOrderDetails);
router.post('/cancelOrders' , Authentication, checkRole('admin'), cancelOrders);

// Ticketing Routes

router.post('/createTicket', Authentication, createTicket);
router.get('/getMyTickets', Authentication, getMyTickets);
router.get('/getAllTickets', Authentication, checkRole('admin'), getAllTickets);
router.post('/replyToTicket/:ticketId', Authentication , checkRole('user', 'admin'), replyToTicket);
router.post('/updateTicketStatus/:ticketId', Authentication, checkRole('admin'), updateTicketStatus);

//Dashboard Routes

router.get('/getDashboardData', Authentication , getDashboardData);

//Payment Routes

// router.post('/initiatePayment', Authentication, initiatePayment);
// router.post('/verifyPayment', Authentication, verifyPayment);



export default router;