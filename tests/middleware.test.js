import request from 'supertest';
import Express from "express";
import ApiRouters from "../routes/apiRoutes.js";
import authentication from "../middleware/authentication.js";
import dotenv from 'dotenv'

dotenv.config();

const app = Express();
app.use(Express.json());

app.use("/api", ApiRouters);

describe('GET /errors', () => {
    it('should return 401 if not authenticated with a valid API key', (done) => {

        app.use((req, res, next) => {
            // Setting an invalid API key
            req.headers.authorization = 'invalid_api_key';
            authentication(req, res, next);
        });

        request(app)
          .get('/api/errors')
          .expect(401)
          .end((err, res) => {
            if (err) return done(err);
            done();
          });
      });

      it('should return 200 and continue if authenticated with a valid API key', (done) => {

        request(app)
        .get('/api/errors')
        .set('Authorization', process.env.SECRET_API_KEY)
        .expect(200)
        .end(done);
      });
})