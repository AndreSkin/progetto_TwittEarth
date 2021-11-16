const app = require('./server.js');
const supertest = request = require('supertest')

//const serverUrl = "https://localhost:8000/";
const serverUrl = "https://site202136.tw.cs.unibo.it/";


describe("Testing GETs", () => {
    describe("with given hashtag", () => {
      beforeAll(async () => {
        return testHashtags = await request(app).get('/tags/testingtweetuniboswe2122').send({});
      })
      test("Status code is 200", () => {
        expect(testHashtags.statusCode).toEqual(200);
      });
    });
});
