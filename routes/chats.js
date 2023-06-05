const express = require('express');
const router = express.Router();
const checkLogin = require('../middlewares/checkLogin.js'); //유저아이디받기
const { sequelize, Chats, Conversations, Credits } = require('../models');
// openAI API 연결
const { Configuration, OpenAIApi } = require('openai');
require('dotenv').config();

// openAI API 함수
async function callChatGPT(conversation) {
    const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
    });

    try {
        const openai = new OpenAIApi(configuration);
        const response = await openai.createChatCompletion({
            model: 'gpt-3.5-turbo',
            messages: conversation,
            temperature: 0.8,
        });

        const reply = response.data.choices[0].message;
        return reply;
    } catch (error) {
        console.error('Error calling ChatGPT API:', error);
        if (error.response) {
            console.log('Response status:', error.response.status);
            console.log('Response data:', error.response.data);
        }
        return null;
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
        const userCredit = await Credits.findOne({ where: { UserId: userId } });
        if (userCredit.credit === 0) {
            return res.status(402).json({
                errorMsg: '질문에 필요한 크레딧이 부족합니다.',
            });
        }
        // 제목생성 후 저장
        const askArr = ask.split(' ');
        const slicedAsk =
            askArr.slice(0, 3).join(' ').length >= 15
                ? ask.slice(0, 15)
                : askArr.slice(0, 3).join(' ');
        const chat = await Chats.create({
            UserId: userId,
            chatName: slicedAsk,
        });

        // 사용자 질문 저장
        await Conversations.create({
            ChatId: chat.dataValues.chatId,
            isGPT: false,
            conversation: ask,
        });

        // 선 응답 후 질문 답변 생성
        const response = new ApiResponse(201, '', {
            chatId: chat.chatId,
            answer: '',
            chatName: chat.chatName,
        });
        res.status(201).json(response);

        // transaction 시작
        const transaction = await sequelize.transaction();
        try {
            // API 사용
            const reply = await callChatGPT([{ role: 'user', content: ask }]);

            // GPT 답변 내용 저장
            await Conversations.create(
                {
                    ChatId: chat.dataValues.chatId,
                    isGPT: true,
                    conversation: reply.content,
                },
                { transaction }
            );

            // 크레딧 차감
            const credit = userCredit.credit - 1;
            await Credits.update(
                { credit },
                { where: { UserId: userId }, transaction }
            );

            // transaction 커밋
            await transaction.commit();
        } catch (transactionError) {
            // tansaction 롤백
            transaction.rollback();

            // transaction 중 오류 시 default 응답 저장
            await Conversations.create({
                ChatId: chat.dataValues.chatId,
                isGPT: true,
                conversation: 'An API error has occurred. Please try again.',
            });

            // 에러 메시지 콘솔 저장
            console.log(`[POST] /chat transactionError: ${transactionError}`);
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
        const userCredit = await Credits.findOne({ where: { UserId: userId } });
        if (userCredit.credit === 0) {
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
        
        // 선 응답 후 API
        const response = new ApiResponse(200, '', { answer: '' });
        res.status(200).json(response);

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
        // transaction 시작
        const transaction = await sequelize.transaction();
        try {
            // API 사용
            const reply = await callChatGPT(conversation);
            // GPT 대화 내용 저장
            await Conversations.create(
                {
                    ChatId: chatId,
                    isGPT: true,
                    conversation: reply.content,
                },
                { transaction }
            );

            // 크레딧 차감
            const credit = userCredit.credit - 1;
            await Credits.update(
                { credit: credit },
                { where: { UserId: userId }, transaction }
            );

            // transaction 커밋
            await transaction.commit();
        } catch (transactionError) {
            // transaction 롤백
            transaction.rollback();

            // transaction 중 오류 시 default 응답 저장
            await Conversations.create({
                ChatId: chatId,
                isGPT: true,
                conversation: 'An API error has occurred. Please try again.',
            });

            // 에러 메시지 콘솔 저장
            console.log(`[POST] /chat transactionError: ${transactionError}`);
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

module.exports = router;
