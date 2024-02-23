import Product from './product.model.js'

export const createProduct = async (req, res) => {
    try {
        const { name, description, price, categoryId } = req.body;

        // Crear una nueva instancia de Producto
        const product = new Product({
            name,
            description,
            price,
            categoryId // Asignar el valor del campo categoryId
        });

        // Guardar el producto en la base de datos
        const newProduct = await product.save();

        // Responder con el nuevo producto creado
        res.status(201).json(newProduct);
    } catch (error) {
        // Manejar errores de validación u otros errores
        res.status(400).json({ message: 'Error creating product', error: error.message });
    }
};

export const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find().populate('categoryId', 'name');
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getProductById = async (req, res) => {
    try {
        const productId = req.params.id;
        
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        return res.json(product);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
};

export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedProduct = await Product.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }
        return res.json(updatedProduct);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const Inventory = async (req, res) => {
    try {
        const products = await Product.find().select('_id name');
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const getOutOfStockProducts = async (req, res) => {
    try {
        const outOfStockProducts = await Product.find({ quantity: 0 }).select('_id name quantity');
        res.json(outOfStockProducts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

