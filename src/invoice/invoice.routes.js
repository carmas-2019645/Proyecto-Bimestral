import express from 'express'
import { validateJwt, isClient, isAdmin } from '../middlewares/validate-jwt.js' 
import{getInvoicesByUser, getInvoices, updateInvoice} from './invoice.controller.js'



const api = express.Router();

api.put('/updateInvoice/:invoiceId', [validateJwt, isAdmin], updateInvoice);
api.get('/getInvoicesByUser/:userId', [validateJwt, isAdmin], getInvoicesByUser)
api.get('/getInvoices/:userId', [validateJwt, isAdmin], getInvoices)

export default api