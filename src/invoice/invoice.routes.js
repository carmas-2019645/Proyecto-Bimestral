import express from 'express'
import { validateJwt, isClient, isAdmin } from '../middlewares/validate-jwt.js' 
import{getInvoices, updateInvoice} from './invoice.controller.js'



const api = express.Router();


// Rutas de Factura Privadas 
api.put('/updateInvoice/:invoiceId', [validateJwt, isAdmin], updateInvoice);
api.get('/getInvoices/:invoiceIds', [validateJwt, isAdmin], getInvoices)

export default api