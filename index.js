const external = require('./server.js');

//const b_token= "AAAAAAAAAAAAAAAAAAAAAMEAUwEAAAAA1xY%2F32bSU4v5kwxoncHszvMJHx4%3D8gqEEFr90qe45rDMfubNdiMWfZwkkECKAK9SVgs5e6NdQOouCN";
// //Istanzio client per twitter API
//const twitterClient = new TwitterApi(b_token);
//const client2 = twitterClient.readOnly;
//



const port = process.env.PORT || 8000
external.httpServer.listen(port, () => console.log(`Listening on port ${port}`));
