const env = require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();
const { Users } = require('./models');

const indexRouter = require('./routes/index.js');
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// CORS 미들웨어 함수 정의
const allowCrossDomain = (req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Content-Type, withcredentials');
    // preflight 요청에 대한 처리
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Origin', req.headers.origin);
        res.sendStatus(200);
    } else {
        next();
    }
};

// CORS 미들웨어 사용
app.use(allowCrossDomain);
app.use('/api', indexRouter);
app.get('/', (req, res) => {
    res.status(200).send('chatGPT clone API');
});

app.listen(3001, () => {
    console.log('3001 포트로 서버 연결');
});

// ❖ 24시간마다 모든유저 크레딧 10개로 갱신
const intervalID = setInterval(myCallback, 86400000);

async function myCallback() {
    await Users.update({ credit: 10 }, { where: {} });
}
