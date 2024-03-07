import express from 'express'
import { validateJwt, isAdmin, isClient} from '../middlewares/validate-jwt.js';
import { test, registerAdmin,  login,  update,  deleteU, registerClient, testClient, 
        loginClient, getPurchaseHistory, getProfile, changePassword, updateProfileById, deleteClient} from './user.controller.js';

const api = express.Router();

// RUTAS ADMIN PUBLICAS
api.post('/registerAdmin', registerAdmin)
api.post('/registerClient', registerClient)
api.post('/login', login)

// RUTAS ADMIN PRIVADAS
api.get('/testAdmin', [validateJwt, isAdmin], test)
api.put('/update/:id', [validateJwt, isAdmin], update)
api.delete('/deleteU/:id', [validateJwt, isAdmin], deleteU)

// RUTAS CLIENT PRIVADAS
api.get('/testClient', [validateJwt, isClient], testClient)
api.post('/loginClient', [validateJwt, isClient], loginClient);
api.get('/getPurchaseHistory/:userId', [validateJwt, isClient], getPurchaseHistory);
api.get('/getProfile', [validateJwt, isClient], getProfile)
api.put('/password', [validateJwt, isClient], changePassword)
api.put('/updateProfileById/:id', [validateJwt, isClient], updateProfileById)
api.delete('/deleteClient/:id', [validateJwt, isClient], deleteClient)

export default api