import request from 'supertest';
import Express from "express";
import ApiRouters from "../routes/apiRoutes.js";
import authentication from "../middleware/authentication.js";
import sinon from "sinon";
import dotenv from 'dotenv'
import errorData from "../model/MongoData.js";
import { expect } from 'chai'; 

dotenv.config();

const app = Express();
app.use(Express.json());

// Mock the authentication middleware for testing
app.use((req, res, next) => {
    req.headers.authorization = process.env.SECRET_API_KEY;
    authentication(req, res, next);
});

app.use("/api", ApiRouters);

describe('GET /', ()=> {
    it('should return the init message', (done) => {
        request(app)
        .get('/api')
        .expect(200)
        .end((err, res) => {
            if (err) return done(err);
            expect(res.text).to.equal('Welcome to megapack test API');
            done();
        })
    })
})

describe('GET /errors', () => {
    it('should return a list of errors if authenticated', (done) => {
        
        sinon.stub(errorData, 'find').resolves([ { data: "365951380:1640995229697:'Temperature':100" } ]);

        request(app)
        .get('/api/errors')
        .expect(200)
        .end((err, res) => {
            if (err) return done(err);
            console.log(res.body)
            expect(res.body).to.deep.equal({"errors": ["365951380:1640995229697:'Temperature':100"]});
            done();
        })
    })
})

describe('DELETE /errors', () => {
    it('should return a delete message if authenticated and successful deletion', (done) => {

        sinon.stub(errorData, 'deleteMany').resolves({ acknowledged: true, deletedCount: 1 });

        request(app)
        .delete('/api/errors')
        .expect(200)
        .end((err, res) => {
            if (err) return done(err);
            console.log(res.body);
            expect(res.body).to.deep.equal({"message": "Error buffer cleared successfully"});
            done();
        })
    })
})

describe('POST /temp', () => {
    it('should not support request if Content-Type is not set to json if authenticated', (done) => {

        request(app)
        .post('/api/temp')
        .expect(415)
        .end((err, res) => {
            if (err) return done(err);
            console.log(res.body);
            expect(res.body).to.deep.equal({ "error": 'Unsupported Request Type' });
            done();
        })
    })

    it('should return a bad request message', (done) => {
        // Mock database action for testing
        const errorDataJson = { data: "365951380:1640995229697:'Temperature':100" };
        const newdata = new errorData(errorDataJson);
        sinon.stub(newdata, 'save').resolves({ data: "365951380:1640995229697:'Temperature':100" });

        request(app)
        .post('/api/temp')
        .set('Content-Type', 'application/json')
        .send({ data: "365951380:1640995229697:'Temperature':100" })
        .expect(400)
        .end((err, res) => {
            if (err) return done(err);
            console.log(res.body);
            expect(res.body).to.deep.equal({ "error": "bad request" });
            done();
        })
    })

    it('should return overtemperature false message', (done) => {

        request(app)
        .post('/api/temp')
        .set('Content-Type', 'application/json')
        .send({ "data": "365951380:1640995229697:'Temperature':40.0" })
        .expect(200)
        .end((err, res) => {
            if (err) return done(err);
            console.log(res.body);
            expect(res.body).to.deep.equal({
                "overtemp": false
            });
            done();
        })
    })

    it('should return overtemperature message', (done) => {

        request(app)
        .post('/api/temp')
        .set('Content-Type', 'application/json')
        .send({ "data": "365951380:1640995229697:'Temperature':400.0" })
        .expect(200)
        .end((err, res) => {
            if (err) return done(err);
            console.log(res.body);
            expect(res.body).to.deep.equal({
                "overtemp": true,
                "device_id": "365951380",
                "formatted_time": res.body["formatted_time"]
            });
            done();
        })
    })
})
