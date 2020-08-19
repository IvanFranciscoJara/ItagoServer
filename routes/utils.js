const { Mongoose, Types } = require('mongoose')
const { addMinutes, isBefore, addSeconds } = require('date-fns')
const ModelUsers = require('../models/ModelUsers')
const ModelLinks = require('../models/ModelLinks')
const ModelChatRooms = require('../models/ModelChatRooms')

const BasicDatabyID = async idUser => {
  let NewUser = await ModelUsers.findById(idUser)
  let TheUserChatRooms = await ModelChatRooms.find({
    _id: {
      $in: NewUser.chatrooms.map(item => Types.ObjectId(item))
    }
  })
  let Conversations = []
  let Conversation = {}
  let Chat_Conversation
  let Chat_Events

  let i
  for (i = 0; i < TheUserChatRooms.length; i++) {
    // console.log(TheUserChatRooms[i]._id)
    Conversation._id = TheUserChatRooms[i]._id
    Conversation.admin = TheUserChatRooms[i].admin
    Conversation.name = TheUserChatRooms[i].name
    Conversation.description = TheUserChatRooms[i].description

    let UsersLeaveComplete = TheUserChatRooms[i].users.filter(user => user.state === 'leavecomplete')
    // console.log(UsersLeaveComplete)
    UsersLeaveComplete = UsersLeaveComplete.map(user => user.user_id)
    // console.log(UsersLeaveComplete)

    // convirtiendo eventos al chat
    Chat_Events = TheUserChatRooms[i].events.map(event => ({
      tipo: 'event',
      date: event.date,
      message: `${event.name} ${event.tipo} to the private chat room`
    }))

    // convirtiendo mensajes al chat
    Chat_Conversation = TheUserChatRooms[i].conversation.map(item => ({
      id_user: item.user_id,
      tipo: 'conversation',
      mine: Boolean(item.user_id === idUser),
      from: item.user_name,
      date: item.date,
      message: item.message,
      replyFrom: item.replyFrom
    }))

    Conversation.chat = Chat_Conversation.concat(Chat_Events) // agreando al chat los eventos
    Conversation.chat = Conversation.chat.sort((a, b) => a.date - b.date) // ordenando el chat

    //filtrando para ver solo despues del join to the chatroom
    let Index = TheUserChatRooms[i].users.findIndex(user => user.user_id === idUser)
    let JoinDate = TheUserChatRooms[i].users[Index].joinDate
    Conversation.chat = Conversation.chat.filter(item =>
      isBefore(addSeconds(new Date(JoinDate), -1), new Date(item.date))
    )

    //filtrando los mensajes whos leaves the chatroom
    Conversation.chat = Conversation.chat.filter(
      //solo pasa lo que no encuentra
      item => UsersLeaveComplete.findIndex(user => user === item.id_user) === -1
    )

    // console.log(Conversation.chat)

    // console.log(Conversation)
    Conversations.push({ ...Conversation })
  }

  // console.log(Conversations)
  return Conversations
}
const VerifyLink = async code => {
  console.log('VerifyLink', code)
  let Link = await ModelLinks.findById(code)
  console.log(Link)
  if (Link === null) {
    return { message: 'Invalid link' }
  }
  if (isBefore(new Date(), addMinutes(Link.date, Link.minutes))) {
    return { message: 'Valid Link', idChatRoom: Link.id_chatRoom }
  } else {
    return { message: 'Expired Link' }
  }
}
const JoinChatRoom = async (idUser, nameUser, idchatroom) => {
  console.log('IniciaJoinChatRoom')
  let NewChatRoom = await ModelChatRooms.findById(idchatroom)
  NewChatRoom.events.push({
    tipo: 'join',
    date: new Date(),
    name: nameUser
  })
  NewChatRoom.users.push({
    user_id: idUser,
    joinDate: new Date(),
    lastView: new Date(),
    state: 'active'
  })

  let savedChatRoom = await ModelChatRooms.findByIdAndUpdate(
    { _id: idchatroom },
    {
      events: NewChatRoom.events,
      users: NewChatRoom.users
    },
    { new: true }
  )

  let NewUser = await ModelUsers.findById(idUser)
  NewUser.chatrooms.push(idchatroom)
  let savedUser = await ModelUsers.findByIdAndUpdate(
    { _id: idUser },
    {
      chatrooms: NewUser.chatrooms
    },
    { new: true }
  )

  // console.log('ESTO ES DEL JOIN CHATROOM', savedChatRoom, savedUser)
  console.log('FinJoinChatRoom')
  return 'OK'
}
const SentDataToManyUsers = async (users, CLIENTES, IO) => {
  let indexcliente
  for (i = 0; i < users.length; i++) {
    indexcliente = CLIENTES.findIndex(cliente => cliente.idUser === users[i])
    if (indexcliente !== -1) {
      IO.to(CLIENTES[indexcliente].idSocket).emit('updatedata', await BasicDatabyID(CLIENTES[indexcliente].idUser))
    }
  }
}
module.exports = { BasicDatabyID, VerifyLink, JoinChatRoom, SentDataToManyUsers }
