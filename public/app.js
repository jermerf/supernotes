TreeView(Vue)

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
    groupId: "",
    groups: [],
    noteId: "",
    notes: [],
    updateGroupPopup: false,
    updateNotePopup: false,
    updateGroupText: "",
    updateNoteText: "",
    showMongo: false,
    mongo: {}
  }),
  methods: {
    showUpdateNote(note) {
      this.noteId = note._id
      this.updateNoteText = note.text
      this.updateNotePopup = true
    },
    updateNote() {
      $.post("/notes/update", {
        text: this.updateNoteText,
        noteId: this.noteId,
        groupId: this.groupId
      }, res => {
        if (res.success) {
          this.notes = res.notes
          this.updateNoteText = ""
          this.updateNotePopup = false
        } else {
          this.res = res
        }
      })
    },
    showUpdateGroup(group) {
      this.groupId = group._id
      this.updateGroupText = group.text
      this.updateGroupPopup = true
    },
    updateGroup() {
      $.post("/groups/update", {
        text: this.updateGroupText,
        groupId: this.groupId
      }, res => {
        if (res.success) {
          this.groups = res.groups
          this.updateGroupText = ""
          this.updateGroupPopup = false
        } else {
          this.res = res
        }
      })
    },
    refreshDatabase() {
      this.showMongo = true
      $.get('/db', res => {
        if (res.success) {
          this.mongo = res.mongo
        } else {
          this.res = JSON.stringify(res)
        }
      })
    },
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
      console.log(groupId)
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
    removeNote(noteId) {
      var groupId = this.groupId
      $.post("/notes/remove", { noteId, groupId }, res => {
        if (res.success) {
          this.notes = res.notes
        } else {
          this.res = res
        }
      })
    },
    removeGroup(groupId) {
      $.post("/groups/remove", { groupId }, res => {
        if (res.success) {
          this.groups = res.groups
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