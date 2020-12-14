const express = require('express')
const router = express.Router()
const Post = require('../models/ModelChatRooms')

router.get('/', async (req, res) => {
  const posts = await Post.find()
  res.json(posts)
  res.send('We are on posts')
})

router.post('/', async (req, res) => {
  console.log('holaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
  console.log(req.body)

  const post = new Post({
    title: req.body.title,
    description: req.body.description
  })

  const savedPost = await post.save()
  res.json(savedPost)

  res.send('We are on posts holaaa')
})

router.get('/:postId', async (req, res) => {
  console.log(req.params.postId)
  const post = await Post.findById(req.params.postId)
  res.json(post)
})

router.delete('/:postId', async (req, res) => {
  console.log(req.params.postId)
  const post = await Post.remove({ _id: req.params.postId })
  res.json(post)
})

router.patch('/:postId', async (req, res) => {
  console.log(req.params.postId)
  const post = await Post.updateOne(
    { _id: req.params.postId },
    {
      $set: { title: req.body.title }
    }
  )
  res.json(post)
})

module.exports = router
