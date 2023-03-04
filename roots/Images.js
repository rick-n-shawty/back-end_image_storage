const express = require('express')
const router = express.Router()
const {S3Client, GetObjectCommand, DeleteObjectCommand, PutObjectCommand} = require('@aws-sdk/client-s3')
const {getSignedUrl} = require('@aws-sdk/s3-request-presigner') // used to get those cute urls ;)
const multer = require('multer')
const sharp = require('sharp')
const storage = multer.memoryStorage()
const upload = multer({storage})
const {createRandomName} = require('../tokens')
const Post = require('../DB/models.js/Post')
const { StatusCodes } = require('http-status-codes')
const s3 = new S3Client({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY
    },
    region: 'us-east-1'
})

// const getImages = async (req, res) => {}
// const postImage = async (req, res) => {}
// const deleteImage = async (req, res) => {}

router.post('/images', upload.single('image'), async(req, res) =>{
    const {userId} = req  // it comes from the AUTH middle function
    const {caption} = req.body
    const file = req.file 
    if(!file){} // what if there is no file?
    const buffer = await sharp(req.file.buffer).resize({height: 1920, width: 1080, fit:'contain'}).toBuffer()
    const randomImageName = createRandomName()
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: randomImageName,
        Body: buffer,
        ContentType: req.file.mimetype
    }
    const putCommand = new PutObjectCommand(params)
    try{
        const s3_response = await s3.send(putCommand) // creating actual file in the BUCKET
        console.log('s3response', s3_response)
        const post = await Post.create({imageName: randomImageName, createdBy: userId, caption})
        return res.status(StatusCodes.OK).json({msg: 'post created successfuly'})
    }catch(err){
        console.log(err)
        return res.status(500).json([err])
    }
})
router.get('/images', async (req, res) => {
    const userId = req.userId 
    try{
        const posts = await Post.find({createdBy: userId})
        for(const post of posts){
            const getCommand = new GetObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: post.imageName
            })
            const url = await getSignedUrl(s3, getCommand, {expiresIn: 36000})
            post.imageUrl = url
        }
        return res.status(StatusCodes.OK).json({posts})
    }catch(err){
        console.log(err)
        return res.status(500).json({err})
    }
}) 
router.delete('/image/:id') //delete image



module.exports = router 