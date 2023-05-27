const express = require('express');
const router = express.Router();
const checkLogin = require("..middlewares/checkLogin.js")
const checkCredit = require("..middlewares/checkCredit.js")
const { Users, Chats, Conversations } = require('../models');

// ◎  새 대화 생성
router.post('/chat', async (req, res) => {
    const chat = await Chats.create({ UserId: 3, chatName: '새 대화' });
    res.status(200).json({ message: '대화 생성' });
});

// ◎  전체 대화 목록 조회
router.get('/chat', async (req, res) => {
    res.status(200).json({ message: 'api 연결' });
});

// ◎  대화하기
router.post('/chat/:chatId', async (req, res) => {
});

// ◎  대화내용 조회
router.get('/chat/:chatId', async (req, res) => {
    const { chatId } = req.params;
    try {
        const chat = await Chats.findOne({ where: { chatId } });
        if (!chat) {
            return res
                .status(404)
                .json({ errorMsg: '해당 채팅을 찾을 수 없습니다.' });
        }

        const conversations = await Conversations.findAll({
            where: { ChatId: chatId },
            attributes: ['conversationId', 'isGPT', 'conversation'],
        });

        return res.status(200).json({ conversations });
    } catch (error) {
        console.error(`[GET] /chat/:chatId with ${error}`);

        return res.status(500).json({
            errorMsg: '예상하지 못한 서버 문제가 발생했습니다.',
        });
    }
});

// ◎  대화 제목 수정
router.put('/chat/:chatId', async (req, res) => {
    const { chatId } = req.params;
    const { newChatName } = req.body;
    try {
        // 해당 chat 존재 여부 확인
        const chat = await Chats.findOne({ where: { chatId } });
        if (!chat) {
            return res
                .status(404)
                .json({ errorMsg: '해당 채팅을 찾을 수 없습니다.' });
        }
        // 제목 변경
        chat.chatName = newChatName;
        // 저장
        await chat.save();
        return res.status(200).json({ msg: '대화 제목을 수정했습니다.' });
    } catch (error) {
        console.error(`[GET] /chat/:chatId with ${error}`);

        return res.status(500).json({
            errorMsg: '예상하지 못한 서버 문제가 발생했습니다.',
        });
    }
});

// ◎  대화 삭제
router.delete('/chat/:chatId', async (req, res) => {
    const { chatId } = req.params;
    const { newChatName } = req.body;
    try {
        // 해당 chat 존재 여부 확인
        const chat = await Chats.findOne({ where: { chatId } });
        if (!chat) {
            return res
                .status(404)
                .json({ errorMsg: '해당 채팅을 찾을 수 없습니다.' });
        }
        // 삭제
        await Chats.destroy({ where: { chatId } });
        return res.status(200).json({ msg: '대화를 삭제했습니다.' });
    } catch (error) {
        console.error(`[GET] /chat/:chatId with ${error}`);

        return res.status(500).json({
            errorMsg: '예상하지 못한 서버 문제가 발생했습니다.',
        });
    }
});

module.exports = router;
