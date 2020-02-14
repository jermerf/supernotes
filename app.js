require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const https = require('https')
const fs = require('fs')
const cors = require("cors")
const session = require("./session.js")
const Notes = require("./Notes.js")

const SSL_CERT_PATH = '/etc/letsencrypt/live/supernotes.duckdns.org/cert.pem'
const SSL_KEY_PATH = '/etc/letsencrypt/live/supernotes.duckdns.org/privkey.pem'
const SSL_CHAIN_PATH = '/etc/letsencrypt/live/supernotes.duckdns.org/fullchain.pem'

const HTTPS_PORT = 443
// const HTTP_PORT = 80

const app = express()
const IGNORE_CORS_WHITELIST = true
const CORS_WHITELIST = ["https://supernotes.duckdns.org", "http://localhost:8080", "http://localhost:8081"]

app.use(cors({
  origin: function (origin, callback) {
    if (IGNORE_CORS_WHITELIST) {
      callback(null, true)
    } else if (CORS_WHITELIST.indexOf(origin) !== -1 || !origin) {
      callback(null, true)
    } else {
      console.log("CORS-Failed", { origin })
      callback(new Error('Not allowed by CORS'))
    }
  },
  preflightContinue: true,
  credentials: true
}))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(function (req, res, next) {
  //TODO Log all requests
  next()
})
session(app)
Notes(app)
app.use(express.static('/app/public'))

// app.listen(HTTP_PORT, ()=>{
//   console.log("[LISTENING] Unsecure on port ", HTTP_PORT)
// })


https
  .createServer({
    cert: fs.readFileSync(SSL_CERT_PATH).toString(),
    key: fs.readFileSync(SSL_KEY_PATH).toString(),
    ca: [fs.readFileSync(SSL_CHAIN_PATH).toString()]
  }, app)
  .listen(HTTPS_PORT, function (err) {
    if (err) {
      console.log("*** HTTPS ERROR ***", err)
    } else {
      console.log("[LISTENING] Secure on port ", HTTPS_PORT);
    }
  });