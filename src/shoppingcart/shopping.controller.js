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

            // Calcular el totalAmount
            const totalAmount = product.price * parsedQuantity;

            // Verifica si el carrito ya exista
            let cart = await ShoppingCart.findOne({ userId });

            // Si el carrito no existe crea uno nuevo
            if (!cart) {
                cart = new ShoppingCart({
                    userId,
                    items: [{ productId: product._id, quantity: parsedQuantity, price: product.price }],
                    totalAmount
                });
            } else {
                // Aqui si ya existe el carrito los productos los va aguardando
                cart.items.push({ productId: product._id, quantity: parsedQuantity, price: product.price });

                // Recalcular el totalAmount
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
                const { cartId, userId, productId } = req.params;
        
                // Buscar el carrito
                let cart = await ShoppingCart.findById(cartId);
        
                // Verifica si el id es del usuario
                if (cart.userId.toString() !== userId) {
                    return res.status(403).json({ message: 'Unauthorized access to the shopping cart.' });
                }
        
                // Filtra y lo elimana del arraylist
                cart.items = cart.items.filter(item => item.productId.toString() !== productId);
        
                // Guarda el carrito ya con los cambios
                await cart.save();
        
                res.status(200).json({ message: 'Selected product removed from cart successfully.' });
            } catch (error) {
                res.status(500).json({ message: error.message });
            }
        };

        export const completePurchase = async (req, res) => {
    try {
        const { userId } = req.params;

        // Obteniene el carrito y hace un populate
        const cart = await ShoppingCart.findOne({ userId }).populate('items.productId');

        // Verifica si el carrito esta vacio
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: 'The shopping cart is empty.' });
        }

        // Hace el calculo de la venta total
        let totalAmount = 0;
        for (const item of cart.items) {
            totalAmount += item.quantity * item.productId.price; 
        }

        // Verificar si hay suficiente productos
        for (const item of cart.items) {
            const product = await Product.findById(item.productId);
            if (!product || product.quantity < item.quantity) {
                return res.status(400).json({ message: 'Insufficient stock for one or more products in the cart.' });
            }
        }

        // Actualiza los productos 
        const promises = [];
        for (const item of cart.items) {
            const product = await Product.findById(item.productId);
            product.quantity -= item.quantity; // Resta
            product.sales += item.quantity; // Actualiza
            promises.push(product.save()); // Guardar
        }
        await Promise.all(promises);

        // Crear la factura
        const invoice = new Invoice({
            userId,
            items: cart.items,
            totalAmount
        });

        // Guardar la factura
        await invoice.save();

        // Vacia el carrito
        cart.items = [];
        await cart.save();

        // Devuelve la facfura al cliente
        res.status(200).json({ message: 'Purchase completed successfully.', invoice });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
