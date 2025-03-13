const mongoose=require('mongoose')

mongoose.connect('mongodb://127.0.0.1/urls')
.then(result=>console.log('Connecttion OK'))
.catch(err=>console.log(err))

let urlSchema=new mongoose.Schema({
    originalUrl:String,
    shortUrl:characters,
    clicks
})