const mongoose = require('mongoose')

const UserSchema = mongoose.Schema({
  name: String,
  join: Date,
  chatrooms: [String]
})

module.exports = mongoose.model('Users', UserSchema)
