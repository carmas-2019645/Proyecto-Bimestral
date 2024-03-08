    import jwt from 'jsonwebtoken'
    import ShoppingCart from './shopping.model.js'
    import Product from '../product/product.model.js'
    import User from '../user/user.model.js'
    import Invoice from '../invoice/invoice.model.js'



    export const addToCart = async (req, res) => {
        try {
            // Obteniene el token
            let secretKey = process.env.SECRET_KEY;
            // Obtener el token de los headers
            let { authorization } = req.headers;
            // Verifica
            let { uid } = jwt.verify(authorization, secretKey);
            // Obtener los datos del cuerpo de la solicitud
            const { productId, quantity, productName } = req.body;
            // Verificar si el producto existe y obtener su precio
            let product;
            if (productId) {
                product = await Product.findById(productId);
            } else if (productName) {
                product = await Product.findOne({ name: productName });
            }
    
            if (!product) {
                return res.status(404).send({ message: 'Product not found.' });
            }
    
            // Verificar si quantity es un número válido
            const parsedQuantity = parseInt(quantity);
            if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
                return res.status(400).send({ message: 'Invalid quantity.' });
            }
    
            // Calcular el totalAmount
            const totalAmount = product.price * parsedQuantity;
    
            // Verificar si el carrito ya existe para este usuario
            let cart = await ShoppingCart.findOne({ userId: uid });
    
            // Si el carrito no existe, crear uno nuevo
            if (!cart) {
                cart = new ShoppingCart({
                    userId: uid,
                    items: [{ productId: product._id, productName: product.name, quantity: parsedQuantity, price: product.price }],
                    totalAmount
                });
            } else {
                // Si el carrito ya existe, agregar el producto al carrito
                cart.items.push({ productId: product._id, productName: product.name, quantity: parsedQuantity, price: product.price });
    
                // Recalcular el total
                cart.totalAmount += totalAmount;
            }
    
            // Guardar el carrito
            await cart.save();
    
            res.status(200).json({ message: 'Product added to cart successfully.' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    };


    export const removeSelectedProduct = async (req, res) => {
        try {
            // Obteniene el token
            let secretKey = process.env.SECRET_KEY;
            // Obtener el token de los headers
            let { authorization } = req.headers;
    
            // Verifica el token
            let { uid } = jwt.verify(authorization, secretKey);
    
            // Requiere el productName para eliminar
            const { productName } = req.params;
    
            // Buscar el carrito del usuario
            let cart = await ShoppingCart.findOne({ userId: uid });
    
            // Verifica la existencia del carrito
            if (!cart) {
                return res.status(404).json({ message: 'Shopping cart not found.' });
            }
    
            // Busca
            const index = cart.items.findIndex(item => item.productName === productName);
    
            // Verifica si el producto existe
            if (index === -1) {
                return res.status(404).json({ message: 'Selected product not found in cart.' });
            }
    
            // Obtiene el precio y lo elimina
            const productPrice = cart.items[index].price;
    
            // Aqui resta el producto eliminado
            cart.totalAmount -= productPrice;
    
            // Elimina definitivamente el producto
            cart.items.splice(index, 1);
    
            // Guardar el carrito actualizado
            await cart.save();
    
            res.status(200).json({ message: 'Selected product removed from cart successfully.' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    };


    export const completePurchase = async (req, res) => {
        try {
            // Obtiene el token 
            let secretKey = process.env.SECRET_KEY;
            // Obtener el token de los headers
            let { authorization } = req.headers;
    
            // Verifica el token 
            let { uid } = jwt.verify(authorization, secretKey);
    
            // Obtiene el carrito y lo populate
            const cart = await ShoppingCart.findOne({ userId: uid }).populate('items.productId');
    
            // Verifica si el carrito no esta vacio
            if (!cart || cart.items.length === 0) {
                return res.status(400).json({ message: 'The shopping cart is empty.' });
            }
    
            // Calcular el total
            let totalAmount = 0;
            for (const item of cart.items) {
                totalAmount += item.quantity * item.productId.price;
            }
    
            // Verifica si hay productos disponibles
            for (const item of cart.items) {
                const product = await Product.findById(item.productId);
                if (!product || product.quantity < item.quantity) {
                    return res.status(400).json({ message: 'Insufficient stock for one or more products in the cart.' });
                }
            }
    
            // Actualizar los productos en el inventario
            const promises = [];
            for (const item of cart.items) {
                const product = await Product.findById(item.productId);
                product.quantity -= item.quantity; // Restar cantidad
                product.sales += item.quantity; // Actualiza ventas
                promises.push(product.save()); // Guarda
            }
            await Promise.all(promises);
    
            // Crea la factura
            const invoice = new Invoice({
                userId: uid, // Corregido: utilizar uid en lugar de userId
                items: cart.items,
                totalAmount
            });
    
            // Guarda
            await invoice.save();
    
            // Vacia el carrito
            cart.items = [];
            await cart.save();
    
            // Devuelve la factura al Usuario
            res.status(200).json({ message: 'Purchase completed successfully.', invoice });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    };
    