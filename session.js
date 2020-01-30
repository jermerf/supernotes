const cookieSignature = require('cookie-signature');
const cookie = require('cookie');
const session = require('express-session');
const FileStore = require('session-file-store')(session);

function guid() {
  function s4() {return Math.floor((1 + Math.random()) * 0x100000000).toString(32).substring(1);}
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}


var sessionOptions = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  store: new FileStore({
    path: "/app-sessions"
  }),
  cookie: {
    domain: "supernotes.duckdns.org",
    secure: true,
    maxAge: 1000*60*60*2 //Session cookie lasts 2 hours
  },
}



module.exports = function(app){
  app.use(session(sessionOptions));
}
