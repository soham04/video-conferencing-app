require('dotenv').config();
import express from 'express';
import { createServer } from 'http';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import cookieSession from 'cookie-session';
import { initializeSocketServer } from './utils/socket';
import passport from './utils/passport';

const app = express();
const server = createServer(app);

initializeSocketServer(server);

app.set('view engine', 'ejs');
app.use(
  cookieSession({
    maxAge: 24 * 60 * 60 * 1000, // in milliseconds value = 1 day
    keys: ['cokiekey'],
  })
);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('./public'));
app.use(passport.initialize());
app.use(passport.session());
app.use(require('./routes/routes.js').default);
 
async function main() {
  try {
    await mongoose.connect(process.env.MONGO_DB_LINK || '', {
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

main().catch((err) => console.error(err));

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Express server listening on port ${port} | GOTO http://localhost:${port}/`);
});
