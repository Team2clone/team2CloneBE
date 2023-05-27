const express = require('express');
const router = express.Router();
const { Users, Models } = require('../models');
const jwt = require('jsonwebtoken');

// ◎  회원가입 API
router.post('/signup', async (req, res) => {
    const chat = await Users.create({
        email: 'email2@adress.com',
        nickname: 'mynick2',
        password: 'asdf1234',
        credit: 3,
    });

    res.status(200).json({ message: 'api 연결' });
});

// ◎  로그인 API
router.post('/login', async (req, res) => {
    try {
        const { email, password, nickname } = req.body;

        //닉네임이 중복된 경우
        const existNickname = await Users.findONe({
            where: { nickname },
        });
        if (existNickname) {
            return res
                .status(423)
                .json({ errorMessage: '중복된 닉네임 입니다.' });
        }

        //이메일이 중복된 경우
        const existEmail = await Users.findONe({
            where: { email },
        });
        if (existEmail) {
            return res
                .status(412)
                .json({ errorMessage: '이미 등록된 이메일입니다.' });
        }

        //이메일 형식이 비정상적인 경우
        const CorrectEmail = email;
        //형식에 @와 .이 있는가?
        //있다면 @와 .을 기준으로 나누기
        //[1]번째 문자열이 {naver, gmail, hanmail} 중에 하나인가?
        //[2]번째 문자열이 {com, net} 중에 하나인가?

        //닉네임 형식이 비정상적인 경우

        //password 형식이 비정상적인 경우

        //password에 닉네임이 포함되어있는 경우

        //회원가입
        const newUser = await Users.create({ email, password, nickname });
        return res.status(200).json({ message: '회원가입 성공' });
    } catch (error) {
        return res
            .status(500)
            .json({ errorMessage: '예상하지 못한 서버 문제가 발생했습니다.' });
    }

    res.status(200).json({ message: 'api 연결' });
});

// ◎  로그아웃 API
router.post('/logout', async (req, res) => {
    res.status(200).json({ message: 'api 연결' });
});

// ◎  credit 확인 API
router.get('/credit', async (req, res) => {
    res.status(200).json({ message: 'api 연결' });
});

module.exports = router;
