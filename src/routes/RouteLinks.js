const express = require('express')
const router = express.Router()
// var jwt = require('jsonwebtoken')
const ModelChatRooms = require('../models/ModelChatRooms')
const ModelUsers = require('../models/ModelUsers')
const ModelLinks = require('../models/ModelLinks')
const { Mongoose, Types } = require('mongoose')

// router.post('/create', async (req, res, next) => {
//   console.log('hola', req.body)
//   const link = new ModelLinks({
//     id_user: res.ID,
//     id_chatRoom: req.body.idChatroom,
//     date: new Date(),
//     minutes: req.body.time
//   })

//   var savedLink = await link.save()
//   // let Respuesta = {idLink: savedLink._id}
//   res.status(200).json(savedLink)
// })

// router.post('/verify', async (req, res, next) => {
//   console.log('hola')
//   res.status(200).json({ res: 'Respuesta' })
// })
module.exports = router
