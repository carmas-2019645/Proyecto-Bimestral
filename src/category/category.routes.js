import express from 'express'
import {testC, createCategory, getAllCategories, updateCategory, deleteCategory} from './category.controller.js'

const api = express.Router();

// Rutas para categorías
api.get('/testC', testC);
api.post('/create', createCategory);
api.get('/getAllCategories', getAllCategories)
api.put('/updateCategory/:id', updateCategory)
api.delete('/deleteCategory/:id', deleteCategory)

export default api


