import AuthContext from "../context/AuthContext";
import { useSnackbar } from "../context/SnackbarContext";
import { useEffect, useState, useRef, useContext } from "react";

function ChatPage() {
  const [input, setInput] = useState("");
  const [users, setUsers] = useState([]);
  const [chatType, setChatType] = useState("global");
  const [selectedUser, setSelectedUser] = useState(null);
  const [chatHistory, setChatHistory] = useState({ global: [], private: {} });

  const { logout } = useContext(AuthContext);
  const { showSnackbar } = useSnackbar();

  const ws = useRef(null);
  const username = localStorage.getItem("user");

  useEffect(() => {
    const initWebSocketConnection = () => {
      const token = localStorage.getItem("token");
      if(!token) {
        handleLogout();
        return;
      }

      if (ws.current && ws.current.readyState !== WebSocket.CLOSED) {
        return;
      }

      ws.current = new WebSocket("ws://localhost:5000", [token]);
      ws.current.onping = () => {
        ws.pong();
      };

      ws.current.onmessage = (event) => {
        const messageData = JSON.parse(event.data);

        if (messageData.type === "users") {
          setUsers(messageData.users.filter((u) => u !== username));
          return;
        }

        if (messageData.type === "chatHistory") {
          if (messageData.chatType === "global") {
            setChatHistory((prev) => ({ ...prev, global: messageData.messages }));
          } else if (messageData.chatType === "private") {
            setChatHistory((prev) => ({
              ...prev,
              private: { ...prev.private, [messageData.recipient]: messageData.messages },
            }));
          }
          return
        }

        if (messageData.type === "notification") {
          // Hide "User joined" notification for the current user
          if (messageData.username !== username) {
            showSnackbar(messageData.text, "info");
          }
          return;
        }

        // messageData.type === "message"
        if (messageData.chatType === "global") {
          setChatHistory((prev) => ({
            ...prev,
            global: [...prev.global, messageData],
          }));
        } else if (messageData.chatType === "private") {
          const user = (messageData.username === username) ? messageData.recipient : messageData.username;
          setChatHistory((prev) => ({
            ...prev,
            private: {
              ...prev.private,
              [user]: [...(prev.private[user] || []), messageData],
            },
          }));
        }
      };
      
      ws.current.onclose = (event) => {
        console.log("WebSocket closed", event);
        // if the socket connection is closed with an error. Try to reconnect with the server
        if (event.code !== 1000) {
          ws.current = null;
          setTimeout(initWebSocketConnection, 1000);
        }
      }
    }

    initWebSocketConnection();

    return () => {
      if (ws.current) {
        console.log('cleaning up socket connection');
        ws.current.close(1000);
      }
    };
  }, []);

  const sendMessage = () => {
    if (input.trim() && ws.current) {
      const message = {
        type: "message",
        username: username,
        text: input,
        chatType,
        recipient: chatType === "private" ? selectedUser : null,
      };
      ws.current.send(JSON.stringify(message));
      setInput("");
    }
  };

  const switchChat = (type, user = null) => {
    setChatType(type);
    setSelectedUser(user);
    if (type === "private" && user && !chatHistory.private[user]?.length) {
      ws.current.send(JSON.stringify({ type: "chatHistory", username: username, recipient: user, token: localStorage.getItem("token") }));
    }
  };

  const handleLogout = () => {
    logout()
  };

  return (
    <div className="flex h-screen">
      <div className="w-1/4 bg-gray-800 text-white p-4 flex flex-col h-full">
        {/* Users List */}
        <div className="flex-grow">
          <h2 className="text-xl font-bold mb-4">Users</h2>
          <button
            className={`w-full mb-2 py-2 ${chatType === "global" ? "bg-blue-500" : "bg-gray-700"}`}
            onClick={() => switchChat("global")}
          >
            Global Chat
          </button>
          {users.map((u) => (
            <button
              key={u}
              className={`w-full py-2 mb-2 ${selectedUser === u ? "bg-green-500" : "bg-gray-700"}`}
              onClick={() => switchChat("private", u)}
            >
              {u}
            </button>
          ))}
        </div>

        {/* Logout Button */}
        <button
          className="w-full py-2 bg-red-500 hover:bg-red-600 mt-auto"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>

      <div className="w-3/4 flex flex-col p-4">
        <h1 className="text-2xl mb-2">{chatType === "global" ? "Global Chat" : `Chat with ${selectedUser}`}</h1>
        {/* Chat Content */}
        <div className="flex-1 overflow-y-auto bg-blue-200 p-4 rounded">
          {(chatType === "global" ? chatHistory["global"] : chatHistory["private"][selectedUser])?.map((msg, index) => (
            (msg.chatType === chatType || msg.type === "notification") &&
            <div
              key={index}
              className={`flex my-2 ${msg.type === "notification"
                ? "justify-center"
                : msg.username === username
                  ? "justify-end"
                  : "justify-start"
                }`}
            >
              <div
                className={`px-4 py-2 rounded-lg max-w-xs ${msg.type === "notification"
                  ? "bg-yellow-300 text-black"
                  : msg.username === username
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-black"
                  }`}
              >
                <span className="text-xs block text-gray-700">
                  {msg.type === "notification" ? "" : msg.username === username ? "You" : msg.username}
                </span>
                {msg.text}
              </div>
            </div>
          ))}
        </div>
        {/* Chat Input and Send Button */}
        <div className="mt-4 flex">
          <input type="text" className="flex-1 p-2 border rounded-l" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} />
          <button className="w-32 ml-2 bg-blue-500 text-white p-2 rounded-r" onClick={sendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
}

export default ChatPage;