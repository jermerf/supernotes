const MongoClient = require('mongodb').MongoClient
const ObjectID = require('mongodb').ObjectID
const passwordHash = require('password-hash');

const url = "mongodb://localhost:27017"

var db

/* Schema
All documents have an _id field

users 
- username
- password
- lastLogin (Date)
notes
- owner (User id)
- text
- createdOn
groups/$uid/[groups]

*/

MongoClient.connect(url)
  .then(client => {
    db = client.db('supernotes');
    return Promise.all([
      db.createCollection('users'),
      db.createCollection('notes'),
      db.createCollection('groups')
    ])
  }).then(() => {
    console.log("Database setup successful")
  })
  .catch(err => console.log('Something went wrong!', err))

function hashit(password) {
  return passwordHash.generate(password, { algorithm: "sha512" })
}

function notLoggedIn(res) {
  res.send({
    success: false,
    error: "Not logged in"
  })
}
function byId(id) {
  return { _id: { $eq: new ObjectID(id) } }
}

function ownerQuery(req) {
  return { owner: { $eq: new ObjectID(req.session.uid) } }
}

const GET_HANDLERS = {
  "/db": (req, res) => {
    var mongo = {}
    Promise.all([
      db.collection('users').find().toArray()
        .then(users => { mongo.users = users }),
      db.collection('groups').find().toArray()
        .then(groups => { mongo.groups = groups }),
      db.collection('notes').find().toArray()
        .then(notes => { mongo.notes = notes }),
    ])
      .then(() => {
        res.send({ success: true, mongo })
      })
  },
  "/notes": (req, res) => {
    if (!req.session.uid) {
      notLoggedIn(res)
    } else {
      let groupId = req.query.groupId || false
      Promise.resolve()
        .then(() => {
          if (groupId) {
            return db.collection('groups').findOne(byId(groupId))
              .then(group => {
                return {
                  $and: [
                    ownerQuery(req),
                    { _id: { $in: group.notes } }
                  ]
                }
              })
          } else {
            return ownerQuery(req)
          }
        })
        .then(query => {
          return db.collection('notes')
            .find(query)
            .sort({ createdOn: -1 }).toArray()
        })
        .then(notes => {
          res.send({ success: true, notes })
        })
        .catch(error => {
          res.send({ success: false, error })
        })
    }
  },
  "/groups": (req, res) => {
    if (!req.session.uid) {
      notLoggedIn(res)
    } else {
      db.collection('groups')
        .find({ owner: { $eq: new ObjectID(req.session.uid) } })
        .toArray()
        .then(groups => {
          res.send({ success: true, groups })
        })
        .catch(error => res.send({ success: false, error }))
    }
  },
}
const POST_HANDLERS = {
  "/checkLogin": (req, res) => {
    if (req.session.uid) {
      db.collection('users')
        .findOne(byId(req.session.uid))
        .then(user => {
          res.send({ success: true, username: user.username })
        })
        .catch(error => res.send({ success: false, error }))
    } else {
      notLoggedIn(res)
    }
  },
  "/register": (req, res) => {
    let username = req.body.username
    let password = hashit(req.body.password)

    if (!username) {
      res.send({ success: false, error: "No 'username' provided" })
    } else if (!password) {
      res.send({ success: false, error: "No 'password' provided" })
    } else {
      db.collection('users')
        .insertOne({ username, password, lastLogin: new Date() })
        .then(() => POST_HANDLERS["/login"](req, res))
        .catch(error => res.send({ success: false, error }))
    }
  },
  "/login": (req, res) => {
    let username = req.body.username
    let password = req.body.password

    if (!username) {
      res.send({ success: false, error: "No 'username' provided" })
    } else if (!password) {
      res.send({ success: false, error: "No 'password' provided" })
    } else {
      db.collection('users')
        .find({ username }).toArray()
        .then(users => {
          let user = users[0]
          if (user && passwordHash.verify(password, user.password)) {
            req.session.uid = user._id
            db.collection('users').updateOne(
              { _id: user._id },
              { $set: { lastLogin: new Date() } }
            )
            res.send({ success: true, username: user.username })
          } else {
            console.log("BAD-CRED", { username, password })
            res.send({ success: false, error: "Bad credentials" })
          }
        })
    }
  },
  "/logout": (req, res) => {
    req.session.destroy(error => {
      res.send({ success: !error, error })
    })
  },
  "/notes/create": (req, res) => {
    if (!req.session.uid) {
      notLoggedIn(res)
    } else if (!req.body.text) {
      res.send({ success: false, error: "No 'text' provided" })
    } else {
      var groupId = req.body.groupId
      var note = {
        owner: new ObjectID(req.session.uid),
        text: req.body.text,
        createdOn: new Date(),
        completedOn: false
      }
      db.collection('notes')
        .insertOne(note)
        .then(insertDetails => {
          if (groupId) {
            return db.collection("groups").findAndModify(
              byId(groupId), [['_id', 'asc']],
              { $push: { notes: insertDetails.insertedId } })
          } else {
            return Promise.resolve()
          }
        })
        .then(() => {
          req.query = req.query || {}
          req.query['groupId'] = groupId
          GET_HANDLERS["/notes"](req, res)
        })
        .catch(error => res.send({ success: false, error }))
    }
  },
  "/notes/update": (req, res) => {
    if (!req.session.uid) {
      notLoggedIn(res)
    } else if (!req.body.noteId) {
      res.send({ success: false, error: "No 'noteId' provided" })
    } else if (!req.body.text) {
      res.send({ success: false, error: "No updated 'text' provided" })
    } else {
      var { noteId, groupId, text } = req.body
      var query = {
        $and: [
          ownerQuery(req),
          { _id: { $eq: new ObjectID(noteId) } }
        ]
      }
      db.collection("notes").updateOne(query, { $set: { text } })
        .then(() => {
          req.query = req.query || {}
          req.query.groupId = groupId
          GET_HANDLERS["/notes"](req, res)
        })
        .catch(error => {
          console.log("CAUGHT", error)
          res.send({ success: false, error })
        })
    }
  },
  "/notes/remove": (req, res) => {
    if (!req.session.uid) {
      notLoggedIn(res)
    } else if (!req.body.noteId) {
      res.send({ success: false, error: "No 'noteId' provided" })
    } else {
      var { noteId, groupId } = req.body
      var query = {
        $and: [
          ownerQuery(req),
          { _id: { $eq: new ObjectID(noteId) } }
        ]
      }
      db.collection("notes").deleteOne(query)
        .then(() => {
          req.query = req.query || {}
          req.query.groupId = groupId
          GET_HANDLERS["/notes"](req, res)
        })
        .catch(error => {
          console.log("CAUGHT", error)
          res.send({ success: false, error })
        })
    }
  },
  "/groups/create": (req, res) => {
    if (!req.session.uid) {
      notLoggedIn(res)
    } else if (!req.body.text) {
      res.send({ success: false, error: "No 'text' provided" })
    } else {
      let group = {
        owner: new ObjectID(req.session.uid),
        text: req.body.text,
        notes: []
      }
      db.collection("groups").insertOne(group)
        .then(() => {
          GET_HANDLERS["/groups"](req, res)
        })
        .catch(error => res.send({ success: false, error }))
    }
  },
  "/groups/update": (req, res) => {
    if (!req.session.uid) {
      notLoggedIn(res)
    } else if (!req.body.groupId) {
      res.send({ success: false, error: "No 'groupId' provided" })
    } else if (!req.body.text) {
      res.send({ success: false, error: "No updated 'text' provided" })
    } else {
      var { groupId, text } = req.body
      var query = {
        $and: [
          ownerQuery(req),
          { _id: { $eq: new ObjectID(groupId) } }
        ]
      }
      db.collection("groups").updateOne(query, { $set: { text } })
        .then(() => {
          GET_HANDLERS["/groups"](req, res)
        })
        .catch(error => res.send({ success: false, error }))
    }
  },
  "/groups/remove": (req, res) => {
    if (!req.session.uid) {
      notLoggedIn(res)
    } else if (!req.body.groupId) {
      res.send({ success: false, error: "No 'groupId' provided" })
    } else {
      var { groupId } = req.body
      var query = {
        $and: [
          ownerQuery(req),
          { _id: { $eq: new ObjectID(groupId) } }
        ]
      }
      db.collection("groups").deleteOne(query)
        .then(() => {
          GET_HANDLERS["/groups"](req, res)
        })
        .catch(error => res.send({ success: false, error }))
    }
  },
}

module.exports = function (app) {
  app.use((req, res, next) => {
    console.log(`Request[${req.method}]: ${req.path}`)
    next()
  })
  for (var route in GET_HANDLERS) {
    app.get(route, GET_HANDLERS[route])
  }
  for (var route in POST_HANDLERS) {
    app.post(route, POST_HANDLERS[route])
  }
}