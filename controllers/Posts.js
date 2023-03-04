const {S3Client, GetObjectCommand, DeleteObjectCommand, PutObjectCommand} = require('@aws-sdk/client-s3')
const multer = require('multer')
const storage = multer.memoryStorage()
const upload = multer({storage})
const s3 = new S3Client({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY
    },
    region: 'us-east-1'
})

const getImages = async (req, res) => {}
const postImage = async (req, res) => {}
const deleteImage = async (req, res) => {}