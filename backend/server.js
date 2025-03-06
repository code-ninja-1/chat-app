const fs = require("fs");
const cors = require("cors");
const http = require("http");
const WebSocket = require("ws");
const bcrypt = require("bcryptjs");
const express = require("express");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const { MsgType, ChatType } = require("./constants")

const app = express();
const server = http.createServer(app);
const PORT = 5000;
const SECRET_KEY = "MySecretKeyForJWTAuthentication"; // Must be moved to the environment variable

let users = []; // Registered Users List
let clients = new Map(); // Track WebSocket clients
let chatHistory = {
    global: [],
    private: {} // { "user1-user2": [messages] }
};

app.use(cors());
app.use(bodyParser.json());

// Register a new user
app.post("/register", async (req, res) => {
    try {
        const { username, password } = req.body;
        if (users.find((u) => u.username === username)) {
            return res.status(400).json({ message: "Username already exists" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        users.push({ username, password: hashedPassword });
        updateUsers();
        res.json({ message: "User registered" });
    } catch (err) {
        console.error('Error in registering user', err);
        res.status(500).json({});
    }
});

// Login
app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = users.find((u) => u.username === username);
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: "1h" });
        res.json({ token, username });
    } catch (err) {
        console.error('Error in login user', err);
        res.status(500).json({});
    }
});

// WebSocket Server
const wss = new WebSocket.Server({ noServer: true });

wss.on("connection", (ws, req) => {
    const username = ws.username;
    if (!ws.username) {
        console.error("Invalid username, closing connection.");
        ws.close();
        return;
    }

    ws.isAlive = true;
    ws.missedPings = 0;
    clients.set(username, ws);

    console.log(`${username} connected`);

    // Broadcast user joined
    broadcast({ type: MsgType.NOTIFICATION, text: `${username} joined the chat`, username: username });
    broadcastUserList();
    broadcast({ type: MsgType.CHAT_HISTORY, chatType: ChatType.GLOBAL, messages: chatHistory.global });

    ws.on("message", (data) => {
        const msg = JSON.parse(data);
        if (msg.type === MsgType.MESSAGE && msg.chatType === ChatType.GLOBAL) {
            // Broadcast message
            chatHistory.global.push(msg);
            broadcast(msg);
        } else if (msg.type === MsgType.MESSAGE && msg.chatType === ChatType.PRIVATE && msg.recipient) {
            // Private message
            const chatKey = getChatKey(msg.username, msg.recipient);
            if (!chatHistory.private[chatKey]) chatHistory.private[chatKey] = [];
            chatHistory.private[chatKey].push(msg);

            [msg.username, msg.recipient].forEach((user) => {
                if (clients.has(user)) {
                    clients.get(user).send(JSON.stringify(msg));
                }
            });
        } else if (msg.type === MsgType.CHAT_HISTORY && msg.token) {
            // Validate the user's access the chat history
            const decoded = verifyJWT(msg.token);
            if (decoded?.username !== msg.username) {
                console.error("User authentication failed to access chat history");
                return;
            }
            const chatKey = getChatKey(msg.username, msg.recipient);
            broadcast({ type: MsgType.CHAT_HISTORY, chatType: ChatType.PRIVATE, recipient: msg.recipient, messages: chatHistory.private[chatKey] || [] });
        }
    });

    ws.on("pong", () => {
        ws.isAlive = true;
        ws.missedPings = 0;
    });

    ws.on("close", () => {
        clients.delete(username);
        console.log(`${username} disconnected`);
        broadcast({ type: MsgType.NOTIFICATION, text: `${username} left the chat` });
        broadcastUserList();
    });
});

// Ping-pong mechanism for detecting inactive clients
setInterval(() => {
    clients.forEach((ws, username) => {
        if (!ws.isAlive) {
            ws.missedPings++;
            if (ws.missedPings >= 3) {
                console.error(`Removing ${username} due to inactivity.`);
                ws.terminate();
                clients.delete(username);
                broadcast({ type: MsgType.NOTIFICATION, text: `${username} disconnected.` });
                broadcastUserList();
            }
        } else {
            ws.isAlive = false;
            ws.ping();
        }
    });
}, 5000);

// Broadcast the users list to all the clients
function broadcastUserList() {
    const users = [...clients.values()].map(client => client.username);
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: MsgType.USERS, users }));
        }
    });
};

// Broadcast message to all clients
function broadcast(data) {
    clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

// Key to store chat history b/w two users
// Since username doesn't contains any character other than underscore(_)
// We can join the users with hyphen(-)
function getChatKey(user1, user2) {
    return [user1, user2].sort().join("-");
}

// Load the stored users from the JSON
// Improvements: Can be stored in databases
function loadUsers() {
    try {
        if (fs.existsSync('users.json')) {
            const data = fs.readFileSync('users.json', { encoding: 'utf-8' });
            users = JSON.parse(data);
        }
    } catch (err) {
        console.err("Error in loading users", err);
    }
}

// Update the users JSON file
function updateUsers() {
    try {
        fs.writeFileSync('users.json', JSON.stringify(users));
    } catch (err) {
        console.err("Error in updating users", err);
    }
}

// Verify the JWT token
function verifyJWT(token) {
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        return decoded;
    } catch (err) {
        console.error('Error in decoding jwt token', err);
        return null;
    }
}

// Start the server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
    loadUsers();
});

// WebSocket authentication middleware
server.on("upgrade", (request, socket, head) => {
    const token = request.headers["sec-websocket-protocol"];
    if (!token) {
        console.error("No token provided, closing connection.");
        socket.destroy();
        return;
    }
    const decoded = verifyJWT(token);
    if (decoded !== null) {
        wss.handleUpgrade(request, socket, head, (ws) => {
            ws.username = decoded.username;
            wss.emit("connection", ws, request);
        });
    } else {
        socket.destroy();
    }
});
