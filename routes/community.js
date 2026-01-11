const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

const dataPath = path.join(__dirname, "../data/community.json");

function readData() {
  const raw = fs.readFileSync(dataPath);
  return JSON.parse(raw);
}

function writeData(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

router.get("/groups", (req, res) => {
  const data = readData();
  res.json(data.groups);
});

router.post("/groups", (req, res) => {
  const data = readData();
  const newGroup = {
    id: data.groups.length + 1,
    name: req.body.name,
    desc: req.body.desc
  };
  data.groups.push(newGroup);
  writeData(data);
  res.status(201).json(newGroup);
});

router.get("/threads", (req, res) => {
  const data = readData();
  res.json(data.threads);
});

router.post("/threads", (req, res) => {
  const data = readData();
  const newThread = {
    id: data.threads.length + 1,
    title: req.body.title,
    author: req.body.author || "Anonymous",
    replies: 0
  };
  data.threads.push(newThread);
  writeData(data);
  res.status(201).json(newThread);
});

module.exports = router;
