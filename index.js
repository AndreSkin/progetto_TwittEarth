const express = require('express');
const app = express();
const cors = require('cors');
const Twit = require('twit');
const { TwitterApi } = require('twitter-api-v2');
var sentiment = require('multilang-sentiment');

var langdetect = require('langdetect');

const b_token= "AAAAAAAAAAAAAAAAAAAAAMEAUwEAAAAA1xY%2F32bSU4v5kwxoncHszvMJHx4%3D8gqEEFr90qe45rDMfubNdiMWfZwkkECKAK9SVgs5e6NdQOouCN";

app.use('/', express.static(__dirname + '/'));
app.use(cors());

var T = new Twit({
  consumer_key: "C1To9MvaerpcTFE6s3dXjHFXd",
  consumer_secret: "IH8ec7CnV2VSpgdqsh5IQTysgZMzHafjx8DP3QOqjVrFiBDZQj",
  access_token: "1447914708598722561-FbmOcEaDCAEnDNsojC54vqROseWSzL",
  access_token_secret: "BbnkHQZYa6N7Wqyh2KdGIfZO2ZQLGOzWUdWSmrNKPN93N",
})


//Istanzio client per twitter API
const twitterClient = new TwitterApi(b_token);
const client = twitterClient.readOnly;
const apiv1 = client.v1;
const apiv2 = client.v2;

app.use(express.json());

/*API*/

//API v2 che dato uno username restituisce la timeline dei suoi Tweets
app.get('/users/:name', async(req, res) => {
  let userID= '';
  //Dato un nome trovo l'ID
  try{
   userID = await client.v2.userByUsername(req.params.name);
  }
  catch(error){
    console.log(error);
  }
  //Numero dei risultati che si vogliono ottenere (predisposizione per passaggio con parametro)
  let results = 100;
  let userTweets='';
  //Utilizzo l'ID trovato prima per ottenere la user timeline
  try{
   userTweets = await client.v2.userTimeline(userID.data.id, {'max_results': results, 'expansions':'geo.place_id'});
  }
  catch(error){
    res.status(404).json(error);
  }

  let timeline = {'tweets':[]};
  let geo=null;
  //Scorro tutti i tweets
  for(let singletweet of userTweets._realData.data){
    //geo torna null in modo da non conservarne il valore
    geo = null;
    try{
      //Se il tweet è geolocalizzato ottengo dei dati riguardanti il luogo
      if (singletweet.geo != null){
          geo = await getGeo(singletweet.geo.place_id)
      }
      //Creo la risposta
      timeline.tweets.push({
        "Text":singletweet.text,
        "geo": geo
      })
    }
    catch (e){
      console.log("Error: " + e );
    }
  }
  res.status(200).json(timeline);
});


//Api v1 che dato un place id restituisce informazioni sul luogo corrispondente
//Potrebbe ancora servire ma ora c'è una funzione backend apposta
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


//Api v2 che dato un hashtag restituisce i tweet più recenti che lo contengono
//Sostituibile da recents
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

/*Tweet vicini a coordinata*/
app.get('/geo/:place', (req, res) => {
  try{
    coord = req.params.place.split("x")
    georeq = coord[0] + ',' + coord[1] + ',10mi';
    T.get('search/tweets', {q: 'since:2020-01-01', geocode: georeq, count: 500, result_type: 'recent'}, (err2, data2) =>{
      res.status(200).json(data2);
    })
  }
  catch{
    res.status(404).json("error");
  }
})


//Dato un author id restituisce l'username dell'autore corrispondente
async function getauthor(author_id){
  let author= '';
  try{
    author = await client.v2.user(author_id);
  }
  catch(error){
    console.log(error);
  }
  return author.data.username;
};

//Dato un place id restituisce nome e coordinate corrispondenti
async function getGeo(place_id){
  let place= '';
  try{
    place = await client.v1.geoPlace(place_id);
  }
  catch(error){
    console.log(error);
  }

  let geoinfo = {'Name': place.full_name, 'coord_center': place.contained_within[0].centroid};
  return geoinfo;
};

//Funzione di sentiment analysis
async function sentiment_analyze(toAnalyze){
  let ignored = "No";
  let tweet_eval = {'eval': []};
  try{
    //Rimuovo '@' e '#' perchè impediscono una corretta indivduazione della lingua
    const regExHash = new RegExp('#', "g");
    const regExTag = new RegExp('@', "g");
    let notag = toAnalyze.replace(regExHash,'');
    let replaced = notag.replace(regExTag,'');

    //Riconosco la lingua in cui è scritto il tweet (se non riconosciuta ritorna null e ignora il tweet)
    var lang = langdetect.detectOne(replaced);
    ParsedTweet = await sentiment(replaced, lang);

    //Inserisco i dati dell'analisi sul tweet
    tweet_eval.eval.push({
      "Score": ParsedTweet['score'], //Punteggio assegnato
      "TotL": ParsedTweet['tokens'].length, //Lunghezza del tweet
      "Pos": ParsedTweet['positive'], //Array di parole identificate come positive
      "PosL":ParsedTweet['positive'].length,
      "Neg" : ParsedTweet['negative'], //Array di parole identificate come negative
      "NegL":ParsedTweet['negative'].length
    });
  }
  catch (e){
    //In caso di errori (es. tweet non significativi contenenti solo un tag), inserisco i dati a mano
    //Inserimento di sicurezza dato che per ora l'unico errore è stata la lingua non identificata (Legge di Murphy)
    tweet_eval.eval.push({
      "Score": 0,
      "TotL": 0,
      "Pos": 0,
      "PosL":0,
      "Neg" : 0,
      "NegL":0
    });
    ignored = "Yes";
  }
  //console.log("Ignored: " + ignored);
  return(tweet_eval);
}

//Trova i tweet contententi la stringa data
app.get('/recents/:word', async(req, res) => {
  let tweet= '';
  //Numero dei risultati che si vogliono ottenere (predisposizione per passaggio con parametro)
  let results = 50;

  let query = req.params.word;

  //Se cerco un hashtag o uno user i relativi simboli devono essere codificati
  if (query[0] == '~'){ //~ perchè è così che arrivano le richieste dato che # è un carattere vietato
    query = '#' + req.params.word.substring(1);
  }

  if (query[0] == '@'){
    query = '@'+req.params.word.substring(1);
  }

  //Se true la sentiment analysis è richiesta
  let toSentiment = req.query.sentiment;
  try{
    //Trovo i tweets
   tweet = await client.v2.search(query, {'max_results':results, 'expansions':['geo.place_id', 'author_id']});
  }
  catch(error){
    res.status(404).json(error);
  }

  //Tweet da analizzare
  let toAnalyze = tweet._realData.data;
  //Numero di risultati
  let resnum = toAnalyze.length;
  //Variabili inizializzate (motivi di scope)
  let sentiment = null;
  let geo = null;
  let tweets = {'info': []};
  let totscore = null;
  let totwords=0;
  let totpos=0;
  let totneg=0;

  if (toAnalyze != null){
    for(let singletweet of toAnalyze){
      //geo torna null perchè non mantenga il valore
      geo = null;
      try{
        //Se il tweet è geolocalizzato
        if (singletweet['geo'] != null){
          //Ottengo le informazioni riguardanti il posto
          geo = await getGeo(singletweet['geo']['place_id']);
        }

        if (toSentiment == "true"){
          //Eseguo la sentiment analysis
          sentiment = await sentiment_analyze(singletweet['text']);
          totscore += parseFloat(sentiment.eval[0].Score);
          totwords+= parseFloat(sentiment.eval[0].TotL);
          totpos+= parseFloat(sentiment.eval[0].PosL);
          totneg+= parseFloat(sentiment.eval[0].NegL);
        }
        tweets.info.push({
          "Author":"placeholder" /*await getauthor(singletweet['author_id'])*/,
          "Text": singletweet['text'],
          "Lang":langdetect.detectOne(singletweet['text']),
          "geo":geo,
          "sentiment": sentiment
        })
      }
      catch (e){
        //In caso di errori (es. lingua sconosciuta) diminuisco il numero di risultati
        resnum--;
        console.log("ERROR: " + e);
      }
    }
  }
  else{
    res.status(404).json("No tweets found")
  }

  //Se dovevo fare sentiment analysis calcolo la media degli score, altrimenti metto null (null/int = 0)
  totscore = totscore/results;
  if (toSentiment != "true"){
    totscore = null;
    totwords=null;
    totpos=null;
    totneg=null;
  }
  //Creo e restituisco la risposta
  let counters = {"avg": totscore, "Tot_words":totwords, "Tot_pos":totpos, "Tot_neg":totneg}
  let data = tweets.info;
  let ans = {'Tot_tweets': resnum, 'analysis_data':counters, data};
  res.status(200).json(ans);
});



const port = process.env.PORT || 8000
app.listen(port, () => console.log(`Listening on port ${port}...`));
