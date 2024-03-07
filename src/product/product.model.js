import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: String,
    price: {
        type: Number,
        required: true
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category', 
        required: true  
    },
    quantity: {
        type: Number,
        required: true
    },
    sales: {
        type: Number,
        default: 0
    }
},{
    versionKey: false
});

export default mongoose.model('Product', productSchema);