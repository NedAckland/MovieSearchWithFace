const express = require('express');
const bodyParser = require('body-parser')
const app = express();
const server = app.listen(5000);
const axios = require('axios').default;
const AWS = require('aws-sdk');
const uuid = require('uuid');
const dotenv = require('dotenv')
dotenv.config({ path: './config.env' });


console.log(process.env.AWS_REGION + " <-")

AWS.config.region = process.env.AWS_REGION

AWS.config.credentials = new AWS.CognitoIdentityCredentials({IdentityPoolId: process.env.AWS_IDENTITY_POOL})

var s3Bucket = new AWS.S3({
    params: {
        Bucket: process.env.BUCKET_NAME
    },
    apiVersion: '2012-10-17'
});


app.use(express.static(__dirname + '/views')); 
app.use(express.static(__dirname + '/public')); 

app.use(bodyParser.json({limit: "500kb"}))


app.get('/', (req, res) => {
    res.sendFile('home.html');
});

app.post('/home', (req, res) => {
    res.redirect('home.html');
});



app.post('/image', (req, res) => {
    buf = Buffer.from(req.body.image.replace(/^data:image\/\w+;base64,/, ""), 'base64')
    var data = {
        Key: uuid.v4(),
        Body: buf,
        ContentEncoding: 'base64',
        ContentType: 'image/jpeg'
    };
    s3Bucket.upload(data, function (err, data) {
        if (err) {
            console.log(err);
            console.log('Error uploading data: ', data);
        } else { 
            detectFace(data.Location, res)
        }
    });
});


function detectFace(imageUrl, response) {
    var ApiKey = process.env.MICROSOFT_API_KEY
    var Endpoint = process.env.MICROSOFT_ENDPOINT
    axios.post(`${Endpoint}?returnFaceAttributes=emotion`, {
        'url': imageUrl
    }, {
        headers: {
            'Ocp-Apim-Subscription-Key': ApiKey
        }
    }).then(res => {
        let result = {}
        result = res.data[0].faceAttributes.emotion
        var data = flattenObject(result).join()
        response.json({data: data, apiKey: process.env.TMDB_KEY})

    }).catch(err => { 
        console.log(err.response.data)
    })
}


const flattenObject = (value) => {
    return Object.entries(value).reduce((acc, [key, value]) => {
        if (typeof value === 'object') {
            value = flattenObject(value);
        }
        acc.push(` ${key}: ${value}`);
        return acc;
    }, []);

};

