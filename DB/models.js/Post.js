const mongoose = require('mongoose')


const PostSchema = new mongoose.Schema({
    imageName: {
        type: String,
        default: ''
    },
    imageUrl: {
        type: String,
        default: ''
    },
    caption: {
        type: String,
        default: ''
    },
    createdBy: {
        type: mongoose.Types.ObjectId
    }
})

const Post = mongoose.model('posts', PostSchema)

module.exports = Post