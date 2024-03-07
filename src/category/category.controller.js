import Category from './category.model.js'
import Product from './../product/product.model.js'

export const testC = (req, res) => {
    console.log('Category test is running..');
    res.send({ message: `Category test is running` })
}


export const createCategory = async (req, res) => {
    const { name, description } = req.body;
    try {
        //Aqui verificamos que no exista el nombre de categoria que estamos ingresando
        const existingCategory = await Category.findOne({ name });

        if (existingCategory) {
            return res.status(400).json({ message: 'Category with this name already exists' });
        }

        //Si no existe, crea una nueva categoria y la guarda en la base de datos
        const newCategory = await Category.create({ name, description });
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

        // Buscar la categoría que se va a eliminar
        const categoryToDelete = await Category.findById(id);

        // Verificar si la categoría existe antes de intentar eliminarla
        if (!categoryToDelete) {
            return res.status(404).send({ message: 'Category not found' });
        }

        // Encuentra la categoría predeterminada
        const defaultCategory = await Category.findOne({ name: 'Default' });

        // Encuentra todos los productos asociados a la categoría que se va a eliminar
        const productsToUpdate = await Product.find({ categoryId: id });

            // Actualiza cada producto para asignarle la categoría predeterminada
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
