    import ShoppingCart from './shopping.model.js'
    import Product from '../product/product.model.js'
    import User from '../user/user.model.js'
    import Invoice from '../invoice/invoice.model.js'


    // Agregar un producto al carrito de compras
    export const addToCart = async (req, res) => {
        try {
            const { userId, productId, quantity } = req.body;

            // Verificar si el producto existe y obtener su precio
            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({ message: 'Product not found.' });
            }

            // Verificar si quantity es un número válido
            const parsedQuantity = parseInt(quantity);
            if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
                return res.status(400).json({ message: 'Invalid quantity.' });
            }

            // Calcular el totalAmount basado en el precio del producto y la cantidad
            const totalAmount = product.price * parsedQuantity;

            // Verificar si el carrito del usuario ya existe
            let cart = await ShoppingCart.findOne({ userId });

            // Si el carrito no existe, crear uno nuevo
            if (!cart) {
                cart = new ShoppingCart({
                    userId,
                    items: [{ productId: product._id, quantity: parsedQuantity, price: product.price }],
                    totalAmount
                });
            } else {
                // Si el carrito ya existe, agregar el producto al arreglo de items
                cart.items.push({ productId: product._id, quantity: parsedQuantity, price: product.price });

                // Recalcular el totalAmount sumando el precio del nuevo producto
                cart.totalAmount += totalAmount;
            }

            // Guardar el carrito actualizado en la base de datos
            await cart.save();

            res.status(200).json({ message: 'Product added to cart successfully.' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    };

        export const removeSelectedProduct = async (req, res) => {
            try {
                const { cartId, userId, productId } = req.params;
        
                // Buscar el carrito del usuario por su ID
                let cart = await ShoppingCart.findById(cartId);
        
                // Verificar si el carrito pertenece al usuario
                if (cart.userId.toString() !== userId) {
                    return res.status(403).json({ message: 'Unauthorized access to the shopping cart.' });
                }
        
                // Filtrar el arreglo de items para eliminar el producto con el productId especificado
                cart.items = cart.items.filter(item => item.productId.toString() !== productId);
        
                // Guardar el carrito actualizado en la base de datos
                await cart.save();
        
                res.status(200).json({ message: 'Selected product removed from cart successfully.' });
            } catch (error) {
                res.status(500).json({ message: error.message });
            }
        };

        export const completePurchase = async (req, res) => {
    try {
        const { userId } = req.params;

        // Obtener el carrito de compras del usuario, populando los productos
        const cart = await ShoppingCart.findOne({ userId }).populate('items.productId');

        // Verificar si el carrito está vacío
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: 'The shopping cart is empty.' });
        }

        // Calcular el total de la compra
        let totalAmount = 0;
        for (const item of cart.items) {
            totalAmount += item.quantity * item.productId.price; // Usar item.productId.price en lugar de item.price
        }

        // Verificar si hay suficiente stock disponible para los productos en el carrito
        for (const item of cart.items) {
            const product = await Product.findById(item.productId);
            if (!product || product.quantity < item.quantity) {
                return res.status(400).json({ message: 'Insufficient stock for one or more products in the cart.' });
            }
        }

        // Actualizar las cantidades de productos en stock y crear la factura
        const promises = [];
        for (const item of cart.items) {
            const product = await Product.findById(item.productId);
            product.quantity -= item.quantity; // Restar la cantidad comprada del stock
            product.sales += item.quantity; // Actualizar las ventas del producto
            promises.push(product.save()); // Guardar el producto actualizado
        }
        await Promise.all(promises); // Esperar a que todas las actualizaciones se completen

        // Crear la factura, utilizando los documentos populados de los productos
        const invoice = new Invoice({
            userId,
            items: cart.items,
            totalAmount
        });

        // Guardar la factura en la base de datos
        await invoice.save();

        // Vaciar el carrito de compras del usuario
        cart.items = [];
        await cart.save();

        // Devolver la factura al usuario
        res.status(200).json({ message: 'Purchase completed successfully.', invoice });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
