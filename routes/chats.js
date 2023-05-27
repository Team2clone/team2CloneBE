const express = require("express");
const router = express.Router();
const { Users, Chats } = require("../models");
const jwt = require("jsonwebtoken");

// ◎  새 대화 생성
router.post("/chat", async (req, res) => {
  const chat = await Chats.create({ UserId: 3, chatName: "새 대화" });
  res.status(200).json({ message: "대화 생성" });
});

// ◎  전체 대화 목록 조회
router.get("/chat", async (req, res) => {
  res.status(200).json({ message: "api 연결" });
});

// ◎  대화하기
router.post("/chat/:chatid", async (req, res) => {
  res.status(200).json({ message: "대화하기 api 연결" });
});

// ◎  대화내용 조회
router.get("/chat/:chatid", async (req, res) => {
  res.status(200).json({ message: "api 연결" });
});

// ◎  대화 제목 수정
router.put("/chat/:chatid", async (req, res) => {
  res.status(200).json({ message: "api 연결" });
});

// ◎  대화 삭제
router.delete("/chat/:chatid", async (req, res) => {
  res.status(200).json({ message: "api 연결2" });
});

module.exports = router;
