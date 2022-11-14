const express = require("express");

const bcrypt = require("bcrypt");
const fs = require("fs");
const session = require("express-session");

// Create the Express app
const app = express();

// Use the 'public' folder to serve static files
app.use(express.static("public"));

// Use the json middleware to parse JSON data
app.use(express.json());

// Use the session middleware to maintain sessions
const chatSession = session({
    secret: "game",
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
        maxAge: 300000
    }
});
app.use(chatSession);

// This helper function checks whether the text only contains word characters
function containWordCharsOnly(text) {
    return /^\w+$/.test(text);
}
// Handle the /register endpoint
app.post("/register", (req, res) => {
    // Get the JSON data from the body
    const { username, avatar, name, password
    } = req.body;
    //
    // D. Reading the users.json file
    //
    const users = JSON.parse(fs.readFileSync("data/users.json"));
    //
    // E. Checking for the user data correctness
    //
    if (!username || !avatar || !name || !password) {
        res.json({
            status: "error", error: "Username/avatar/name/password cannot be empty."
        });
        return;
    }
    if (!containWordCharsOnly(username)) {
        res.json({
            status: "error", error: "Username can only contain underscores, letters, or numbers."
        });
        return;
    }
    if (username in users) {
        res.json({
            status: "error", error: "Username has already been used."
        });
        return;
    }
    //
    // G. Adding the new user account
    //
    const hash = bcrypt.hashSync(password,
        10);
    users[username
    ] = {
        avatar, name, password: hash
    };
    //
    // H. Saving the users.json file
    //
    fs.writeFileSync("data/users.json", JSON.stringify(users,
        null,
        " "));
    //
    // I. Sending a success response to the browser
    //
    res.json({
        status: "success"
    });
    // Delete when appropriate
});

// Handle the /signin endpoint
app.post("/signin", (req, res) => {
    // Get the JSON data from the body
    const { username, password
    } = req.body;

    //
    // D. Reading the users.json file
    //
    const users = JSON.parse(fs.readFileSync("data/users.json"));
    //
    // E. Checking for username/password
    //
    if (!(username in users)) {
        res.json({
            status: "error", error: "Username does not exist."
        });
        return;
    }
    const hashedPassword = users[username
    ].password;
    if (!bcrypt.compareSync(password, hashedPassword)) {
        res.json({
            status: "error", error: "Password does not mach."
        });
        return;
    }
    //
    // G. Sending a success response with the user account
    //
    const { u, avatar, name, p
    } = users[username
        ];
    req.session.user = {
        username, avatar, name
    };
    res.json({
        status: "success", user: {
            username, avatar, name
        }
    });
    // Delete when appropriate
});

// Handle the /validate endpoint
app.get("/validate", (req, res) => {
    //
    // B. Getting req.session.user
    //
    if (!req.session.user) {
        res.json({
            status: "error", error: "You have not signed in."
        });
        return;
    }
    //
    // D. Sending a success response with the user account
    //
    res.json({
        status: "success", user: req.session.user
    });
    // Delete when appropriate
});

// Handle the /signout endpoint
app.get("/signout", (req, res) => {
    //
    // Deleting req.session.user
    //
    delete req.session.user;
    //
    // Sending a success response
    //
    res.json({
        status: "success"
    });
    // Delete when appropriate
});

const { createServer } = require("http");
const { Server } = require("socket.io");
const httpServer = createServer(app);
const io = new Server(httpServer);

const onlineUsers = {};
const inGameUsers = {};

io.on("connection", (socket) => {
    if (socket.request.session.user) {
        const { username, avatar, name } = socket.request.session.user;
        onlineUsers[username] = { avatar, name, inGame: false };
        io.emit("add user", JSON.stringify(socket.request.session.user));
    }

    socket.on("disconnect", () => {
        if (socket.request.session.user) {
            const { username } = socket.request.session.user;
            if (onlineUsers[username]) delete onlineUsers[username];
            io.emit("remove user", JSON.stringify(socket.request.session.user));
        }
    });

    socket.on("get users", () => {
        socket.emit("users", JSON.stringify(onlineUsers));
    });

    socket.on("shoot", (id) => {
        const { username } = socket.request.session.user;
        io.emit("target", JSON.stringify({ username, id: id }));
    });

    socket.on("result", (res) => {
        io.emit("post result", res);
    });

    socket.on("invite", (target) => {
        const { username } = socket.request.session.user;
        io.emit("post invite", JSON.stringify({ username, target: target }));
    });

    socket.on("accept", (target) => {
        const { username } = socket.request.session.user;
        if (onlineUsers[username] && onlineUsers[target] && !onlineUsers[username].inGame && !onlineUsers[target].inGame) {
            onlineUsers[username].inGame = true;
            onlineUsers[target].inGame = true;
            io.emit("post accept", JSON.stringify({ username, target }));
        }
        else {
            io.emit("game unavailable", username);
        }
    });

    socket.on("reject", (target) => {
        const { username } = socket.request.session.user;
        io.emit("post reject", JSON.stringify({ username, target }));
    });

    socket.on('ready', (target) => {
        io.emit("post ready", target);
    });

    socket.on("ranking", () => {
        const rankings = JSON.parse(fs.readFileSync("data/ranking.json"));
        socket.emit("post ranking", JSON.stringify(rankings));
    });

    socket.on('insert', (str) => {
        const rankings = JSON.parse(fs.readFileSync("data/ranking.json"));
        const { username } = socket.request.session.user;
        const accuracy = parseInt(str);
        const existing = rankings.find(r => r.username == username);
        const rest = rankings.filter(r => r.username != username);
        if (existing == undefined || existing.accuracy < accuracy) {
            const entry = { username, accuracy: accuracy };
            rest.push(entry);
            rest.sort((a, b) => b.accuracy - a.accuracy);
            fs.writeFileSync("data/ranking.json", JSON.stringify(rest, null, " "));
        }
    });
});

io.use((socket, next) => {
    chatSession(socket.request,
        {}, next);
});

httpServer.listen(8000, () => {
    console.log("The game server has started...");
});
