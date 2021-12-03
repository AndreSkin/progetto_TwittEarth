const result=require('dotenv').config({path: `${__dirname}/.env`})
const express = require('express');
const app = express();
const cors = require('cors');
const Twit = require('twit');
const { TwitterApi, ETwitterStreamEvent, TweetStream, ETwitterApiError } = require('twitter-api-v2');
var sentiment = require('multilang-sentiment');
var langdetect = require('langdetect');

let httpServer = require("http").createServer(app);

const path = require('path');
const Server = require("socket.io");
const io = require("socket.io") (httpServer, {cors:{origin:"*"}})

var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport('smtps://' + process.env.MAIL + ':' + process.env.MAIL_PSW + '@smtp.gmail.com');

async function sendmail()
{
  var mailOptions = {
      from: '"prova_team_10 👥" <team10igsw2021@gmail.com>', // sender address
      to: 'team10igsw2021@gmail.com', // list of receivers
      subject: 'Hello ✔', // Subject line
      text: 'Hello world 🐴', // plaintext body
      html: '<b>Hello world 🐴</b>' // html body
  };

  transporter.sendMail(mailOptions, function(error, info){
    if(error){
        return console.log("ERROR IN MAIL", error);
    }
    console.log('Message sent: ' + info.response);
});
}

//sendmail();

const b_token= process.env.BEARER_TOKEN;

app.use('/', express.static(__dirname + '/'));
app.use(cors());

var T = new Twit({
  consumer_key: process.env.CONSUMER_KEY,
  consumer_secret: process.env.CONSUMER_SECRET,
  access_token: process.env.ACCESS_TOKEN,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET,
})


//Istanzio client per twitter API
const twitterClient = new TwitterApi(b_token);
const client = twitterClient.readOnly;

app.use(express.json());

/*API*/

//API v2 che dato uno username restituisce la timeline dei suoi Tweets
async function embedTweet(id){
  const tweet = await client.v1.oembedTweet(id);
  return tweet.html;
}

app.get('/users/:name', async(req, res) => {
  let userID= '';
  //Dato un nome trovo l'ID
  try{
   userID = await client.v2.userByUsername(req.params.name);
  }
  catch(error){
    console.log("ERROR IN USER BY USERNAME: ", error);
  }
  //Numero dei risultati che si vogliono ottenere (predisposizione per passaggio con parametro)
  let results = req.query.numtweets == undefined? 25:req.query.numtweets;
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
    //let tweetHtml = await embedTweet(singletweet.id);
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
        "geo": geo,
        "id": singletweet.id
        //"html": tweetHtml
      })
    }
    catch (e){
      console.log("ERROR IN TIMELINE: ", e );
    }
  }
  res.status(200).json(timeline);
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
  for (let coord of coordinates){
    sumX += coord[0];
    sumY += coord[1];
  }
  let mediaX = sumX / coordinates.length;
  let mediaY = sumY / coordinates.length;

  return [mediaX ,mediaY];
}

/*Tweet vicini a coordinata*/
app.get('/geo/:place', (req, res) => {
  try{
    let coord = req.params.place.split("x");
    let radius = req.query.radius == undefined? ',10mi': ',' + req.query.radius + 'mi' ;
    let georeq = coord[0] + ',' + coord[1] + radius;



    T.get('search/tweets', {q: 'since:2020-01-01', geocode: georeq, count: 30, result_type: 'recent'}, async (err2, data2) =>{
      for (let data of data2['statuses']){
        if (data['place'] == null){
          data['geo'] = {'coord_center' : []};
          data['geo']['coord_center'][1] = parseFloat(coord[0]) + Math.random() * (0.005);
          data['geo']['coord_center'][0] = parseFloat(coord[1]) +  Math.random() * (0.005);
        }
        else{
          let my_coord = find_medium(data['place']['bounding_box']['coordinates'][0]);
          data['geo'] = {'coord_center' : []};
          data['geo']['coord_center'][1] = my_coord[1] + Math.random() * (0.005);
          data['geo']['coord_center'][0] = my_coord[0] + Math.random() * (0.005);
        }
        data['Author'] = data['id'];
        data['Text'] = data['text'];
      }
      data2['tweets'] = data2['statuses'];
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
    console.log("ERROR IN GET AUTHOR", error);
  }
  return author.data.username;
}

//Dato un place id restituisce nome e coordinate corrispondenti
async function getGeo(place_id){
  let place= '';
  try{
    place = await client.v1.geoPlace(place_id);
  }
  catch(error){
    console.log("ERROR IN GET GEO",error);
  }

  return {'Name': place.full_name, 'coord_center': place.contained_within[0].centroid};
}

//Funzione di sentiment analysis
async function sentiment_analyze(toAnalyze){
  let tweet_eval = {'eval': []};
  try{
    //Rimuovo '@' e '#' perchè impediscono una corretta indivduazione della lingua
    const regExHash = new RegExp('#', "g");
    const regExTag = new RegExp('@', "g");
    let notag = toAnalyze.replace(regExHash,'');
    let replaced = notag.replace(regExTag,'');

    //Riconosco la lingua in cui è scritto il tweet (se non riconosciuta ritorna null e ignora il tweet)
    var lang = langdetect.detectOne(replaced);
    let ParsedTweet = await sentiment(replaced, lang);

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
  }
  return(tweet_eval);
}

//Trova i tweet contententi la stringa data
app.get('/recents/:word', async(req, res) => {
  let tweet= '';
  //Numero dei risultati che si vogliono ottenere (predisposizione per passaggio con parametro)
  let results = req.query.numtweets == undefined? 25:req.query.numtweets;
  let query = req.params.word;
  let notcontain = req.query.notcontain == undefined ? []:req.query.notcontain.split(",");
  let hasmedia = req.query.hasmedia == undefined ? 'false':req.query.hasmedia;
  let isverified = req.query.verified == undefined ? 'false':req.query.verified;

  //Se cerco un hashtag o uno user i relativi simboli devono essere codificati
  if (query[0] == '~'){ //~ perchè è così che arrivano le richieste dato che # è un carattere vietato
    query = '#' + req.params.word.substring(1);
  }
  else if (query[0] == '@'){
    query = '@'+req.params.word.substring(1);
  }

  if (notcontain[0]!= '') {
    for (onenot of notcontain)
      query=query + " -" + onenot;
  }


  if(hasmedia!='false')
    query=query + " -has:media -has:links"

  if(isverified!='false')
    query=query + " is:verified"

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
  if(toAnalyze != undefined){
    //Numero di risultati
    let resnum = toAnalyze.length;
    //Variabili inizializzate (motivi di scope)
    let sentiment_result = null;
    let geo = null;
    let tweets = {'info': []};
    let totscore = null;
    let totwords=0;
    let totpos=0;
    let totneg=0;

    if (toAnalyze != null){
      for(let singletweet of toAnalyze){
        //let tweetHtml = await embedTweet(singletweet.id);
        //geo torna null perchè non mantenga il valore
        geo = null;
        try{
          //Se il tweet è geolocalizzato
          if (singletweet['geo'] != null){
          //Ottengo le informazioni riguardanti il posto
          geo = await getGeo(singletweet['geo']['place_id']);
          }

          if (toSentiment == "true"){
            //Eseguo la sentimenttaiga
            sentiment_result = await sentiment_analyze(singletweet['text']);
            totscore += parseFloat(sentiment_result.eval[0].Score);
            totwords+= parseFloat(sentiment_result.eval[0].TotL);
            totpos+= parseFloat(sentiment_result.eval[0].PosL);
            totneg+= parseFloat(sentiment_result.eval[0].NegL);
          }
          tweets.info.push({
            "Author":singletweet['author_id'],
            "Text": singletweet['text'],
            "Lang":langdetect.detectOne(singletweet['text']),
            "geo":geo,
            "sentiment": sentiment_result,
            "id": singletweet.id
          })
        }
        catch (e){
          //In caso di errori (es. lingua sconosciuta) diminuisco il numero di risultati
          resnum--;
          console.log("ERROR IN RECENTS: ", e);
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
  }
  else{
    res.status(404).json("Not Found");
  }
});


async function delete_rules()
{
  let rules='';
  let idArray=[];
  try
  {
    rules = await client.v2.streamRules();
    //console.log("OLD RULES: ", rules);

    for(let rule of rules.data)
    {
      idArray.push(rule.id);
    }

    await client.v2.updateStreamRules({
      delete: {
        ids: idArray
      }
    });

    /*
    rules = await client.v2.streamRules();
    console.log("RULES AFTER DELETE ", rules.data)
    */
  }
  catch (e)
  {
    console.log("ERROR IN DELETE RULE: ", e);
  }
}


app.get('/stream/tweets', async (req, res) => {
  let stream = '';
  try
  {
    await delete_rules();
    /*const addedRules =*/
     await client.v2.updateStreamRules({
      add: [
    { value: 'SOSigsw10', tag: 'SOS' },
    { value: 'abcd', tag: 'ab' },
    { value: 'efg', tag: 'ef' },
    { value: 'hijk', tag: 'hi' },
    { value: 'lmno', tag: 'kl' },
    { value: 'pqrs', tag: 'op' }
    ],
  });


    /*
    console.log("ADDED RULES: ", addedRules);
    let rules = await client.v2.streamRules();
    console.log("NEW RULES: ", rules)
    */

    stream = await client.v2.searchStream({'expansions':['geo.place_id', 'author_id']});

    // Awaits for a tweet
    stream.on(
      // Emitted when Node.js {response} emits a 'error' event (contains its payload).
      ETwitterStreamEvent.ConnectionError,
      err => console.log('Connection error!', err),
    );

    stream.on(
      // Emitted when Node.js {response} is closed by remote or using .close().
      ETwitterStreamEvent.ConnectionClosed,
      () => console.log('Connection has been closed.'),
    );

    stream.on(
      // Emitted when a Twitter sent a signal to maintain connection active
      ETwitterStreamEvent.DataKeepAlive,
      () => console.log('Twitter has a keep-alive packet.'),
    );
    var emergencytweets=[];
    stream.on(
      // Emitted when a Twitter payload (a tweet or not, given the endpoint).
      ETwitterStreamEvent.Data,
      async eventData => {
        await io.emit('tweet', eventData);
        if (eventData.data.geo.place_id != undefined)
        {
            let location = await getGeo(eventData.data.geo.place_id);
            if (eventData.data.text.includes("SOSigsw10"))
            {
              sendmail();
            }
            else {
              emergencytweets.push(location);
              console.log("ET: ", emergencytweets)
              if (emergencytweets.length == 5)
              {
                let removed = false;
                console.log("Removed 1: " , removed);
                for (var i = 0; i < emergencytweets.length; i++)
                {
                  if (await Math.abs(emergencytweets[0].coord_center[0] - emergencytweets[i].coord_center[0] > 1) ||
                      (await Math.abs(emergencytweets[0].coord_center[1] - emergencytweets[i].coord_center[1] > 1)))
                  {
                    removed=true;
                    console.log("Removed 2: " , removed);
                    await delete emergencytweets[i]
                  }
                }
                if (removed==false)
                {
                  sendmail();
                }
              }
            }
        }
      }
    );

    // Enable reconnect feature
      stream.autoReconnect = true;
  }
  catch(e)
  {
    console.log("ERROR IN STREAM: " , e);
    res.status(404).json(e);
  }

  let percorso = path.resolve(__dirname, 'stream.html')
  res.sendFile(percorso);

  io.on("connection", (socket) => {
    console.log('IO connected...')
  });

  //setTimeout(function(stream){stream.close()}, 10000, stream);
});


app.get('/poll/:pollTag', async (req, res) => {
  var PollTweets='';
  try{
    PollTweets = await client.v2.search('#' + req.params.pollTag, {'expansions':['attachments.poll_ids', 'author_id'], 'poll.fields':'duration_minutes,end_datetime,id,options,voting_status'});
    var polls=[];
    var singlepoll='';
    for(poll of PollTweets._realData.data){
      try{
        if (poll.attachments.poll_ids != undefined){
          for(included of PollTweets._realData.includes.polls){
            if (included.id == poll.attachments.poll_ids){
              singlepoll = included;
              polls.push({
                "Text": poll.text,
                "Poll": singlepoll,
                "Correct":null
              });
            }
          }
        }
      }
      catch (error){
        //console.log("ERROR IN FINDING POLLS: ", error)
      }
    }
  }
  catch (e){
    console.log("ERROR IN POLL: ", e)
  }


  var answ='';
  try{

    let query = '#risposta' + req.params.pollTag
    answ = await client.v2.search(query, {'expansions':'author_id'});

    if (answ._realData.data[0] != undefined){
      //Elimino # risposta + ottengo singole risposte + le metto nell'ordine giusto
      let risposte = answ._realData.data[0].text.substring(query.length).split(",").reverse();

      for (var i = 0; i < polls.length; i++){
        polls[i].Correct = parseInt(risposte[i]);
      }
    }
  }
  catch (e)
  {
    //console.log("ERROR IN FINDING ANSWERS: ", e)
  }

res.status(200).json(polls);
})






module.exports.httpServer = httpServer;
