const { Schema, model } = require("mongoose")

const categorySchema = new Schema({
    products:[{
        type: Schema.Types.ObjectId,
        ref: 'Product'
    }],
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        maxlength: 50
    },
    image: {
        type: String,
        required: true,
        trim: true
    }
}, {
    timestamps: true
})

const Category = model('Category', categorySchema)

module.exports = Category;