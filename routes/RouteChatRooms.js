const express = require('express')
const router = express.Router()
// var jwt = require('jsonwebtoken')
const { addMinutes, isBefore, addSeconds } = require('date-fns')
const ModelChatRooms = require('../models/ModelChatRooms')
const ModelUsers = require('../models/ModelUsers')
const ModelLinks = require('../models/ModelLinks')
const { Mongoose, Types } = require('mongoose')
const { BasicDatabyID, JoinChatRoom, VerifyLink, SentDataToManyUsers } = require('./utils.js')

router.post('/createChatRoom', async (req, res, next) => {
  console.log(req.body, res.ID, res.NAME)
  // console.log(ChatRooms.ChatRooms)
  const chatRoom = new ModelChatRooms({
    admin: res.ID,
    name: req.body.state.name,
    description: req.body.state.description,
    Creation: new Date(),
    events: [
      {
        tipo: 'join',
        date: new Date(),
        name: res.NAME
      }
    ],
    users: [
      {
        user_id: res.ID,
        joinDate: new Date(),
        lastView: new Date(),
        state: 'active'
      }
    ]
  })
  var savedChatRoom = await chatRoom.save()
  let NewUser = await ModelUsers.findById(res.ID)
  NewUser.chatrooms.push(savedChatRoom._id)
  let savedUser = await ModelUsers.findByIdAndUpdate(
    { _id: res.ID },
    {
      chatrooms: NewUser.chatrooms
    },
    { new: true }
  )

  var Response = await BasicDatabyID(res.ID)
  // console.log(Response)
  res.status(200).json(Response)
})
router.post('/sendMessage', async (req, res, next) => {
  console.log('😆 iniciando sendMessage', req.body)
  let NewChatRoom = await ModelChatRooms.findById(req.body.idChatroom)

  NewChatRoom.conversation.push({
    user_name: res.NAME,
    user_id: res.ID,
    date: new Date(),
    message: req.body.message,
    replyFrom: req.body.replyfrom
  })

  let savedChatRoom = await ModelChatRooms.findByIdAndUpdate(
    { _id: req.body.idChatroom },
    {
      conversation: NewChatRoom.conversation
    },
    { new: true }
  )

  var Response = await BasicDatabyID(res.ID)
  // res.IO.emit('updatedata', { clientes: 'cliente:DDD' })
  let indexcliente
  await SentDataToManyUsers(
    savedChatRoom.users.map(user => user.user_id),
    res.CLIENTES,
    res.IO
  )
  // for (i = 0; i < savedChatRoom.users.length; i++) {
  //   if (savedChatRoom.users[i].user_id !== res.ID) {
  //     indexcliente = res.CLIENTES.findIndex(cliente => cliente.idUser === savedChatRoom.users[i].user_id)
  //     if (indexcliente !== -1) {
  //       res.IO.to(res.CLIENTES[indexcliente].idSocket).emit(
  //         'updatedata',
  //         await BasicDatabyID(res.CLIENTES[indexcliente].idUser)
  //       )
  //     }
  //   }
  // }
  res.status(200).json(Response)
})
router.post('/sendVisto', async (req, res, next) => {
  console.log('😆 iniciando sendVisto')

  let NewChatRoom = await ModelChatRooms.findById(req.body.idChatroom)
  let index = NewChatRoom.users.findIndex(user => user.user_id === res.ID)
  NewChatRoom.users[index].lastView = new Date()

  let savedChatRoom = await ModelChatRooms.findByIdAndUpdate(
    { _id: req.body.idChatroom },
    {
      users: NewChatRoom.users
    },
    { new: true }
  )

  var Response = await BasicDatabyID(res.ID)
  res.status(200).json(Response)
})
router.post('/joinChatRoom', async (req, res, next) => {
  let Verification = {}
  Verification = await VerifyLink(req.body.code)
  console.log(Verification)
  if (Verification.message !== 'Valid Link') {
    res.status(200).json(Verification)
  }
  JoinChatRoom(res.ID, res.NAME, Verification.idChatRoom)
  console.log(req.body, res.ID, res.NAME)
  var Response = await BasicDatabyID(res.ID)
  console.log(Response)
  res.status(200).json(Response)
})
router.post('/leaveChatRoom', async (req, res, next) => {
  console.log('😆 iniciando leaveChatRoom')
  console.log(req.body)
  let NewChatRoom = await ModelChatRooms.findById(req.body.idChatroom)

  let index = NewChatRoom.users.findIndex(user => user.user_id === res.ID)
  NewChatRoom.users[index].state = req.body.deleteMessages ? 'leavecomplete' : 'leave'
  NewChatRoom.events.push({
    tipo: 'left',
    date: new Date(),
    name: res.NAME
  })
  let savedChatRoom = await ModelChatRooms.findByIdAndUpdate(
    { _id: req.body.idChatroom },
    {
      users: NewChatRoom.users,
      events: NewChatRoom.events
    },
    { new: true }
  )

  let NewUser = await ModelUsers.findById(res.ID)
  NewUser.chatrooms = NewUser.chatrooms.filter(chatroom => chatroom !== req.body.idChatroom)
  let savedUser = await ModelUsers.findByIdAndUpdate(
    { _id: res.ID },
    {
      chatrooms: NewUser.chatrooms
    },
    { new: true }
  )

  var Response = await BasicDatabyID(res.ID)
  res.status(200).json(Response)
})
router.post('/getdata', async (req, res, next) => {
  'usando chatrooms/getdata'
  var Response = await BasicDatabyID(res.ID)
  res.status(200).json(Response)
})
router.post('/createLink', async (req, res, next) => {
  console.log('hola', req.body)
  const link = new ModelLinks({
    id_user: res.ID,
    id_chatRoom: req.body.idChatroom,
    date: new Date(),
    minutes: req.body.time
  })

  var savedLink = await link.save()
  // let Respuesta = {idLink: savedLink._id}
  res.status(200).json(savedLink)
})
router.post('/logOut', async (req, res, next) => {
  console.log('😆 iniciando leaveChatRoom')
  console.log(req.body)

  let NewUser = await ModelUsers.findById(res.ID)
  let i
  // console.log({ ...NewUser })
  for (i = 0; i < NewUser.chatrooms.length; i++) {
    let NewChatRoom = await ModelChatRooms.findById(NewUser.chatrooms[i])
    let index = NewChatRoom.users.findIndex(user => user.user_id === res.ID)
    NewChatRoom.users[index].state = req.body.deleteMessages ? 'leavecomplete' : 'leave'
    NewChatRoom.events.push({
      tipo: 'left',
      date: new Date(),
      name: res.NAME
    })
    let savedChatRoom = await ModelChatRooms.findByIdAndUpdate(
      { _id: NewUser.chatrooms[i] },
      {
        users: NewChatRoom.users,
        events: NewChatRoom.events
      },
      { new: true }
    )
  }
  // quitando los chatRooms del user :D
  let savedUser = await ModelUsers.findByIdAndUpdate(
    { _id: res.ID },
    {
      chatrooms: []
    },
    { new: true }
  )

  // var Response = await BasicDatabyID(res.ID)
  res.status(200).json('ok')
})

module.exports = router
