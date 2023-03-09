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
const {CloudFrontClient, CreateInvalidationCommand} = require('@aws-sdk/client-cloudfront')
const s3 = new S3Client({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY
    },
    region: 'us-east-1'
})
const CloudFront = new CloudFrontClient({
    credentials:{
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY 
    },
    region: 'us-east-1'
})


router.post('/images', upload.single('image'), async(req, res) =>{
    const {userId} = req  // it comes from the AUTH middle function
    const {caption} = req.body
    const file = req.file 
    if(!file) return res.status(StatusCodes.BAD_REQUEST).json({msg: 'there is no file to upload'}) // what if there is no file?
    console.log(file)
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
            post.imageUrl = process.env.CDN_URL + `/${post.imageName}`
        }   
        return res.status(StatusCodes.OK).json({posts})
    }catch(err){
        console.log(err)
        return res.status(500).json({err})
    }
}) 
router.delete('/image/:id', async (req, res) => {
    try{
        const imageId = req.params.id 
        const userId = req.userId 
        const post = await Post.findOneAndDelete({imageName: imageId, createdBy: userId}) 
        if(!post) return res.status(StatusCodes.NOT_FOUND).json({err: 'not found'})
        const deleteCommand = new DeleteObjectCommand({
            Key: imageId,
            Bucket: process.env.AWS_BUCKET_NAME
        })
        const AWS_Response = await s3.send(deleteCommand) // delete from the s3 bucket 
        // then we need to invalidate the cash for that image
        const invalidationCommand = new CreateInvalidationCommand({
            DistributionId: process.env.DISTRIBUTION_ID,
            InvalidationBatch: {
                CallerReference: post.imageName,
                Paths: {
                    Quantity: 1,
                    Items: ['/' + post.imageName]
                }
            }
        })
        await CloudFront.send(invalidationCommand) // delete from CDN 
        return res.status(StatusCodes.OK).json({msg: 'image has been deleted'})
    }catch(err){
        console.log(err)
        return res.status(500).json({err: 'some error'})
    }
})



module.exports = router 