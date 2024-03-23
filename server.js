const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const mongoose = require('mongoose');
const fs = require('fs');
const { ObjectId } = require('mongodb');
const { log } = require('console');
const app = express();
const mongooseURI = 'mongodb://localhost:27017/multer';

app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

mongoose.connect(mongooseURI, { useNewUrlParser: true, useUnifiedTopology: true });

const conn = mongoose.connection;

conn.on('error', console.error.bind(console, 'connection error:'));

conn.once('open', () => {
    console.log('Connected to database!');
});

app.listen(3000, () => {
    console.log('Server is running on port 3000.');
});

// set storage 
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads');
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now());
    }
});
var upload = multer({ storage: storage });

app.post('/uploadfile', upload.single('myFile'), (req, res, next) => {
    const file = req.file;
    if (!file) {
        const error = new Error('Please upload a file');
        error.httpStatusCode = 400;
        return next(error);
    }
    res.send(file);
})

app.post('/uploadmultiple', upload.array('myFiles', 12), (req, res, next) => {
    const files = req.files;
    if (!files) {
        const error = new Error('Please choose files');
        error.httpStatusCode = 400;
        return next(error);
    }
    res.send(files);
})

app.post('/uploadphoto', upload.single('myImage'), (req, res) => {
    const img = fs.readFileSync(req.file.path);
    var encode_image = img.toString('base64');

    var finalImg = {
        contentType: req.file.mimetype,
        image: new Buffer(encode_image, 'base64')
    };

    conn.collection('uploads').insertOne(finalImg, (err, result) => {
        console.log(result);
        if (err) return console.log(err);
        console.log('saved to database');
        res.redirect('/');
    })
});

app.get('/photo/:id', (req, res) => {
    var filename = req.params.id;

    conn.collection('uploads').findOne({ _id: new ObjectId(filename) }, (err, result) => {
        if (err) return console.log(err);
        res.contentType('image/jpeg');
        res.send(result.image.buffer);
    })
});

// get all files
app.get('/files', (req, res) => {
    conn.collection('uploads').find({}).toArray((err, result) => {
        if (err) return console.log(err);
        res.send(result);
    })
});