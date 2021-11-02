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
//API che dato uno username restituisce la timeline dei suoi Tweets
//Out of date, ora usiamo la v2
/*app.get('/user/:id', (req, res) => {
  T.get('statuses/user_timeline', {screen_name: req.params.id},(err, data, new_res) => {
    //console.log(data[0].created_at);
    res.status(200).json(data);
  })
});*/

//API che dato uno username restituisce la timeline dei suoi Tweets
//v2
app.get('/users/:name', async(req, res) => {
  let userID= '';
  try{
   userID = await client.v2.userByUsername(req.params.name);
  }
  catch(error){
    console.log(error);
  }
  let userTweets='';
  try{
   userTweets = await client.v2.userTimeline(userID.data.id);
  }
  catch(error){
    console.log(error);
  }
  res.status(200).json(userTweets._realData.data);
});

//API che data una stringa restituisce i tweet più popolari contenenti la data stringa
//v1
app.get('/recent/:word', (req, res) => {
  T.get('search/tweets', {q: req.params.word, result_type:'popular'},(err, data, res2) => {
    //console.log(res2);
    res.status(200).json(data);
  })
});


app.get('/tag/:word', (req, res) => {
  T.get('search/tweets', {q: '#' + req.params.word, result_type:'popular'},(err, data, res2) => {
    res.status(200).json(data);
  })
});

app.get('/geo/:place', (req, res) => {
  T.get('geo/search', {query: req.params.place, max_results:'1'}, (err, data) =>{
    try{
      let coordinates = data.result.places[0].bounding_box.coordinates;
      coordinates = coordinates[0];
      //Aspettiamo che skin faccia questa funzione
      //coordinates = find_medium(coordinates);
      georeq = coordinates[0][1] + ',' + coordinates[0][0] + ',10mi';
      T.get('search/tweets', {q: 'since:2020-01-01', geocode: georeq, count: 50, result_type: 'recent'}, (err2, data2) =>{
        res.status(200).json(data2);
      })
    }
    catch{
      res.status(404).json(err);
    }
  })
})


const port = process.env.PORT || 8000
app.listen(port, () => console.log(`Listening on port ${port}...`));
