const express = require('express')

const app = express()
var http = require('http').createServer(app)
var io = require('socket.io')(http)

const mongoose = require('mongoose')
mongoose.set('useFindAndModify', false)
const bodyParser = require('body-parser')
const cors = require('cors')
var jwt = require('jsonwebtoken')

const RouteChatRooms = require('./src/routes/RouteChatRooms')
const RouteRegister = require('./src/routes/RouteRegister')

const fs = require('fs')

var PRIVATE_KEY = fs.readFileSync(__dirname + '/src/private.key', {
  encoding: 'UTF-8',
})
var PUBLIC_KEY = fs.readFileSync(__dirname + '/src/public.key', {
  encoding: 'UTF-8',
})
const PORT = process.env.PORT || 9001
app.use(cors())
// app.get('/nuevoindex', function (req, res) {
//   console.log('Homepage')
//   res.send('ItWorked')
// })

app.get('/', function (req, res) {
  console.log('Homepage')
  res.send('ItagoServer Ivan Francisco Jara')
})
app.use(bodyParser.json())
app.use(express.json())

let clientes = []

// let vapid = push.generateVAPIDKeys()
let vapid = {
  publicKey: 'BMwjQB3wSAGY7fKhblerz6StsVJ2JDJCd6dJG02iHNwZOcIJ1CCorr8AMwUi2oH51on9TYCIG3GEDo3xRwLfZKo',
  privateKey: 'HGr6idZELCLXvqdiXLoFlPCJJ_w_LE7odcqP0ds4Xhs',
}

// push.setVapidDetails('mailto:test@code.co.uk', vapid.publicKey, vapid.privateKey)

// let sub = {
//   endpoint:
//     'https://fcm.googleapis.com/fcm/send/dn7CEGOXyVs:APA91bFQCWgV5ybw_DF9EMUytO2jbAFDEFQBejI5sxWKUBOlw4kmGU8okmDjJRQoJb4VZQ6SUq-bTKorVeP2ygRvAZG4RqouSbYTMFsJXF0Ji8iED9ArbGQ2nHrO6gY0D4cR_Ut-Awlh',
//   expirationTime: null,
//   keys: {
//     p256dh: 'BIBKuOO1U78IL_VeXob7Tz46JDtcDjEs0vTGQLEYApI1DJr4w58rvSXv5YvEy5XHMLbDZAjQ83bpypCQ4FLrKqs',
//     auth: '67eAEnRKxwGEFeoRG2BgeQ'
//   }
// }

// let payload = JSON.stringify({ message: 'hola, como va todo?' })

// push.sendNotification(sub)

console.log(vapid)

io.on('connection', (socket) => {
  console.log('hola socjket io :D', socket.id)
  socket.on('registro', (token) => {
    if (token !== null) {
      const VERIFICAR = jwt.verify(token, PUBLIC_KEY, {
        algorithms: ['RS256'],
      })
      let NewCliente = { idSocket: socket.id, idUser: VERIFICAR.ID }
      let Index = clientes.findIndex((cliente) => cliente.idUser === VERIFICAR.ID)
      if (Index === -1) {
        // Solo se inserta si es que no esta registrado
        clientes.push(NewCliente)
      }
    }
    console.log('los clientes son', clientes)
  })
  socket.on('disconnect', () => {
    console.log('Hubo una desconección', socket.id)
    let Index = clientes.findIndex((Cliente) => Cliente.idSocket === socket.id)
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
      algorithms: ['RS256'],
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
          NAME: VERIFICAR.NAME,
        },
        PRIVATE_KEY,
        {
          expiresIn: 60 * 60 * 24 * 10,
          algorithm: 'RS256',
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
db.on('error', (error) => console.error(error))
db.once('open', () => console.log('Connected to database'))

http.listen(PORT, () => console.log(`Server Started at http://localhost:${PORT}`))
