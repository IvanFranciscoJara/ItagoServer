const mongoose = require('mongoose')

const LinksSchema = mongoose.Schema({
  id_user: String,
  id_chatRoom: String,
  date: Date,
  minutes: Number,
  linked_users: [String]
})

module.exports = mongoose.model('Links', LinksSchema)
