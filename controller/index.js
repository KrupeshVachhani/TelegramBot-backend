const { handleMessage } = require("./lib/TelegramBot.js");

async function handler(req, res) {
  const { body } = req;
  console.log("body");
  console.log("body", body);
  if (body) {
    const messageObj = body.message;
    await handleMessage(messageObj);
  }
  return;
}

module.exports = {
  handler
};