import express from 'express'
import {createProduct,getAllProducts, getProductById, updateProduct, Inventory, getOutOfStockProducts} from './product.controller.js'

const api = express.Router();

// Rutas para categorías
api.post('/createProduct', createProduct);
api.get('/getAllProducts', getAllProducts)
api.get('/getProductById/:id', getProductById)
api.put('/updateProduct/:id', updateProduct)
api.get('/inventory',Inventory)
api.get('/getOutOfStockProducts', getOutOfStockProducts)


export default api


