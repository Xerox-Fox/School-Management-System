const express = require('express');
const router = express.Router()

// auth middleware
const authMiddleware = require('../middleware/authMiddleware')


// user controllers
const { register, login, logout, checkUser, getAllUsers } = require('../Controllers/userController')

// register routes
router.post('/register', authMiddleware, register)

// login user
router.post('/login', login)

// log out user
router.post('/logout', logout)

// check user
router.get('/check', authMiddleware,checkUser)

router.get('/all', authMiddleware, getAllUsers)

module.exports = router