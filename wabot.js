require("dotenv").config({ path: __dirname + "/.env" });
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require("twilio")(accountSid, authToken, {
  lazyLoading: true,
});
const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});

const surgeUrl = "https://yugams-whatsapp-bot.surge.sh"

readline.question("Enter a message: ", (message) => {
  console.log("sending message...");

  client.messages
    .create({
      body: message,
    //   mediaUrl: [surgeUrl + "/img.jpg", surgeUrl + "/ZOMBIFIED.mp3"],
	  statusCallback: surgeUrl,
      from: process.env.TWILIO,
      to: process.env.YUGAM,
    })
    .then((message) => console.log(`message sent: ${message.sid}`))
    .done();

  readline.close();
});
