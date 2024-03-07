import express from "express";
import {addToCart, removeSelectedProduct, completePurchase} from './shopping.controller.js'
import { validateJwt , isAdmin, isClient  } from "../middlewares/validate-jwt.js";

const api = express.Router();


// Rutas de Carrito de Compras privadas
api.post('/addToCart',[validateJwt, isClient], addToCart)
api.delete('/removeSelectedProduct/:cartId/:userId/:productId',[validateJwt, isClient], removeSelectedProduct)
api.post('/completePurchase/:userId',[validateJwt, isClient], completePurchase)

export default api
