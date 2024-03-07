import express from 'express'
import { validateJwt, isAdmin, isClient} from '../middlewares/validate-jwt.js';
import {createProduct,getAllProducts, getProductById, updateProduct, Inventory, 
        getOutOfStockProducts, deleteProduct, getBestSellers, searchProductsByName, getAllCategorie, getProductsByCategory  } from './product.controller.js'

const api = express.Router();

// Rutas para categorías
api.post('/createProduct', createProduct);
api.get('/getAllProducts', getAllProducts)
api.get('/getProductById/:id', getProductById)
api.put('/updateProduct/:id', updateProduct)
api.get('/inventory',Inventory)
api.get('/getOutOfStockProducts', getOutOfStockProducts)
api.delete('/deleteProduct/:id', deleteProduct)


// Rutas de Productos Privadas para Cliente
api.get('/getBestSellers',[validateJwt, isClient], getBestSellers)
api.get('/searchProductsName/:name',[validateJwt, isClient],searchProductsByName)
api.get('/Categories', [validateJwt,isClient ], getAllCategorie)
api.get('/getProductsByCategory/:name', [validateJwt, isClient], getProductsByCategory);


export default api


