import Product from './product.model.js'
import Category from '../category/category.model.js';


export const createProduct = async (req, res) => {
    try {
        const { name, description, price, quantity, categoryId } = req.body;
        
        // Verificar si la categoría existe
        const existingCategory = await Category.findById(categoryId);
        if (!existingCategory) {
            return res.status(404).json({ message: 'Category not found.' });
        }

        // CreaW
        const product = new Product({
            name,
            description,
            price,
            quantity,
            categoryId
        });

        // Guardar el producto
        const newProduct = await product.save();

        // Responder con el nuevo producto
        res.status(201).json({ message: 'Product created successfully', product: newProduct });
    } catch (error) {
        // Manejo de errores
        console.error(error);
        res.status(400).json({ message: 'Error creating product', error: error.message });
    }
};


export const getAllProducts = async (req, res) => {
    try {
        // Obtener todos los productos existentes
        const products = await Product.find().populate('categoryId', 'name');
        // Aqui nos tira todos los productos en lista
        res.send({ message: 'Products retrieved successfully', products });
    } catch (error) {
        // Manejos de errores
        res.status(500).send({ message: 'Error retrieving products', error: error.message });
    }
}


export const getProductById = async (req, res) => {
    try {
        //Obtener el id del producto
        const productId = req.params.id;
        //Buscar el producto 
        const product = await Product.findById(productId);
        //Verifica
        if (!product) {
            //Y si no se encuentra responde
            return res.status(404).send({ message: 'Product not found' })
        }
        //Si se encuenta responde
        return res.send(product)
    } catch (error) {
        //Manejar cualquier error que ocurra
        console.error(error)
        return res.status(500).send({ message: error.message })
    }
}

export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params
        const updatedProduct = await Product.findByIdAndUpdate(id, req.body, { new: true })
        if (!updatedProduct) {
            return res.status(404).send({ message: 'Product not found' })
        }
        return res.send(updatedProduct)
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
}

export const Inventory = async (req, res) => {
    try {
        const products = await Product.find().select('_id name description')
        res.send(products)
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
}

export const getOutOfStockProducts = async (req, res) => {
    try {
        const outOfStockProducts = await Product.find({ quantity: 0 }).select('_id name quantity')
        res.send(outOfStockProducts)
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
}

// Eliminar un producto
export const deleteProduct = async (req, res) => {
    try {
        // Obtener el id de producto
        const { id } = req.params
        // Buscar y eliminar
        const deletedProduct = await Product.findByIdAndDelete(id)
        // Verificar el producto
        if (!deletedProduct) {
            // Si no se encuentra el producto
            return res.status(404).json({ message: 'Product not found' })
        }
        // Mensaje que fue eliminado
        return res.send({ message: 'Product deleted successfully' })
    } catch (error) {
        //Manejar cualquier error que ocurra
        res.status(500).send({ message: error.message })
    }
}



// Función de busqueda de los productos mas vendidos 
export const getBestSellers = async (req, res) => {
    try {
        // Obtener los productos con al menos una venta.
        const bestSellers = await Product.find({ sales: { $gt: 0 } }).sort({ sales: -1 }).limit(10)
        
        // Productos mas vendidos
        const response = {
            message: 'Here are the products that have sold the most.',
            bestSellers: bestSellers
        }
        
        res.send(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error getting the best selling products' })
    }
}

// Función de busqueda por nombre
export const searchProductsByName = async (req, res) => {
    try {
        const { name } = req.params;
        const products = await Product.find({ name: { $regex: new RegExp(name, 'i') } })

        if (products.length === 0) {
            return res.status(404).json({ message: ' No products were found with that name' })
        }

        res.send(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error when searching for products by name' })
    }
}

// Función para obtener todas las categorías de productos

export const getProductsCategory = async (req, res) => {
    try {
        const categoryName = req.body.categoryName;
        const products = await Product.find({ categoryName: categoryName });

        if (!products || products.length === 0) {
            return res.status(404).json({ message: 'No products found for this category' });
        }

        return res.json(products);
    } catch (error) {
        return res.status(500).json({ message: 'Error retrieving products', error: error.message });
    }
}



export const getProductsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        // Buscar productos por categoría y poblar los detalles de la categoría
        const products = await Product.find({ category }).populate('categoryId', 'name')
        res.send(products)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Error al obtener los productos por categoría.' })
    }
}