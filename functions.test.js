const external = require('./server.js');
const supertest = request = require('supertest')

describe("Testing GETs", () => {
    describe("with given default hashtag", () => {
      beforeAll(async () => {
        return testHashtags = await request(external.httpServer).get('/recents/' + '~' + 'testingtweetuniboswe2122').send({}), formattedText = JSON.parse(testHashtags.text);
      })
      test("Status code is 200", () => {
        expect(testHashtags.statusCode).toEqual(200);
      });
      test("Author's ID is 1448303401138262022", () => {
        expect(formattedText.data[1].Author).toMatch("1448303401138262022");
      });
      test("Tweet's text is \"Testing tweet UniboSwe 21/22 #testingtweetuniboswe2122\"", () => {
        expect(formattedText.data[1].Text).toMatch("Testing tweet UniboSwe 21/22 #testingtweetuniboswe2122");
      });
      test("There should be 2 tweets with this hashtag", () => {
        expect(formattedText.Tot_tweets).toEqual(2);
      })
    });
    describe("with given default text", () => {
      beforeAll(async() => {
        return testText = await request(external.httpServer).get('/recents/Testing tweet UniboSwe 21%2F22 #testingtweetuniboswe2122');//, formattedtext = JSON.parse(testText.text)
      })
      test("Status code is 200", () => {
          console.log(testText)
          expect(testText.statusCode).toEqual(200);
      })
    })
});
