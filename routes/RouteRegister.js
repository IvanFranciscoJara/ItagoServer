const express = require('express')
const router = express.Router()
var jwt = require('jsonwebtoken')
const { addMinutes, isBefore } = require('date-fns')
const ModelUsers = require('../models/ModelUsers')
const ModelLinks = require('../models/ModelLinks')
const ModelChatRooms = require('../models/ModelChatRooms')
const { VerifyLink, JoinChatRoom, BasicDatabyID } = require('./utils')

router.post('/register', async (req, res, next) => {
  let Verification = {}
  if (typeof req.body.code != 'undefined') {
    Verification = await VerifyLink(req.body.code)
    if (Verification.message !== 'Valid Link') {
      res.status(200).json(Verification)
    }
  }

  const user = new ModelUsers({
    name: req.body.name,
    join: new Date()
  })
  var savedUser = await user.save()

  if (Verification.message === 'Valid Link') {
    await JoinChatRoom(savedUser._id, savedUser.name, Verification.idChatRoom)
  }

  const token = jwt.sign(
    {
      NAME: savedUser.name,
      ID: savedUser._id
    },
    res.PRIVATE_KEY,
    {
      expiresIn: 60 * 60 * 24 * 10,
      algorithm: 'RS256'
    }
  )

  var Respuesta = {
    name: savedUser.name,
    token: token,
    PUBLIC_KEY: res.PUBLIC_KEY,
    message: 'Ok'
  }
  // console.log('ID', savedUser._id, 'ESTO ES LOGIN')
  // var Response = await BasicDatabyID(savedUser._id)
  // console.log('RESPONSE', Response, 'ESTO ES LOGIN')
  res.status(200).json(Respuesta)
})
module.exports = router
