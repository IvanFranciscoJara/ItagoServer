const mongoose = require('mongoose')

const ChatRoomSchema = mongoose.Schema({
  admin: String,
  name: String,
  description: String,
  creation: Date,
  users: [{ _id: false, user_id: String, joinDate: Date, lastView: Date, state: String }],
  events: [{ _id: false, tipo: String, date: Date, name: String }],
  conversation: [
    {
      _id: false,
      user_id: String,
      user_name: String,
      date: Date,
      message: String,
      replyFrom: { date: Date, from: String, message: String },
      attach: { AWSname: String, filename: String }
    }
  ]
})

module.exports = mongoose.model('ChatRooms', ChatRoomSchema)
