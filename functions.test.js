const external = require('./server.js');
const supertest = request = require('supertest')
const numberOfTweets = 12; //between 10 and 100
const location = "Bologna";
describe("Testing GETs", () => {
    describe("with given default hashtag", () => {
      beforeAll(async () => {
        return testHashtags = await request(external.httpServer).get('/recents/' + '~' + 'testinggeolocatedtweetuniboswe2122'), formattedTestHashtags = JSON.parse(testHashtags.text);
      })
      test("Status code is 200", () => {
        console.log(formattedTestHashtags.Tot_tweets);
        expect(testHashtags.statusCode).toBe(200);
      });
    })
    describe("with given default text", () => {
      beforeAll(async() => {
        return testText = await request(external.httpServer).get('/recents/Testing tweet UniboSwe 21%2F22 #testingtweetuniboswe2122');
      })
      test("Status code is 200", () => {
          expect(testText.statusCode).toBe(200);
      })
    })
    describe("with given default Username", () => {
      beforeAll(async() => {
        return testUsername = await request(external.httpServer).get('/users/Team10Test2122');
      })
      test("Status code is 200", () => {
          expect(testUsername.statusCode).toBe(200);
      })
    })
    describe("with given default location", () => {
      beforeAll(async() => {
        return testLocation = await request(external.httpServer).get('/recents/' + '~' + 'testinggeolocatedtweetuniboswe2122?geo='+location);
      })
      test("Status code is 200", () => {
        console.log(testLocation);
        expect(testLocation.statusCode).toBe(200);
      })
    })
});

describe("Testing other functions", () =>{
    // describe("Testing sentiment analysis", () => {
    //   beforeAll(async() => {
    //     return positiveSentiment = await request(external.httpServer).get('/recents/good?sentiment=true&numtweets=10'),
    //     formattedPositiveSentiment = JSON.parse(positiveSentiment.text),
    //     negativeSentiment = await request(external.httpServer).get('/recents/bad?sentiment=true&numtweets=10'),
    //     formattedNegativeSentiment = JSON.parse(negativeSentiment.text);
    //   })
    //   test("Status code is 200 for given positive word", () => {
    //       expect(positiveSentiment.statusCode).toBe(200);
    //   })
    //   test("Status code is 200 for given negative word", () => {
    //       expect(negativeSentiment.statusCode).toBe(200);
    //   })
    //   test("There is at least one positive word \"good\"", () => {
    //       expect(formattedPositiveSentiment.data[0].sentiment.eval[0].PosL).toBeGreaterThanOrEqual(1);
    //   })
    //   test("There is at least one negative word \"bad\"", () => {
    //       expect(formattedNegativeSentiment.data[0].sentiment.eval[0].NegL).toBeGreaterThanOrEqual(1);
    //   })
    // })
    describe("Testing number of tweets", () => {
      beforeAll(async() => {
        return numberTest = await request(external.httpServer).get('/recents/nasa?numtweets=' + numberOfTweets), formattedNumberTest = JSON.parse(numberTest.text)
      })
      test("Number of returned tweets is equal to number of requested tweets", () => {
        expect(formattedNumberTest.Tot_tweets).toBe(numberOfTweets);
      })
    })
});
