import express from 'express'
import { validateJwt, isAdmin, isClient} from '../middlewares/validate-jwt.js';
import {createProduct,getAllProducts, getProductById, updateProduct, Inventory, 
        getOutOfStockProducts, deleteProduct, getBestSellers, searchProductsByName, getProductsCategory, getProductsByCategory  } from './product.controller.js'

const api = express.Router();

// Rutas para categorías
api.post('/createProduct',[validateJwt, isAdmin], createProduct);
api.get('/getAllProducts',[validateJwt, isAdmin], getAllProducts)
api.get('/getProductById/:id',[validateJwt, isAdmin], getProductById)
api.put('/updateProduct/:id',[validateJwt, isAdmin], updateProduct)
api.get('/inventory',[validateJwt, isAdmin],Inventory)
api.get('/getOutOfStockProducts',[validateJwt, isAdmin], getOutOfStockProducts)
api.delete('/deleteProduct/:id',[validateJwt, isAdmin], deleteProduct)


// Rutas de Productos Privadas para Cliente
api.get('/getBestSellers',[validateJwt, isClient], getBestSellers)
api.get('/searchProductsName/:name',[validateJwt, isClient],searchProductsByName)
api.post('/categories/:categoryName',[validateJwt, isClient], getProductsCategory);
api.get('/getProductsByCategory/:name', [validateJwt, isClient], getProductsByCategory);


export default api


