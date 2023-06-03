const express = require('express');
const router = express.Router();
const checkLogin = require('../middlewares/checkLogin.js'); //유저아이디받기
const { Users, Chats, Conversations, Credits } = require('../models');
// openAI API 연결
const { Configuration, OpenAIApi } = require('openai');
require('dotenv').config();

// openAI API 함수
async function callChatGPT(ask, conversationId) {
    const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
    });

    try {
        const openai = new OpenAIApi(configuration);
        const response = await openai.createChatCompletion({
            model: 'gpt-3.5-turbo',
            messages: ask,
            temperature: 0.8,
        });

        const conversation = await Conversations.findOne({
            where: { conversationId },
        });
        conversation.conversation = response.data.choices[0].message.content;
        conversation.save();

        return true;
    } catch (error) {
        console.error('Error calling ChatGPT API:', error);
        if (error.response) {
            console.log('Response status:', error.response.status);
            console.log('Response data:', error.response.data);
        }
        return false;
    }
}

// 응답 객체
class ApiResponse {
    constructor(code, message = '', data = {}) {
        this.code = code;
        this.message = message;
        this.data = data;
    }
}

// ◎  새 대화 생성
router.post('/chat', checkLogin, async (req, res) => {
    // 로그인을 확인하는 authMiddleware를 거침.
    try {
        const { userId } = res.locals.user;
        const { ask } = req.body;

        if (typeof ask !== 'string' || ask === '') {
            return res
                .status(412)
                .json({ errorMsg: '프롬프트를 확인해 주세요' });
        }
        // 사용자 크레딧 확인
        const credit = await Credits.findOne({ where: { UserId: userId } });
        if (credit.credit === 0) {
            return res.status(402).json({
                errorMsg: '질문에 필요한 크레딧이 부족합니다.',
            });
        }
        const chat = await Chats.create({
            UserId: userId,
            chatName: ask.slice(0, 5),
        });

        // 사용자 질문 저장
        await Conversations.create({
            ChatId: chat.dataValues.chatId,
            isGPT: false,
            conversation: ask,
        });
        // GPT 답변 저장할 row 생성
        let conversationId = await Conversations.create({
            ChatId: chat.dataValues.chatId,
            isGPT: true,
            conversation: '',
        });
        conversationId = conversationId.dataValues.conversationId;
        console.log('should be conversationId: ', conversationId);
        const response = new ApiResponse(201, '', {
            chatId: chat.chatId,
            conversationId,
            chatName: chat.chatName,
        });
        res.status(201).json(response);
        // API 사용
        const result = await callChatGPT(
            [{ role: 'user', content: ask }],
            conversationId
        );

        if (result) {
            // 크레딧 차감(답변 받은 후 차감, 시간 되면 transaction으로 처리 필요)
            credit.credit -= 1;
            credit.save();
        } else {
            // 답변 실패 시 AI 답변 conversationID 삭제
            await Conversations.destroy({ where: { conversationId } });
        }
    } catch (error) {
        console.error(`[POST] /chat ${error}`);
        const response = new ApiResponse(
            500,
            '예상하지 못한 서버 문제가 발생했습니다.'
        );
        res.status(500).json(response);
    }
});

// ◎  전체 대화 목록 조회
router.get('/chat', checkLogin, async (req, res) => {
    const { userId } = res.locals.user;
    try {
        const chats = await Chats.findAll({
            // 테스트할것 진짜되나
            attributes: ['chatId', 'chatName', 'updatedAt'],
            where: { UserId: userId },
            order: [['updatedAt', 'DESC']],
        });

        const utcNow = new Date(); // UTC 시간대
        const koreaNow = new Date(utcNow.getTime() + 3.24e7); // 한국시간
        function koreaTimeConvert(time) {
            return new Date(time.getTime() + 3.24e7);
        } // time 파라미터를 한국시간대로 만드는 함수

        const past1 = new Date(koreaNow.getTime() - 8.64e7); // 1일 전
        const past2 = new Date(koreaNow.getTime() - 1.728e8); // 2일 전
        const past7 = new Date(koreaNow.getTime() - 6.048e8); // 7일 전
        const past30 = new Date(koreaNow.getTime() - 2.592e9); // 30일 전

        let [today, yesterday, previous7Days, previous30Days, onMayJune] = [
            [],
            [],
            [],
            [],
            [],
        ];

        const daySort = chats.forEach((chat) => {
            const koreanUpdatedAt = koreaTimeConvert(chat.updatedAt);
            if (koreanUpdatedAt > past1) {
                today.push({ chatId: chat.chatId, chatName: chat.chatName });
                // updatedAt이 하루 이내라면 today 배열에 push
            } else if (koreanUpdatedAt > past2) {
                yesterday.push({
                    chatId: chat.chatId,
                    chatName: chat.chatName,
                }); // updatedAt이 2일 이내라면 yesterday 배열에 push
            } else if (koreanUpdatedAt > past7) {
                previous7Days.push({
                    chatId: chat.chatId,
                    chatName: chat.chatName,
                }); // updatedAt이 7일 이내라면 previous7Days 배열에 push
            } else if (koreanUpdatedAt > past30) {
                previous30Days.push({
                    chatId: chat.chatId,
                    chatName: chat.chatName,
                }); // updatedAt이 30일 이내라면 previous30Days 배열에 push
            } else if (koreanUpdatedAt <= past30) {
                onMayJune.push({
                    chatId: chat.chatId,
                    chatName: chat.chatName,
                }); // updatedAt이 30일 전보다 과거 시간이라면 onMayJune 배열에 push
            }
        });
        const result = {
            today,
            yesterday,
            previous7Days,
            previous30Days,
            onMayJune,
        };

        const response = new ApiResponse(200, '', result);
        return res.status(200).json(response);
    } catch (error) {
        console.error(`[GET] /chat/ with ${error}`);
        const response = new ApiResponse(
            500,
            '예상하지 못한 서버 문제가 발생했습니다.'
        );
        return res.status(500).json(response);
    }
});

// ◎  대화하기
router.post('/chat/:chatId', checkLogin, async (req, res) => {
    const { userId } = res.locals.user;
    const { chatId } = req.params;
    const { ask } = req.body;
    try {
        // 유저의 채팅인지 확인
        const chat = await Chats.findOne({ where: { chatId } });
        if (chat.UserId !== userId) {
            const response = new ApiResponse(401, '조회 권한이 없습니다.');
            return res.status(401).json(response);
        }
        // 사용자 크레딧 확인
        const credit = await Credits.findOne({ where: { UserId: userId } });
        if (credit.credit === 0) {
            const response = new ApiResponse(
                402,
                '질문에 필요한 크레딧이 부족합니다.'
            );
            return res.status(402).json(response);
        }
        // 사용자 대화 검토
        if (typeof ask !== 'string' || ask === '') {
            const response = new ApiResponse(412, '프롬프트를 확인해 주세요');
            return res.status(412).json(response);
        }
        // 사용자 대화 저장
        await Conversations.create({
            ChatId: chatId,
            isGPT: false,
            conversation: ask,
        });
        // GPT 답변 저장할 row 생성
        let conversationId = await Conversations.create({
            ChatId: chatId,
            isGPT: true,
            conversation: '',
        });
        conversationId = conversationId.dataValues.conversationId;
        console.log('should be conversationId: ', conversationId);
        const response = new ApiResponse(201, '', { conversationId });
        res.status(201).json(response);

        // 이전 대화 불러오기
        const previousChat = await Conversations.findAll({
            where: { ChatId: chatId },
            attributes: ['isGPT', 'conversation'],
        });

        // 이전 대화내용을 openAI API 형식에 맞게 변환
        const conversation = previousChat.map((val) => {
            return {
                role: val.isGPT ? 'assistant' : 'user',
                content: val.conversation,
            };
        });

        // 신규 질문 추가
        conversation.push({ role: 'user', content: ask });
        // API 사용
        const result = await callChatGPT(conversation, conversationId);

        if (result) {
            // 크레딧 차감(답변 받은 후 차감, 시간 되면 transaction으로 처리 필요)
            credit.credit -= 1;
            credit.save();
        } else {
            // 답변 실패 시 AI 답변 conversationID 삭제
            await Conversations.destroy({ where: { conversationId } });
        }
    } catch (error) {
        console.error(`[GET] /chat/:chatId with ${error}`);
        const response = new ApiResponse(
            500,
            '예상하지 못한 서버 문제가 발생했습니다.'
        );
        return res.status(500).json(response);
    }
});

// ◎  대화내용 조회
router.get('/chat/:chatId', checkLogin, async (req, res) => {
    const { chatId } = req.params;
    const { userId } = res.locals.user;

    try {
        // 해당 채팅 존재 확인
        const chat = await Chats.findOne({ where: { chatId } });
        if (!chat) {
            const response = new ApiResponse(
                404,
                '해당 채팅을 찾을 수 없습니다.'
            );
            return res.status(404).json(response);
        }
        // 유저 일치 여부 확인
        if (chat.UserId !== userId) {
            const response = new ApiResponse(401, '조회 권한이 없습니다.');
            return res.status(401).json(response);
        }
        const conversations = await Conversations.findAll({
            where: { ChatId: chatId },
            attributes: ['conversationId', 'isGPT', 'conversation'],
        });
        // 조회 결과 응답
        const response = new ApiResponse(200, '', conversations);
        return res.status(200).json(response);
    } catch (error) {
        console.error(`[GET] /chat/:chatId with ${error}`);
        const response = new ApiResponse(
            500,
            '예상하지 못한 서버 문제가 발생했습니다.'
        );
        return res.status(500).json(response);
    }
});

// ◎  대화 제목 수정
router.put('/chat/:chatId', checkLogin, async (req, res) => {
    const { chatId } = req.params;
    const { newChatName } = req.body;
    const { userId } = res.locals.user;

    try {
        // 해당 chat 존재 여부 확인
        const chat = await Chats.findOne({ where: { chatId } });
        if (!chat) {
            const response = new ApiResponse(
                404,
                '해당 채팅을 찾을 수 없습니다.'
            );
            return res.status(404).json(response);
        }
        // 유저 일치 여부 확인
        if (chat.UserId !== userId) {
            const response = new ApiResponse(401, '수정 권한이 없습니다.');
            return res.status(401).json(response);
        }

        // 제목 수정 및 저장
        chat.chatName = newChatName;
        await chat.save();
        // 수정 응답
        const response = new ApiResponse(200, '대화 제목을 수정했습니다.');
        return res.status(200).json(response);
    } catch (error) {
        console.error(`[GET] /chat/:chatId with ${error}`);
        const response = new ApiResponse(
            500,
            '예상하지 못한 서버 문제가 발생했습니다.'
        );
        return res.status(500).json(response);
    }
});

// ◎  대화 삭제
router.delete('/chat/:chatId', checkLogin, async (req, res) => {
    const { chatId } = req.params;
    const { newChatName } = req.body;
    const { userId } = res.locals.user;

    try {
        // 해당 chat 존재 여부 확인
        const chat = await Chats.findOne({ where: { chatId } });
        if (!chat) {
            const response = new ApiResponse(
                404,
                '해당 채팅을 찾을 수 없습니다.'
            );
            return res.status(404).json(response);
        }
        // 유저 일치 여부 확인
        if (chat.UserId !== userId) {
            const response = new ApiResponse(401, '삭제 권한이 없습니다.');
            return res.status(401).json(response);
        }
        // 삭제
        await Chats.destroy({ where: { chatId } });
        // 삭제 응답
        const response = new ApiResponse(200, '대화를 삭제했습니다.');
        return res.status(200).json(response);
    } catch (error) {
        console.error(`[GET] /chat/:chatId with ${error}`);
        const response = new ApiResponse(
            500,
            '예상하지 못한 서버 문제가 발생했습니다.'
        );
        return res.status(500).json(response);
    }
});

// ◎  대화 가져오기
router.get('/chat/:chatId/:conversationId', checkLogin, async (req, res) => {
    const { chatId, conversationId } = req.params;
    const { userId } = res.locals.user;

    try {
        // conversation 조회
        const conversation = await Conversations.findOne({
            where: { conversationId },
        });
        // 해당 대화가 없는 경우(생성 실패로 삭제된 case)
        if (!conversation) {
            const response = new ApiResponse(500, 'AI 답변 생성 실패');
            return res.status(500).json(response);
        }
        // 해당 chat 존재 여부 확인
        const chat = await Chats.findOne({ where: { chatId } });
        if (!chat) {
            const response = new ApiResponse(
                404,
                '해당 채팅을 찾을 수 없습니다.'
            );
            return res.status(404).json(response);
        }
        // conversation이 요청한 chatId에 해당하는지 확인
        if (Number(chatId) !== conversation.dataValues.ChatId) {
            const response = new ApiResponse(
                401,
                '해당 채팅의 대화가 아닙니다.'
            );
            return res.status(401).json(response);
        }
        // 유저 일치 여부 확인
        if (chat.UserId !== userId) {
            const response = new ApiResponse(401, '열람 권한이 없습니다.');
            return res.status(401).json(response);
        }

        // 대화 내용 확인 후 응답
        const answer = conversation.dataValues.conversation;
        if (answer) {
            // 대화 응답
            const response = new ApiResponse(200, '', { answer });
            return res.status(200).json(response);
        } else {
            // 대화 응답
            const response = new ApiResponse(404, 'AI 답변 대기 중');
            return res.status(404).json(response);
        }
    } catch (error) {
        console.error(`[GET] /chat/:chatId/:conversationId with ${error}`);
        const response = new ApiResponse(
            500,
            '예상하지 못한 서버 문제가 발생했습니다.'
        );
        return res.status(500).json(response);
    }
});

module.exports = router;
