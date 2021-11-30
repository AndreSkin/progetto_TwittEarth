const external = require('./server.js');
const supertest = request = require('supertest')
const numberOfTweets = 12; //between 10 and 100

describe("Testing GETs", () => {
    describe("with given default hashtag", () => {
      beforeAll(async () => {
        return testHashtags = await request(external.httpServer).get('/recents/' + '~' + 'testingtweetuniboswe2122');//.send({}), formattedText = JSON.parse(testHashtags.text);
      })
      test("Status code is 200", () => {
        expect(testHashtags.statusCode).toBe(200);
      });
    })
    describe("with given default text", () => {
      beforeAll(async() => {
        return testText = await request(external.httpServer).get('/recents/Testing tweet UniboSwe 21%2F22 #testingtweetuniboswe2122');//, formattedtext = JSON.parse(testText.text)
      })
      test("Status code is 200", () => {
          expect(testText.statusCode).toBe(200);
      })
    })
    describe("with given default Username", () => {
      beforeAll(async() => {
        return testUsername = await request(external.httpServer).get('/users/Team10Test2122');//, formattedtext = JSON.parse(testText.text)
      })
      test("Status code is 200", () => {
          expect(testUsername.statusCode).toBe(200);
      })
    })
});

describe("Testing other functions", () =>{
    describe("Testing sentiment analysis", () => {
      beforeAll(async() => {
        return positiveSentiment = await request(external.httpServer).get('/recents/good?sentiment=true&numtweets=10'), formattedPositiveSentiment = JSON.parse(positiveSentiment.text), negativeSentiment = await request(external.httpServer).get('/recents/bad?sentiment=true&numtweets=10'), formattedNegativeSentiment = JSON.parse(negativeSentiment.text);
      })
      test("Status code is 200 for given positive word", () => {
          console.log(positiveSentiment);
          expect(positiveSentiment.statusCode).toBe(200);
      })
      test("Status code is 200 for given negative word", () => {
          expect(negativeSentiment.statusCode).toBe(200);
      })
      test("There is at least one positive word \"good\"", () => {
          console.log(positiveSentiment);
          console.log(formattedPositiveSentiment.data[0].sentiment.eval[0].PosL);
          expect(formattedPositiveSentiment.data[0].sentiment.eval[0].PosL).toBeGreaterThanOrEqual(1);
      })
      test("There is at least one negative word \"bad\"", () => {
          console.log(formattedNegativeSentiment.data[0].sentiment.eval[0].NegL)
          expect(formattedNegativeSentiment.data[0].sentiment.eval[0].NegL).toBeGreaterThanOrEqual(1);
      })
    })
    describe("Testing number of tweets", () => {
      beforeAll(async() => {
        return numberTest = await request(external.httpServer).get('/recents/nasa?numtweets=' + numberOfTweets), formattedNumberTest = JSON.parse(numberTest.text)
      })
      test("There are exactly "+numberOfTweets+" tweets", () => {
        console.log(numberTest);
        expect(formattedNumberTest.Tot_tweets).toBe(numberOfTweets);
      })
    })


})
