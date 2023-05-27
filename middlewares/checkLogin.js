const jwt = require("jsonwebtoken");
const { Users } = require("../models");

module.exports = async(req, res, next) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(403).json({ errorMessage: "로그인이 필요한 서비스입니다." });
        }

        const [tokenType, tokenValue] = token.split(" ");
        const { userId } = jwt.verify(tokenValue, "'chatGPT_key");

        const user = await Users.findOne({ where: { userId } });

        if (tokenType !== "Bearer" || !user) {
            return res.status(403).json({ errorMessage: "토큰 정보 오류" });
        }

        res.locals.user = user;
        next();

    } catch (error) {

        return res.status(403).json({ errorMessage: "로그인이 필요한 서비스입니다." });
    }
};