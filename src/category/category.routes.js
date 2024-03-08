import express from 'express'
import {testC, createCategory, getAllCategories, updateCategory, deleteCategory} from './category.controller.js'
import { validateJwt, isClient, isAdmin } from '../middlewares/validate-jwt.js' 


const api = express.Router();

// Rutas para categorías
api.get('/testC', testC);
api.post('/create',[validateJwt, isAdmin], createCategory);
api.get('/getAllCategories', getAllCategories)
api.put('/updateCategory/:id', updateCategory)
api.delete('/deleteCategory/:id',[validateJwt, isAdmin], deleteCategory)

export default api


