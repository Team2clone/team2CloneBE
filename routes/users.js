const express = require('express');
const router = express.Router();
const { Users, Credits } = require('../models');
const jwt = require('jsonwebtoken');
const checkLogin = require('../middlewares/checkLogin.js'); //유저아이디받기
const crypto = require('crypto');
const letter = [
    '.',
    '/',
    '_',
    '+',
    '-',
    '!',
    '~',
    '#',
    '$',
    '%',
    '^',
    '&',
    '*',
    '(',
    ')',
    '=',
    '?',
    '<',
    '>',
    '"',
    "'",
    '`',
    '|',
];

// 응답 객체
class ApiResponse {
    constructor(code, message = '', data = {}) {
        this.code = code;
        this.message = message;
        this.data = data;
    }
}

// ◎  회원가입 API
router.post('/signup', async (req, res) => {
    try {
        const { email, password } = req.body;

        //이메일이 중복된 경우
        const existEmail = await Users.findOne({
            where: { email },
        });
        if (existEmail) {
            const response = new ApiResponse(412, '이미 등록된 이메일입니다.');
            return res.status(412).json(response);
        }

        //이메일 형식이 비정상적인 경우
        const existAt = email.split('@');

        //1.이메일 아이디에 특수기호가 있는경우
        let emailletterOk = 0;
        for (let i of letter) {
            if (existAt[0].split(`${i}`).length > 1) {
                emailletterOk = 1;
            }
        }
        if (emailletterOk) {
            const response = new ApiResponse(
                412,
                '이메일의 형식이 올바르지 않습니다'
            );
            return res.status(412).json(response);
        }

        //2.도메인 형식이 맞지 않는 경우
        const emailDomain = [
            'naver.com',
            'gmail.com',
            'hanmail.net',
            'kakao.com',
        ];
        let emailOk = 0;
        for (let i of emailDomain) {
            if (existAt[1] === i) {
                emailOk = 1;
            }
        }
        if (!emailOk) {
            const response = new ApiResponse(
                412,
                '이메일의 형식이 올바르지 않습니다'
            );
            return res.status(412).json(response);
        }

        //password 형식이 비정상적인 경우
        ///1. password에 특수문자가 한개 이상 포함되지 않은 경우
        let passwordletterOk = 0;
        for (let i of letter) {
            if (password.split(`${i}`).length > 1) {
                passwordletterOk = 1;
            }
        }
        if (!passwordletterOk) {
            const response = new ApiResponse(
                412,
                '1개 이상의 특수문자를 사용하여 password를 설정해야 합니다.'
            );
            return res.status(412).json(response);
        }

        //회원가입
        const credit = 10; //처음 제공되는 기본 크레딧 값
        //비밀번호 암호화
        const crypyedPw = crypto
            .createHash('sha512')
            .update(password)
            .digest('base64');

        const newUser = await Users.create({
            email,
            password: crypyedPw,
        });
        const newUserCredit = await Credits.create({
            credit,
            UserId: newUser.userId,
        });
        const response = new ApiResponse(201, '회원가입 성공');
        return res.status(201).json(response);
    } catch (error) {
        const response = new ApiResponse(
            500,
            '예상하지 못한 서버 문제가 발생했습니다.'
        );
        return res.status(500).json(response);
    }
});

// ◎  로그인 API
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const loginUser = await Users.findOne({
            where: { email },
        });
        //패스워드 암호화
        const crypyedPw = crypto
            .createHash('sha512')
            .update(password)
            .digest('base64');

        //디비에 저장된 이메일이 없거나 패스워드가 틀린 경우
        if (!loginUser || crypyedPw !== loginUser.password) {
            const response = new ApiResponse(
                412,
                '이메일 또는 패스워드를 확인해주세요.'
            );
            return res.status(412).json(response);
        }

        //jwt
        const token = jwt.sign({ userId: loginUser.userId }, 'chatGPT_key', {
            expiresIn: '1d',
        });
        //쿠키보내기
        res.cookie('Authorization', `Bearer ${token}`),
            {
                secure: true,
                maxAge: 3600000,
                httpOnly: true,
                sameSite: 'none',
                domain: '.gptclone.cz',
            };

        //헤더에 JWT 넣기
        res.set({ Authorization: `Bearer ${token}` });

        //토큰보내기
        const response = new ApiResponse(200, '로그인 성공', {
            Authorization: `Bearer ${token}`,
        });
        return res.status(200).json(response);
    } catch (error) {
        const response = new ApiResponse(
            500,
            '예상하지 못한 서버 문제가 발생했습니다.'
        );
        return res.status(500).json(response);
    }
});

// ◎  로그아웃 API
router.post('/logout', checkLogin, async (req, res) => {
    try {
        res.clearCookie('Authorization');
        const response = new ApiResponse(200, '로그아웃 성공');
        return res.status(200).json(response);
    } catch {
        const response = new ApiResponse(
            500,
            '예상하지 못한 서버 문제가 발생했습니다.'
        );
        return res.status(500).json(response);
    }
});

// ◎  credit 확인 API
router.get('/credit', checkLogin, async (req, res) => {
    try {
        const { userId } = res.locals.user;

        const mycredit = await Credits.findOne({
            attributes: ['credit'],
            where: { userId },
        });
        const response = new ApiResponse(200, '', {
            mycredit: mycredit.dataValues.credit,
        });
        return res.status(200).json(response);
    } catch {
        const response = new ApiResponse(500, '크레딧 조회에 실패했습니다');
        return res.status(500).json(response);
    }
});

module.exports = router;
