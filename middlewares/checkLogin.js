const jwt = require('jsonwebtoken');
const { Users } = require('../models');

module.exports = async (req, res, next) => {
    try {
        // 헤더 정보 획득
        const Authorization = req.header('Authorization');

        // 헤더에 토큰 값이 있는지 확인
        if (!Authorization) {
            return res
                .status(403)
                .json({ errorMessage: '로그인이 필요한 서비스입니다.' });
        }

        // 헤더 정보 분리
        const [authType, authToken] = Authorization.split(' ');

        //authTyep === Bearer인지 확인
        if (authType !== 'Bearer' || !authToken) {
            return res.status(403).json({ errorMessage: '토큰 정보 오류' });
        }

        // 유저 정보 토큰 검증
        const { userId } = jwt.verify(authToken, 'chatGPT_key');

        // 유저 정보 검색
        const user = await Users.findOne({ where: { userId } });

        // 유저 정보 저장
        res.locals.user = user;

        // 미들웨어 종료
        next();
    } catch (error) {
        return res
            .status(500)
            .json({ errorMessage: '로그인이 필요한 서비스입니다.' });
    }
};
