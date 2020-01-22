Vue.config.devtools = true
var app = new Vue({
  el: "#app",
  data: () => ({
    loggedIn: false,
    username: "jermerf",
    password: "puppies",
    res: "",
    createGroupText: "",
    createNoteText: "",
    notes: [],
    groupId: "",
    groups: []
  }),
  methods: {
    login() {
      var data = {
        username: this.username,
        password: this.password
      }
      $.post('/login', data, res => {
        if (res.success) {
          this.loginSuccessful(res.username)
        } else {
          this.res = JSON.stringify(res)
        }
      })
    },
    register() {
      var data = {
        username: this.username,
        password: this.password
      }
      $.post('/register', data, res => {
        if (res.success) {
          this.loginSuccessful(res.username)
        } else {
          this.res = JSON.stringify(res)
        }
      })
    },
    loginSuccessful(username) {
      this.loggedIn = true
      this.username = username
      this.getGroups()
      this.getNotes()
    },
    logout() {
      $.post("/logout", res => {
        if (res.success) {
          this.loggedIn = false
          this.username = ""
          this.createGroupText = ""
          this.createNoteText = ""
          this.notes = []
          this.groups = []
          this.groupId = ""
        }
      })
    },
    getGroups() {
      $.get("/groups", res => {
        if (res.success) {
          this.groups = res.groups
        } else {
          this.res = res
        }
      })
    },
    getNotes(groupId) {
      $.get("/notes", { groupId }, res => {
        if (res.success) {
          this.notes = res.notes
        } else {
          this.res = res
        }
      })
    },
    createNote() {
      $.post("/notes/create", {
        text: this.createNoteText,
        groupId: this.groupId
      }, res => {
        if (res.success) {
          this.notes = res.notes
          this.createNoteText = ""
        } else {
          this.res = res
        }
      })
    },
    removeNote(noteId){
      console.log({noteId})
      $.post("/notes/remove", { noteId }, res => {
        if (res.success) {
          this.getNotes()
        } else {
          this.res = res
        }
      })
    },
    removeGroup(groupId){
      $.post("/groups/remove", { groupId }, res => {
        if (res.success) {
          this.getGroups()
        } else {
          this.res = res
        }
      })
    },
    createGroup() {
      $.post("/groups/create", {
        text: this.createGroupText
      }, res => {
        if (res.success) {
          this.groups = res.groups
          this.createGroupText = ""
        } else {
          this.res = res
        }
      })
    }
  },
  mounted() {
    $.post("/checkLogin", res => {
      if (res.success) {
        this.loginSuccessful(res.username)
      }
    })
    
  }
})