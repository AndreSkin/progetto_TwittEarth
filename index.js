const express = require('express');
const app = express();
const cors = require('cors');
const Twit = require('twit');
const { TwitterApi } = require('twitter-api-v2');
var sentiment = require('node-sentiment');

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

/*
//API che dato uno username restituisce la timeline dei suoi Tweets
//Out of date, ora usiamo la v2
app.get('/user/:id', (req, res) => {
  T.get('statuses/user_timeline', {screen_name: req.params.id},(err, data, new_res) => {
    //console.log(data[0].created_at);
    res.status(200).json(data);
  })
});
*/

//API v2 che dato uno username restituisce la timeline dei suoi Tweets
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
   userTweets = await client.v2.userTimeline(userID.data.id, {'expansions':'geo.place_id'});
  }
  catch(error){
    res.status(404).json(error);
  }
  res.status(200).json(userTweets._realData);
});

//Api v1 che dato un place id restituisce informazioni sul luogo corrispondente
app.get('/place/:id', async(req, res) => {
  let place= '';
  try{
   place = await client.v1.geoPlace(req.params.id);
  }
  catch(error){
    res.status(404).json(error);
  }
  res.status(200).json(place);
});

/*
//API che data una stringa restituisce i tweet più popolari contenenti la data stringa
//v1
app.get('/recent/:word', (req, res) => {
  T.get('search/tweets', {q: req.params.word, result_type:'popular'},(err, data, res2) => {
    //console.log(res2);
    res.status(200).json(data);
  })
});
*/

//Api v2 che data una stringa restituisce i tweet più recenti contenenti la data stringa
/*app.get('/recents/:word', async(req, res) => {
  let recentTweets= '';
  try{
   recentTweets = await client.v2.search(req.params.word, {'expansions':'geo.place_id'});
  }
  catch(error){
    res.status(404).json(error);
  }
  res.status(200).json(recentTweets._realData);
});*/

/*
app.get('/tag/:word', (req, res) => {
  T.get('search/tweets', {q: '#' + req.params.word, result_type:'popular'},(err, data, res2) => {
    res.status(200).json(data);
  })
});
*/

//Api v2 che dato un hashtag restituisce i tweet più recenti che lo contengono

app.get('/tags/:word', async(req, res) => {
  let recentTweets= '';
  try{
   recentTweets = await client.v2.search('#' + req.params.word, {'expansions':'geo.place_id'});
  }
  catch(error){
    res.status(404).json(error);
  }
  res.status(200).json(recentTweets._realData);
});

/*Dato un array di coordinate trova il centro*/
function find_medium(coordinates){
  let sumX = 0;
  let sumY = 0;
  for (var i = 0; i < coordinates.length; i++){
    sumX += coordinates[i][0];
    sumY += coordinates[i][1];
  }
  let mediaX = sumX / coordinates.length;
  let mediaY = sumY / coordinates.length;

  let coord = [mediaX ,mediaY];
  return (coord);
}


app.get('/geo/:place', (req, res) => {
  T.get('geo/search', {query: req.params.place, max_results:'1'}, (err, data) =>{
    try{
      let coordinates = data.result.places[0].bounding_box.coordinates;
      coordinates = coordinates[0];
      coordinates = find_medium(coordinates);
      georeq = coordinates[1] + ',' + coordinates[0] + ',10mi';
      T.get('search/tweets', {q: 'since:2020-01-01', geocode: georeq, count: 500, result_type: 'recent'}, (err2, data2) =>{
        res.status(200).json(data2);
      })
    }
    catch{
      res.status(404).json(err);
    }
  })
})

app.get('/geoid/:id', async(req, res) => {
  let luogo= '';
  try{
   luogo = await client.v1.geoPlace(req.params.id);
  }
  catch(error){
    res.status(404).json(error);
  }
  res.status(200).json(find_medium(luogo.bounding_box.coordinates[0]));
});


async function sentiment_analyze(toAnalyze){
    let TotScore = 0;
    let ignored =0;

  //Di ogni tweet ottenuto analizzo il testo
    for(let singletweet of toAnalyze){
      try{
        const regEx = new RegExp('@', "g");
        let replaced = singletweet['text'].replace(regEx,'')

        //Ottengo lo score complessivo
        TotScore = TotScore + parseFloat(sentiment(replaced)['score']);
      }
      catch (e){
        //In caso di errori (es. tweet contenenti solo un tag), ignoro il tweet
        console.log("\n\n"+ e + "\n\n");
        ignored++;
      }
    }
  //Restituisco la media degli score dei tweets considerati
    let seen = (toAnalyze.length) - ignored;
    return(TotScore / seen);
}

//Endpoint per ottenere uno score di sentiment analysis data una parola
app.get('/recents/:word', async(req, res) => {
  //Ottengo i tweets contenenti la parola data
  let tweets= '';
  let query = req.params.word;
  if (query[0] == '~') {
    query = '#' + req.params.word.substring(1);
  }

  if (query[0] == '@') {
    query = '@'+req.params.word.substring(1);
  }

  let toSentiment = req.query.sentiment;
  try{
   tweets = await client.v2.search(query, {'max_results':100, 'expansions':'geo.place_id'});
  }
  catch(error){
    res.status(404).json(error);
  }
  let toAnalyze = tweets._realData.data;

  let sentiment = null;
  if(toSentiment == "true"){
    sentiment = await sentiment_analyze(toAnalyze);
  }

  let toRet = { 'sentiment' : sentiment, 'tweets' : tweets._realData};
  res.status(200).json(toRet);
});


const port = process.env.PORT || 8000
app.listen(port, () => console.log(`Listening on port ${port}...`));
