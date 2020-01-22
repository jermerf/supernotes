const cookieSignature = require('cookie-signature');
const cookie = require('cookie');
const session = require('express-session');
const FileStore = require('session-file-store')(session);

function guid() {
  function s4() {return Math.floor((1 + Math.random()) * 0x100000000).toString(32).substring(1);}
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}


var sessionOptions = {
  secret: 'EpEVkRKV2NsWllhRlZXVlRCM1ZHeF',
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
  // genid: function(req, res, next){
  //   var sessionId = req.body.sessionid;
  //   if (sessionId) {
  //     return req.body.sessionid;
  //   }else{
  //     return guid();
  //   }
  // }
}



module.exports = function(app){
  // app.use(function(req, res, next) {
    // var sessionId = req.body.sessionId;
 
    // if (sessionId) {
    //   var signedCookie = 's:' + cookieSignature.sign(sessionId, sessionOptions.secret);
    //   req.headers.cookie = cookie.serialize('connect.sid', signedCookie);
    // }
    // next();
  // });
  app.use(session(sessionOptions));
}