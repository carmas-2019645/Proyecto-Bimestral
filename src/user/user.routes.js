import express from 'express'
import { validateJwt, isAdmin, isClient} from '../middlewares/validate-jwt.js';
import { test, registerAdmin,  login,  update,  deleteU, registerClient, testClient, 
        loginClient, getPurchaseHistory, getProfile, changePassword, updateProfileById, deleteClient, createDefaultAdmin} from './user.controller.js';

const api = express.Router();

// RUTAS ADMIN PUBLICAS
api.post('/createDefaultAdmin', createDefaultAdmin)
api.post('/registerAdmin', registerAdmin)
api.post('/registerClient', registerClient)
api.post('/login', login)

// RUTAS ADMIN PRIVADAS
api.get('/testAdmin', [validateJwt, isAdmin], test)
api.put('/update/:id', [validateJwt, isAdmin], update)
api.delete('/deleteU/:id', [validateJwt, isAdmin], deleteU)

// RUTAS CLIENT PRIVADAS
api.get('/testClient', [validateJwt, isClient], testClient)
api.post('/loginClient', loginClient);
api.get('/getPurchaseHistory', [validateJwt, isClient], getPurchaseHistory);
api.get('/getProfile', [validateJwt, isClient], getProfile)
api.put('/password', [validateJwt, isClient], changePassword)
api.put('/updateProfileById', [validateJwt, isClient], updateProfileById)
api.delete('/deleteClient', [validateJwt, isClient], deleteClient)


export default api