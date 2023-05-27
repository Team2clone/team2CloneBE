const env = require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();

const indexRouter = require("./routes/index.js");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use("/api", [indexRouter]);

app.get("/", (req, res) => {
  res.status(200).send("chatGPT clone API");
});

app.listen(3001, () => {
  console.log("3001 포트로 서버 연결");
});
