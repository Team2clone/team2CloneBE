const express = require("express");
const router = express.Router();
const { Users, Models } = require("../models");
const jwt = require("jsonwebtoken");

// ◎  회원가입 API
router.post("/signup", async (req, res) => {
  const chat = await Users.create({
    email: "email2@adress.com",
    nickname: "mynick2",
    password: "asdf1234",
    credit: 3,
  });

  res.status(200).json({ message: "api 연결" });
});

// ◎  로그인 API
router.post("/login", async (req, res) => {
  res.status(200).json({ message: "api 연결" });
});

// ◎  로그아웃 API
router.post("/logout", async (req, res) => {
  res.status(200).json({ message: "api 연결" });
});

// ◎  credit 확인 API
router.get("/credit", async (req, res) => {
  res.status(200).json({ message: "api 연결" });
});

module.exports = router;
