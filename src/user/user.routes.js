import express from 'express'
import { validateJwt, isAdmin} from '../middlewares/validate-jwt.js';
import { test, register,  login,  update,  deleteU} from './user.controller.js';

const api = express.Router();

api.post('/register', register)
api.post('/login', login)

api.get('/test', [validateJwt, isAdmin], test)
api.put('/update/:id', [validateJwt], update)
api.delete('/deleteU/:id', [validateJwt], deleteU)

export default api