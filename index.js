const express = require('express');
const app = express();
const cors = require('cors');
const Twit = require('twit');
const { TwitterApi } = require('twitter-api-v2');

const b_token= "AAAAAAAAAAAAAAAAAAAAAMEAUwEAAAAA1xY%2F32bSU4v5kwxoncHszvMJHx4%3D8gqEEFr90qe45rDMfubNdiMWfZwkkECKAK9SVgs5e6NdQOouCN";

app.use('/', express.static(__dirname + '/'));
app.use(cors());

var T = new Twit({
  consumer_key: "C1To9MvaerpcTFE6s3dXjHFXd",
  consumer_secret: "IH8ec7CnV2VSpgdqsh5IQTysgZMzHafjx8DP3QOqjVrFiBDZQj",
  access_token: "1447914708598722561-FbmOcEaDCAEnDNsojC54vqROseWSzL",
  access_token_secret: "BbnkHQZYa6N7Wqyh2KdGIfZO2ZQLGOzWUdWSmrNKPN93N",
})


// Instanciate with desired auth type (here's Bearer v2 auth)
const twitterClient = new TwitterApi(b_token);
const client = twitterClient.readOnly;
const apiv1 = client.v1;
const apiv2 = client.v2;

app.use(express.json());

/*API*/
app.get('/user/:id', (req, res) => {
  T.get('statuses/user_timeline', {screen_name: req.params.id},(err, data, new_res) => {
    //console.log(data[0].created_at);
    res.status(200).json(data);
  })
});


 app.get('/users/:name', async(req, res) => {
let userdata= '';
try
{
   userdata = await client.v2.userByUsername(req.params.name);
}
catch(error)
{
  console.log(error);
}
let userTweets='';
try
{
   userTweets = await client.v2.userTimeline(userdata.data.id);
}
catch(error)
{
  console.log(error);
}

  res.status(200).json(userTweets);
});


app.get('/recent/:word', (req, res) => {
  T.get('search/tweets', {q: req.params.word, result_type:'popular'},(err, data2, res2) => {
    //console.log(res2);
    res.status(200).json(data2);
  })
});


app.get('/tag/:word', (req, res) => {
  T.get('search/tweets', {q: '#' + req.params.word, result_type:'popular'},(err, data3, res3) => {
    res.status(200).json(data3);
  })
});


app.get('/geo/:id', (req, res) => {
  T.get('search/tweets', {q: '#' + req.params.word, result_type:'popular'},(err, data3, res3) => {
    res.status(200).json(data3);
  })
});


const port = process.env.PORT || 8000
app.listen(port, () => console.log(`Listening on port ${port}...`));
