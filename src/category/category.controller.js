import Category from './category.model.js'
import Product from './../product/product.model.js'

export const testC = (req, res) => {
    console.log('Category test is running..');
    res.send({ message: `Category test is running` })
}


export const createCategory = async (req, res) => {
    const { name, description } = req.body;
    try {
        //Verificamos que no exista la categoria
        const existingCategory = await Category.findOne({ name });

        if (existingCategory) {
            return res.status(400).json({ message: 'Category with this name already exists' });
        }

        //Si no existe la categoria, crea la otra
        const newCategory = await Category.create({ name, description });
        return res.status(201).json({ message: 'Category created successfully', category: newCategory });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const createDefault = async (req, res) => {
    try {
        // Verificar si ya existe una categoría con el nombre "Default"
        const existingCategory = await Category.findOne({ name: 'Default' });

        if (existingCategory) {
            return res.status(400).json({ message: 'Category with name "Default" already exists' });
        }

        // Crear la nueva categoría "Default"
        const newCategory = await Category.create({ name: 'Default', description: 'Productos que no tienen categoría' });

        return res.status(201).json({ message: 'Category created successfully', category: newCategory });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};



export const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find();

        if (!categories || categories.length === 0) {
            return res.status(404).json({ message: 'No categories found' });
        }

        return res.json(categories);
    } catch (error) {
        return res.status(500).json({ message: 'Error retrieving categories', error: error.message });
    }
};


export const updateCategory = async (req, res) => {
    try {
        const updatedCategory = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });

        if (!updatedCategory) {
            return res.status(404).json({ message: 'Category not found' });
        }

        return res.json({ message: 'Category updated successfully', category: updatedCategory });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};


export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        // Buscamos la categoria que vamos a eliminar
        const categoryToDelete = await Category.findById(id);

        // Verificamos si existe la categoria
        if (!categoryToDelete) {
            return res.status(404).send({ message: 'Category not found' });
        }

        // Aqui esta la categoria default
        const defaultCategory = await Category.findOne({ name: 'Default' });

        // Hace una busqueda de todos los productos si tiene relacion con la categoria
        const productsToUpdate = await Product.find({ categoryId: id });

            // Si eliminamos la categoria por default guarda a los productos
            await Promise.all(productsToUpdate.map(async (product) => {
                product.categoryId = defaultCategory._id;
                await product.save();
            }));

        // Elimina la categoría
        await Category.findByIdAndDelete(id);

        return res.send({ message: 'Deleted Category successfully' });
    } catch (err) {
        console.error(err);
        return res.status(500).send({ message: 'Error deleting category' });
    }
};
