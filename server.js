require("dotenv").config({ path: __dirname + "/.env" });
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require("twilio")(accountSid, authToken, {
    lazyLoading: true,
});
const bodyParser = require("body-parser");
const express = require("express");

const app = express();
const serverRouter = express.Router();

const surgeUrl = "https://yugams-whatsapp-bot.surge.sh";

// VARIABLES
let board = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣"];
let stepCount = 1;
let isGameOn = false;
let isNumInput = false;
let pos;
let sign = "❌";
let player1;
let player2;
let currentPlayer;
const messageBoard = (board) => {
    return `
${board[0]} ${board[1]} ${board[2]}
${board[3]} ${board[4]} ${board[5]}
${board[6]} ${board[7]} ${board[8]}
`;
};

const resetGame = () => {
    stepCount = 1;
    isGameOn = false;
    board = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣"];
};

const calculateWinner = (board) => {
    const lines = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
    ];
    for (let i = 0; i < lines.length; i++) {
        const [a, b, c] = lines[i];
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return {
                isWinner: true,
                winner: board[a],
                winningSquares: [a, b, c],
            };
        }
    }
    return {
        isWinner: false,
        winner: null,
        winningSquares: [],
    };
};

app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);

app.use(bodyParser.json());

app.get("/", (req, res) => {
    res.send("Yugam's WhatsApp Bot...in making");
});

serverRouter
    .route("/")
    .get((req, res) => {
        res.send("Can POST requests here");
    })

    .post(async (req, res) => {
        const sendMessage = (reply, toUser) => {
            client.messages
                .create({
                    body: reply,
                    from: process.env.WHATSAPP_NUMBER,
                    to: toUser,
                })
                .then((message) =>
                    console.log(`Replied to ${toUser}: ${reply}`)
                )
                .done();
        };

        const message = req.body.Body;
        const toUser = req.body.From;
        console.log(`${toUser}: ${message}`);

        // TIC TAC TOE GAME

        const startGame = async (player1, player2, sendMessage) => {
            isGameOn = true;

            sendMessage(
                `You ${sign} go first!
Enter a number b/w 1 and 9 to play.`,
                player1
            );
            sendMessage(
                `Your opponent ${sign} goes first!
                Enter a number b/w 1 and 9 to play.`,
                player2
            );
            await sendMessage(messageBoard(board), player1);
            await sendMessage(messageBoard(board), player2);
        };

        const game = async (pos, sendMessage) => {
            if (stepCount < 10) {
                if (
                    board[Number(pos) - 1] === "❌" ||
                    board[Number(pos) - 1] === "⭕"
                ) {
                    await sendMessage(
                        "That square is already filled! Please enter another number.",
                        player1
                    );
                    await sendMessage(
                        "That square is already filled! Please enter another number.",
                        player2
                    );
                    return;
                }

                if (currentPlayer === toUser) {
                    board[Number(pos) - 1] = sign;
                } else {
                    await sendMessage(
                        `It's your opponent ${sign}'s turn.`,
                        toUser
                    );
                    return;
                }

                const { isWinner, winner, winningSquares } =
                    calculateWinner(board);

                if (isWinner) {
                    await sendMessage(`${winner} Won!`, player1);
                    sendMessage(messageBoard(board), player1);
                    await sendMessage(`${winner} Won!`, player2);
                    sendMessage(messageBoard(board), player2);
                    resetGame();
                    return;
                }

                await sendMessage(messageBoard(board), player1);
                await sendMessage(messageBoard(board), player2);

                stepCount++;
                currentPlayer = currentPlayer === player1 ? player2 : player1;
                sign = sign === "❌" ? "⭕" : "❌";

                if (stepCount === 10) {
                    if (!isWinner) {
                        await sendMessage("You both tied!", player1);
                        await sendMessage("You both tied!", player2);
                    }
                    resetGame();
                }
            }
        };

        // REPLIES

        if (!isGameOn && message.includes("Start")) {
            player1 = toUser;
            player2 = "whatsapp:" + message.split("Start ")[1].split(" ")[0];
            currentPlayer = player1;

            startGame(player1, player2, sendMessage);
        }

        if (isGameOn && [1, 2, 3, 4, 5, 6, 7, 8, 9].includes(Number(message))) {
            pos = message;
            isNumInput = true;
            game(pos, sendMessage); // player1 starts
        }

        if (isGameOn && message.includes("Exit")) {
            resetGame();
        }

        if (message.includes("isGameOn")) {
            console.log(isGameOn);
        }
    });

app.use("/server", serverRouter);

app.listen(5000, () => {
    console.log("Server running at 5000");
});
