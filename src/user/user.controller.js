'use strict' //Modo estricto
import jwt from 'jsonwebtoken';
import User from './user.model.js'
import Product from '../product/product.model.js'
import {encrypt, checkPassword, checkUpdate } from '../utils/validator.js'
import { generateJwt } from '../utils/jwt.js'
import ShoppingCart from '../shoppingcart/shopping.model.js';
import Invoice from '../invoice/invoice.model.js';
import bcrypt from 'bcrypt';



export const test = (req, res)=>{
    console.log('test is running')
    return res.send({message: 'Test is running'})
}

export const testClient = (req, res)=>{
    console.log('test is running')
    return res.send({message: 'Test is running'})
}

export const registerAdmin = async (req, res) => {
    try {
        let data = req.body;
        //encriptar la contrasenia
        data.password = await encrypt(data.password);
        //rol por defecto
        data.role = 'ADMIN';
        //creamos nuestro usuario
        let user = new User(data);
        //guardamos en mongo
        await user.save();
        //respondemos al usuario
        return res.send({ message: `Registered successfully. \nCan be logged with username ${user.username}` });
    } catch (err) {
        console.error(err);
        return res.status(500).send({ message: `Error registering user. | `, err: err.errors })
    }
}

export const registerClient = async (req, res) => {
    try {
        let data = req.body;
        data.password = await encrypt(data.password);
        //rol por defecto
        data.role = 'CLIENT';
        let user = new User(data);
        //guardamos en mongo
        await user.save();
        //respondemos al usuario
        return res.send({ message: `Registered successfully. \nCan be logged with username ${user.username}` });
    } catch (err) {
        console.error(err);
        return res.status(500).send({ message: `Error registering user. | `, err: err.errors })
    }
}


export const login = async (req, res) => {
    try {
        // Capturar los datos
        let { username, email, password } = req.body;

        // Buscar el usuario por nombre de usuario o correo electrónico
        let user = await User.findOne({ $or: [{ username }, { email }] });

        // Verificar que el usuario exista y que la contraseña coincida
        if (user && (await checkPassword(password, user.password))) {
            let loggedUser = {
                uid: user._id,
                username: user.username,
                name: user.name,
                role: user.role
            };
            // Generar el Token
            let token = await generateJwt(loggedUser);

            // Responder al usuario
            return res.send({
                message: `Welcome ${loggedUser.name}`,
                loggedUser,
                token
            });
        }
        return res.status(404).send({ message: 'Invalid credentials' });
    } catch (err) {
        console.error(err);
        return res.status(500).send({ message: 'Error to login' });
    }
};


export const update = async(req, res)=>{
    try{
        let { id } = req.params
        //Obtener los datos
        let data = req.body
        let update = checkUpdate(data, id)
        if(!update) return res.status(400).send({message: 'Have submitted some data that cannot be updated or missing data'})
        //Valida si hay permisos
        let updatedUser = await User.findOneAndUpdate(
            {_id: id}, 
            data, 
            {new: true} 
        )
        //Validar la actualización
        if(!updatedUser) return res.status(401).send({message: 'User not found and not updated'})
        //Respondo al usuario
        return res.send({message: 'Updated user', updatedUser})
    }catch(err){
        console.error(err)
        if(err.keyValue.username) return res.status(400).send({message: `Username ${err.keyValue.username} is alredy taken`})
        return res.status(500).send({message: 'Error updating account'})
    }
}

export const deleteU = async(req, res)=>{
    try{
        //Obtener el Id
        let { id } = req.params
        let deletedUser = await User.findOneAndDelete({_id: id}) 
        //Verificar que se eliminó
        if(!deletedUser) return res.status(404).send({message: 'Account not found and not deleted'})
        //Responder
        return res.send({message: `Account with username ${deletedUser.username} deleted successfully`}) //status 200
    }catch(err){
        console.error(err)
        return res.status(500).send({message: 'Error deleting account'})
    }
}




// Funcionalidades de los Clientes

export const loginClient = async (req, res) => {
    try {
        const userId = req.user._id;
        const purchaseHistory = await getPurchaseHistory(userId);
        res.status(200).json({ message: 'Login successful', user: req.user, purchaseHistory });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching purchase history', error: error.message });
    }
};

export const getPurchaseHistory = async (req, res) => {
    try {
        // Obtener el token
        let secretKey = process.env.SECRET_KEY;
        // Obteniene el token del headers
        let { authorization } = req.headers;
        // Verifica
        let { uid } = jwt.verify(authorization, secretKey);
        // Buscar todas las facturas del userId
        const purchaseHistory = await Invoice.find({ userId: uid }).populate('items.productId');
        // Envia la factura
        res.status(200).json({ purchaseHistory });
    } catch (error) {
        console.error('Error getting purchase history:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};


export const getProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error getting user profile.' });
    }
};


export const changePassword = async (req, res) => {
    try {
        // Obtiene la solicitud
        const { username, password, newPassword, newName } = req.body;

        // Validar que algun campo se ingres
        if (!username && !newPassword && !newName) {
            return res.status(400).send({ message: 'At least one field is required to edit.' });
        }
        const user = await User.findById(req.user.id);

        // Si se pone un nuevo name que se actualice
        if (newName) {
            user.name = newName;
        }

        // Si se pone un nuevo Username que se actualice
        if (username) {
            user.username = username;
        }

        // Si se proporciona una nueva contraseña, validar la contraseña anterior y actualizarla
        if (newPassword) {
            if (!password) {
                return res.status(400).send({ message: 'The old password is required to change it.' });
            }
            // Verificacion de la password anterior
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(400).send({ message: 'The previous password is incorrect.' });
            }
            // Obtiene la nueva contraseña
            const hashedNewPassword = await bcrypt.hash(newPassword, 10);
            // La actualiza
            user.password = hashedNewPassword;
        }
        // Guarda
        await user.save();

        // Verifica si se actualizo
        const passwordUpdated = newPassword ? true : false;

        return res.send({ message: 'The previous password is incorrect.', passwordUpdated });
    } catch (err) {
        console.error(err);
        return res.status(500).send({ message: 'Error updating profile.' });
    }
};


export const updateProfileById = async (req, res) => {
    try {
        // Obtener el ID
        const { id } = req.params;
        const { email, name, surname } = req.body;

        // Verifica que al menos un camopo para actualizar
        if (!email && !name && !surname) {
            return res.status(400).json({ message: 'At least one field is required to update.' });
        }
        // Buscar el usuario por su ID
        let user = await User.findById(id);

        // Verificar si el usuario existe
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        if (email) {
            user.email = email;
        }
        if (name) {
            user.name = name;
        }
        if (surname) {
            user.surname = surname;
        }
        // Guarda los cambios
        user = await user.save();
        return res.status(200).json({ message: 'Profile successfully updated.', user });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error updating profile.' });
    }
};


export const deleteClient = async (req, res) => {
    try {
        // Obtiene el ID
        const { id: authUserId } = req.user; 
        const { id: userIdToDelete } = req.params;

        // Verificar si el usuario autenticado es el mismo
        if (authUserId !== userIdToDelete) {
            return res.status(403).json({ message: 'You do not have permission to delete this account.' });
        }

        // Buscar el usuario por su ID
        const user = await User.findById(userIdToDelete);

        // Verificar si el usuario existe
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Eliminar el usuario de la base de datos
        await User.findByIdAndDelete(userIdToDelete);

        // Responder con un mensaje de éxito
        return res.status(200).json({ message: 'Account successfully deleted.' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error deleting account.' });
    }
};
