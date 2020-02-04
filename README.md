# Supernotes

A simple note keeping system for my students' assignments.

## API

All responses follow this format:

```
{ success: true, ...}
```
```
{ success: false, error: "Error details"}
```

If success is true, any extra data will be included in the object, suck as notes, groups, username, etc.


## POST  /checkLogin
```
req ()
res (username)
```
* Check to see if a user is already logged in

## POST  /register   
```
req (username, password)
res (username)
```
* Register a new user. 

* Your page must include a password confirm field which you must also validate.

## POST  /login
```
req (username, password)
res (username)
```
* Login with an existing account.

## POST  /logout     
```
req ()
res ()
```
* Destroy user session

## GET   /notes
```
req (?groupId)
res (notes[])
```
* Get a list of notes. 

* Has optional parameter 'groupId'.

* Without a groupId all notes are returned.

* With a groupId only notes from that group are returned.

## POST  /notes/create
```
req (text, ?groupId)  
res (notes[])
```
* Create a note and if the optional 'groupId' is included, add it to that group.

* Returns an updated list of notes.

## POST  /notes/remove
```
req (noteId, ?groupId)
res (notes[])
```
* Remove a note.

* Returns an updated list of notes.

## GET  /groups
```
req ()
res (groups[])
```
* Returns a list of groups.

## POST  /groups/create
```
req (text)
res (groups[])
```
* Create a group.

* Returns an updated list of groups.

## POST  /groups/remove
```
req (groupId)
res (groups[])
```
* Remove a group.

* Returns an updated list of groups.


# OPTIONAL

## POST  /notes/update
```
req (noteId, text, ?groupId)
res (notes[])
```
* Update a note

* Returns an updated list of notes.


## POST  /groups/update
```
req (groupId, text)
res (groups[])
```
* Update a group

* Returns an updated list of groups.