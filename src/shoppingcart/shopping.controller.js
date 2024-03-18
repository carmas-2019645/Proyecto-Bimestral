    import jwt from 'jsonwebtoken'
    import ShoppingCart from './shopping.model.js'
    import Product from '../product/product.model.js'
    import User from '../user/user.model.js'
    import Invoice from '../invoice/invoice.model.js'



    export const addToCart = async (req, res) => {
        try {
            // Obtener el token de los headers
            const secretKey = process.env.SECRET_KEY;
            const { authorization } = req.headers;
            
            // Verificar el token y obtener el ID de usuario
            const { uid } = jwt.verify(authorization, secretKey);
            
            // Obtener los datos del cuerpo de la solicitud
            const { productId, quantity, productName } = req.body;
    
            // Verificar si el producto existe y obtener su precio y nombre
            let product;
            if (productId) {
                product = await Product.findById(productId);
            } else if (productName) {
                product = await Product.findOne({ name: productName });
            }
    
            if (!product) {
                return res.status(404).json({ message: 'Product not found.' });
            }
    
            // Verificar si quantity es un número válido
            const parsedQuantity = parseInt(quantity);
            if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
                return res.status(400).json({ message: 'Invalid quantity.' });
            }
    
            // Calcular el totalAmount
            const totalAmount = product.price * parsedQuantity;
    
            // Verificar si el carrito ya existe para este usuario
            let cart = await ShoppingCart.findOne({ userId: uid });
    
            if (!cart) {
                // Si el carrito no existe, crear uno nuevo
                cart = new ShoppingCart({
                    userId: uid,
                    items: [],
                    totalAmount: 0
                });
            }
    
            // Verificar si el producto ya está en el carrito
            const existingProductIndex = cart.items.findIndex(item => item.productId.toString() === product._id.toString());
    
            if (existingProductIndex !== -1) {
                // Si el producto ya está en el carrito, actualizar la cantidad y el total
                cart.items[existingProductIndex].quantity += parsedQuantity;
                cart.totalAmount += totalAmount;
            } else {
                // Si el producto no está en el carrito, agregarlo
                cart.items.push({
                    productId: product._id,
                    productName: product.name,
                    quantity: parsedQuantity,
                    price: product.price
                });
                cart.totalAmount += totalAmount;
            }
    
            // Guardar el carrito
            await cart.save();
    
            res.status(200).json({ message: 'Product added to cart successfully.', cart: cart });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    };

    export const removeSelectedProduct = async (req, res) => {
        try {
            // Obtener el nombre del producto o el ID del cuerpo de la solicitud
            const { productName, productId } = req.body;
    
            // Obtener el token de los headers
            const secretKey = process.env.SECRET_KEY;
            const { authorization } = req.headers;
            
            // Verificar el token y obtener el ID de usuario
            const { uid } = jwt.verify(authorization, secretKey);
    
            // Buscar el carrito del usuario
            let cart = await ShoppingCart.findOne({ userId: uid });
    
            // Verificar si el carrito existe
            if (!cart) {
                return res.status(404).json({ message: 'Shopping cart not found.' });
            }
    
            let index;
            // Buscar el índice del producto en el carrito por el nombre del producto
            if (productName) {
                index = cart.items.findIndex(item => item.productName === productName);
            } else if (productId) {
                // Buscar el índice del producto en el carrito por el ID del producto
                index = cart.items.findIndex(item => item.productId.toString() === productId);
            }
    
            // Verificar si el producto existe en el carrito
            if (index === -1) {
                return res.status(404).json({ message: 'Selected product not found in cart.' });
            }
    
            // Obtener el precio del producto a eliminar
            const productPrice = cart.items[index].price;
    
            // Restar el precio del producto eliminado del total del carrito
            cart.totalAmount -= productPrice;
    
            // Eliminar el producto del carrito
            cart.items.splice(index, 1);
    
            // Guardar el carrito actualizado
            await cart.save();
    
            // Responder con un mensaje de éxito
            return res.status(200).json({ message: 'Selected product removed from cart successfully.', cart });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    };

    export const completePurchase = async (req, res) => {
        try {
            // Obtiene el token 
            let secretKey = process.env.SECRET_KEY
            // Obtener el token de los headers
            let { authorization } = req.headers
    
            // Verifica el token 
            let { uid } = jwt.verify(authorization, secretKey)
    
            // Obtiene el carrito y lo populate
            const cart = await ShoppingCart.findOne({ userId: uid }).populate('items.productId')
    
            // Verifica si el carrito no esta vacio
            if (!cart || cart.items.length === 0) {
                return res.status(400).json({ message: 'The shopping cart is empty.' })
            }
    
            // Calcular el total
            let totalAmount = 0;
            for (const item of cart.items) {
                totalAmount += item.quantity * item.productId.price
            }
    
            // Verifica si hay productos disponibles
            for (const item of cart.items) {
                const product = await Product.findById(item.productId)
                if (!product || product.quantity < item.quantity) {
                    return res.status(400).json({ message: 'Insufficient stock for one or more products in the cart.' })
                }
            }
    
            // Actualizar los productos en el inventario
            const promises = [];
            for (const item of cart.items) {
                const product = await Product.findById(item.productId);
                product.quantity -= item.quantity // Restar cantidad
                product.sales += item.quantity // Actualiza ventas
                promises.push(product.save()) // Guarda
            }
            await Promise.all(promises)
    
            // Crea la factura
            const invoice = new Invoice({
                userId: uid, // Corregido: utilizar uid en lugar de userId
                items: cart.items,
                totalAmount
            })
    
            // Guarda la factura
            await invoice.save()
    
            // Vacia el carrito
            cart.items = [];
            cart.totalAmount = 0
            await cart.save();
    
    
            // Devuelve la factura al Usuario
            res.status(200).json({ message: 'Purchase completed successfully.', invoice })
        } catch (error) {
            res.status(500).json({ message: error.message })
        }
    }