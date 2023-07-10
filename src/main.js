import dotenv from 'dotenv';
dotenv.config();
import Koa from 'koa';
import Router from'koa-router';
import bodyParser from'koa-bodyparser';
import mongoose from'mongoose';

const { PORT, MONGO_URI } = process.env;
import api from './api/index.js';
import createFakeData from './createFakeData.js';
import jwtMiddleware from './lib/jwtMiddleware.js';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('connected to mongoDB');
    // createFakeData();
  })
  .catch(e => {
    console.error(e);
  });

const app = new Koa();
const router = new Router();

router.use('/api', api.routes());

app.use(bodyParser())
app.use(jwtMiddleware);

app.use(router.routes()).use(router.allowedMethods());

const port = PORT || 4000;
app.listen(port, () => {
  console.log('listening to port 4000');
});