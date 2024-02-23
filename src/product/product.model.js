import mongoose from "mongoose";
import Category from '../category/category.model.js'

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: String,
    price: {
        type: String,
        required: true
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category', // Esto se refiere al modelo de categoría que estás utilizando
        required: true  // Establece que el categoryId es requerido
    },
    quantity: {
        type: Number,
        default: 0
    }
},{
    versionKey: false
}
);


export default mongoose.model ('Product', productSchema)