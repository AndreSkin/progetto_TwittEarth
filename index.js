const express = require('express');
const app = express();
const cors = require('cors');
const Twit = require('twit');

const b_token= "AAAAAAAAAAAAAAAAAAAAAMEAUwEAAAAA1xY%2F32bSU4v5kwxoncHszvMJHx4%3D8gqEEFr90qe45rDMfubNdiMWfZwkkECKAK9SVgs5e6NdQOouCN";

app.use(cors());

var T = new Twit({
  consumer_key: "C1To9MvaerpcTFE6s3dXjHFXd",
  consumer_secret: "IH8ec7CnV2VSpgdqsh5IQTysgZMzHafjx8DP3QOqjVrFiBDZQj",
  access_token: "1447914708598722561-FbmOcEaDCAEnDNsojC54vqROseWSzL",
  access_token_secret: "BbnkHQZYa6N7Wqyh2KdGIfZO2ZQLGOzWUdWSmrNKPN93N",
})

/*const http = require('https');
const options = { //Opzioni della richiesta HTTP
  hostname: 'api.twitter.com',
  path: '/1.1/statuses/user_timeline.json?user_id=1341037783155171328',
  method: 'GET',
  Authorization: 'Bearer: AAAAAAAAAAAAAAAAAAAAAMEAUwEAAAAA1xY%2F32bSU4v5kwxoncHszvMJHx4%3D8gqEEFr90qe45rDMfubNdiMWfZwkkECKAK9SVgs5e6NdQOouCN'
}*/

/*const req = http.request(options, res => {//prova test richiesta
  console.log(`statusCode: ${res.statusCode}`);
  res.on('data', d => {
    console.log(JSON.d);
  })
})

req.on('error', error => {
  console.error(error);
})
req.end();*/

app.use(express.json());

/*API*/
app.get('/user/:id', (req, res) => {
  T.get('statuses/user_timeline', {screen_name: req.params.id},(err, data, new_res) => {
    //console.log(data[0].created_at);
    res.status(200).json(data);
  })
});

app.get('/ciao/:nome', (req, res) => {
    res.send("Ciao", req.params.nome);
});
/*const corsi =
    [
        { id: 1, name: "igsw" },
        {id: 2, name: "so"},
        {id: 3, name: "mariolone bubbarello"}
    ];

app.get('/api/courses', (req, res) => {
    res.send(corsi);
});

app.get('/api/courses/:year/:month', (req, res) => {
    res.send(req.params);
    //res.send(req.query); //per trovare le query dopo il ?
   console.log("ciaone galattico!")});



app.get('/api/courses/:id', (req, res) => {
    const cor = corsi.find(c => c.id === parseInt(req.params.id))
    if (!cor) { res.status(404).send("Stintipacchio catch phrase") }
    else res.send(cor);
});

app.post('/api/courses', (req, res) => {
    if(!req.body.name || req.body.name.length < 3) {
        //400 Bad Request
        res.status(400).send("input sbagliato")
        return;
    }

    const course = {
        id: corsi.length + 1,
        name: req.body.name
    };
    corsi.push(course);
    res.send(course); //convenzione ritornare l'oggetto dopo post
});
*/

const port = process.env.PORT || 8000
app.listen(port, () => console.log(`Listening on port ${port}...`));
