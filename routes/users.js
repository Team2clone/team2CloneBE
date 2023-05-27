const express = require('express');
const router = express.Router();
const { Users, Models } = require('../models');
const jwt = require('jsonwebtoken');

// ◎  회원가입 API
router.post('/signup', async (req, res) => {
    try {
        const { email, password, nickname } = req.body;

        //닉네임이 중복된 경우
        const existNickname = await Users.findOne({
            where: { nickname },
        });
        if (existNickname) {
            return res
                .status(423)
                .json({ errorMessage: '중복된 닉네임 입니다.' });
        }

        //이메일이 중복된 경우
        const existEmail = await Users.findOne({
            where: { email },
        });
        if (existEmail) {
            return res
                .status(412)
                .json({ errorMessage: '이미 등록된 이메일입니다.' });
        }

        //이메일 형식이 비정상적인 경우
        const existAt = email.split('@');

        //1.이메일 아이디에 특수기호가 있는경우
        const emailletter = ['.', '/', '_', '+', '-', '!', '~', '#', '$','%','^','&','*','(',")",'=','?','<','>','"', "'", '`', '|'];
        let emailletterOk = 0;
        for (let i of emailletter) {
            if (existAt[0].split(`${i}`).length>1) {
              emailletterOk = 1;
            }
        }
        if (emailletterOk) {
            return res
                .status(412)
                .json({ errorMessage: '이메일의 형식이 올바르지 않습니다' });
        }
        
        //2.도메인 형식이 맞지 않는 경우
        const emailDomain = ['naver.com', 'gmail.com', 'hamail.net'];
        let emailOk = 0;
        for (let i of emailDomain) {
            if (existAt[1] === i) {
                emailOk = 1;
            }
        }
        if (!emailOk) {
            return res
                .status(412)
                .json({ errorMessage: '이메일의 형식이 올바르지 않습니다' });
        }

        //닉네임 형식이 비정상적인 경우

        //password 형식이 비정상적인 경우

        //password에 닉네임이 포함되어있는 경우

        // //회원가입
        // const credit = 10; //처음 제공되는 기본 크레딧 값
        // // const newUser = await Users.create({
        // //     email,
        // //     password,
        // //     nickname,
        // //     credit,
        // // });
        return res.status(201).json({ message: '회원가입 성공' });
    } catch (error) {
        return res
            .status(500)
            .json({ errorMessage: '예상하지 못한 서버 문제가 발생했습니다.' });
    }
});

// ◎  로그인 API
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const loginUser = await Users.findOne({
            where: { email },
        });

        //디비에 저장된 이메일이 없거나 패스워드가 틀린 경우
        if (!loginUser || password !== loginUser.password) {
            return res
                .statusMessage(412)
                .json({ errorMessage: '이메일 또는 패스워드를 확인해주세요.' });
        }

        //토큰 보내주기
        const token = jwt.sign({ userId: loginUser.userId }, 'chatGPT_key');
        return res
            .status(200)
            .json({ token: `Bearer ${token}`, message: '로그인 성공' });
    } catch (error) {
        return res
            .status(500)
            .json({ errorMessage: '예상하지 못한 서버 문제가 발생했습니다.' });
    }
});

// ◎  로그아웃 API
router.post('/logout', async (req, res) => {
    res.status(200).json({ message: '로그아웃 성공' });
});

// ◎  credit 확인 API
router.get('/credit', async (req, res) => {
    res.status(200).json({ message: 'api 연결' });
});

module.exports = router;
