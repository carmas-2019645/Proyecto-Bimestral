'use strict' //Modo estricto

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

        //le asignamos rol por defecto
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
        //encriptar la contrasenia
        data.password = await encrypt(data.password);

        //le asignamos rol por defecto
        data.role = 'CLIENT';
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



export const login = async (req, res) => {
    try {
        // Capturar los datos (body)
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


export const update = async(req, res)=>{ //Datos generales (No password)
    try{
        //Obtener el id del usuario a actualizar
        let { id } = req.params
        //Obtener los datos a actualizar
        let data = req.body
        //Validar si data trae datos
        let update = checkUpdate(data, id)
        if(!update) return res.status(400).send({message: 'Have submitted some data that cannot be updated or missing data'})
        //Validar si tiene permisos (tokenización) X Hoy No lo vemos X
        //Actualizar (BD)
        let updatedUser = await User.findOneAndUpdate(
            {_id: id}, //ObjectsId <- hexadecimales (Hora sys, Version Mongo, Llave privada...)
            data, //Los datos que se van a actualizar
            {new: true} //Objeto de la BD ya actualizado
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
        //Validar si está logeado y es el mismo X No lo vemos hoy X
        //Eliminar (deleteOne (solo elimina no devuelve el documento) / findOneAndDelete (Me devuelve el documento eliminado))
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
        const { userId } = req.params;

        // Buscar todas las facturas asociadas al usuario
        const purchaseHistory = await Invoice.find({ userId }).populate('items.productId');

        // Enviar la lista de facturas al cliente
        res.status(200).json({ purchaseHistory });
    } catch (error) {
        console.error('Error al obtener el historial de compras:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};


export const getProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener perfil de usuario.' });
    }
};


export const changePassword = async (req, res) => {
    try {
        // Obtiene la solicitud
        const { username, password, newPassword, newName } = req.body;

        // Valida que al menos un campo sea proporcionado para editar
        if (!username && !newPassword && !newName) {
            return res.status(400).send({ message: 'Se requiere al menos un campo para editar.' });
        }

        // Encuentra al usuario por su ID
        const user = await User.findById(req.user.id);

        // Si se proporciona un nuevo nombre, actualizarlo
        if (newName) {
            user.name = newName;
        }

        // Si se proporciona un nuevo nombre de usuario, actualizarlo
        if (username) {
            user.username = username;
        }

        // Si se proporciona una nueva contraseña, validar la contraseña anterior y actualizarla
        if (newPassword) {
            if (!password) {
                return res.status(400).send({ message: 'Se requiere la contraseña anterior para cambiarla.' });
            }
            // Verifica la contraseña anterior
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(400).send({ message: 'La contraseña anterior es incorrecta.' });
            }
            // Genera la nueva contraseña
            const hashedNewPassword = await bcrypt.hash(newPassword, 10);
            // Actualiza la contraseña
            user.password = hashedNewPassword;
        }

        // Guarda los cambios en el perfil del usuario
        await user.save();

        // Verifica si se actualizó la contraseña
        const passwordUpdated = newPassword ? true : false;

        return res.send({ message: 'Perfil actualizado correctamente.', passwordUpdated });
    } catch (err) {
        console.error(err);
        return res.status(500).send({ message: 'Error al actualizar el perfil.' });
    }
};


export const updateProfileById = async (req, res) => {
    try {
        // Obtener el ID del usuario y los datos a actualizar
        const { id } = req.params;
        const { email, name, surname } = req.body;

        // Verificar que al menos un campo a actualizar esté presente
        if (!email && !name && !surname) {
            return res.status(400).json({ message: 'Se requiere al menos un campo para actualizar.' });
        }

        // Buscar el usuario por su ID
        let user = await User.findById(id);

        // Verificar si el usuario existe
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        // Actualizar el correo electrónico si se proporciona
        if (email) {
            user.email = email;
        }

        // Actualizar el nombre si se proporciona
        if (name) {
            user.name = name;
        }

        // Actualizar el apellido si se proporciona
        if (surname) {
            user.surname = surname;
        }

        // Guardar los cambios en el usuario
        user = await user.save();

        return res.status(200).json({ message: 'Perfil actualizado correctamente.', user });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error al actualizar el perfil.' });
    }
};


export const deleteClient = async (req, res) => {
    try {
        // Obtener el ID del usuario autenticado y el ID de la cuenta a eliminar
        const { id: authUserId } = req.user; // Suponiendo que tienes el ID del usuario autenticado en req.user
        const { id: userIdToDelete } = req.params;

        // Verificar si el usuario autenticado es el mismo que desea eliminar
        if (authUserId !== userIdToDelete) {
            return res.status(403).json({ message: 'No tienes permiso para eliminar esta cuenta.' });
        }

        // Buscar el usuario por su ID
        const user = await User.findById(userIdToDelete);

        // Verificar si el usuario existe
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        // Eliminar el usuario de la base de datos
        await User.findByIdAndDelete(userIdToDelete);

        // Responder con un mensaje de éxito
        return res.status(200).json({ message: 'Cuenta eliminada correctamente.' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error al eliminar la cuenta.' });
    }
};
