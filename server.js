const express = require('express')
const app = express()
var http = require('http').createServer(app)
var io = require('socket.io')(http)

const mongoose = require('mongoose')
mongoose.set('useFindAndModify', false)
const bodyParser = require('body-parser')
const cors = require('cors')
var jwt = require('jsonwebtoken')

const RouteChatRooms = require('./routes/RouteChatRooms')
const RouteLinks = require('./routes/RouteLinks')
const RouteRegister = require('./routes/RouteRegister')

const fs = require('fs')
const { Console } = require('console')
const { verify } = require('crypto')
var PRIVATE_KEY = fs.readFileSync('./private.key', { encoding: 'UTF-8' })
var PUBLIC_KEY = fs.readFileSync('./public.key', { encoding: 'UTF-8' })

app.use(cors())
app.use(bodyParser.json())
app.use(express.json())
let clientes = []

io.on('connection', socket => {
  console.log('hola socjket io :D', socket.id)
  socket.on('registro', token => {
    if (token !== null) {
      const VERIFICAR = jwt.verify(token, PUBLIC_KEY, {
        algorithms: ['RS256']
      })
      let NewCliente = { idSocket: socket.id, idUser: VERIFICAR.ID }
      let Index = clientes.findIndex(cliente => cliente.idUser === VERIFICAR.ID)
      if (Index === -1) {
        // Solo se inserta si es que no esta registrado
        clientes.push(NewCliente)
      }
    }
    console.log('los clientes son', clientes)
  })
  socket.on('disconnect', () => {
    console.log('Hubo una desconección', socket.id)
    let Index = clientes.findIndex(Cliente => Cliente.idSocket === socket.id)
    console.log(Index)
    if (Index !== -1) {
      clientes.splice(Index, 1)
    }
    console.log('disconnect', JSON.stringify(clientes))
  })
})
app.use((req, res, next) => {
  console.log('CLIENTES', clientes)
  console.log(req.originalUrl)
  res.PRIVATE_KEY = PRIVATE_KEY
  res.PUBLIC_KEY = PUBLIC_KEY
  res.IO = io
  res.CLIENTES = clientes
  next()
})
app.use('/register', RouteRegister)

app.use('/chatRooms', (req, res, next) => {
  const token = req.headers['xtoken']
  try {
    const VERIFICAR = jwt.verify(token, PUBLIC_KEY, {
      algorithms: ['RS256']
    })

    var Ahora = new Date()
    var FechaExpiracion = new Date(VERIFICAR.exp * 1000)
    var MinutosRestantes = Math.floor((FechaExpiracion - Ahora) / 100 / 60) / 10
    // console.log('MinutosRestantes', MinutosRestantes, VERIFICAR)
    // Genera Nuevo Token si ya esta por expirar el anterior
    // console.log(MinutosRestantes)
    if (MinutosRestantes < 60) {
      const NuevoToken = jwt.sign(
        {
          ID: VERIFICAR.ID,
          NAME: VERIFICAR.NAME
        },
        PRIVATE_KEY,
        {
          expiresIn: 60 * 60 * 24 * 10,
          algorithm: 'RS256'
        }
      )
      res.header('refreshtoken', NuevoToken)
    }
    res.ID = VERIFICAR.ID
    res.NAME = VERIFICAR.NAME
    next()
  } catch (error) {
    console.log('erro verificando JWT', error)
    res.status(999).send('Something broke!')
  }
})
// app.use('/link', RouteLinks)
app.use('/chatRooms', RouteChatRooms)

mongoose.connect(
  'mongodb+srv://ivanfrancisco:52100188@cluster0.bhklx.mongodb.net/ChatApp?retryWrites=true&w=majority',
  { useNewUrlParser: true, useUnifiedTopology: true },
  () => console.log('connected to DB!')
)

const db = mongoose.connection
db.on('error', error => console.error(error))
db.once('open', () => console.log('Connected to database'))

http.listen(3000, () => console.log('Server Started at http://localhost:3000'))
