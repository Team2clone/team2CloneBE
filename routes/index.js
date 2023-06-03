const express = require('express');
const router = express.Router();

// CORS 설정
const cors = require('cors');
router.use(
    cors({
        origin: ['https://team2-clone-fe.vercel.app', 'http://localhost:3000']
    })
);

// chats 및 users 라우터 가져오기
const chatsRouter = require('./chats');
const usersRouter = require('./users');

// chats 및 users 라우터 등록
router.use('/chats', chatsRouter);
router.use('/users', usersRouter);

module.exports = router;
