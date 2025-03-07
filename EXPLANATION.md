# Chat Application Documentation

## Overview
This chat application is built with a **Node.js WebSocket backend** and a **React frontend with Tailwind CSS**. The application allows users to register, log in, and communicate in both global and private chat rooms with WebSocket authentication using JWT tokens.

---

## Backend (Node.js with WebSocket)
### Features:
- **User Authentication**: Users can register and log in via REST APIs.
- **JWT Authentication**: WebSocket communication is secured with a JWT token obtained during login.
- **Ping-Pong Mechanism**: Maintains connection stability by handling dead connections and preventing disconnects due to TLS termination (e.g., by a load balancer).
- **Chat History Management**:
  - On WebSocket connection, the server sends the list of users and global chat history.
  - When a private chat history is requested, the server verifies the JWT token and sends only the respective chat history.

### API Endpoints:
#### 1. **User Registration** (`POST /register`)
   - Accepts user details and creates a new account.
   - Stores user credentials securely (hashed passwords).

#### 2. **User Login** (`POST /login`)
   - Authenticates user credentials.
   - Returns a JWT token for further communication.

#### 3. **WebSocket Authentication**
   - Users must provide a valid JWT token when connecting via WebSocket.
   - Token is verified before granting access to chat functionality.

#### 4. **Ping-Pong Mechanism**
   - The server sends periodic ping messages.
   - The client responds with a pong message to keep the connection alive.

#### 5. **Chat Data Handling**
   - Global chat history is sent to users upon connection.
   - Private chat history is provided only upon request, ensuring access is restricted to the relevant users.

---

## Frontend (React with Tailwind CSS)
### Features:
- **Authentication System**:
  - Login and registration forms built using `react-hook-form`.
  - Form validation handled with `yup` resolvers.
- **Routing & Protection**:
  - Only authenticated users can access the chat page (protected via `AuthGuard` and `AuthContext`).
- **Global Notifications**:
  - A `SnackbarContext` is used to display notifications globally.
- **WebSocket Connection Management**:
  - WebSocket connection is established on the chat page.
  - Users can switch between global and private chats.
  - The ping-pong mechanism ensures connection stability.

### Pages:
#### 1. **Login Page**
   - Allows users to enter credentials and log in.
   - Uses `react-hook-form` and `yup` for form validation.

#### 2. **Register Page**
   - Enables new users to create an account.
   - Validates input fields before submission.

#### 3. **Chat Page**
   - Displays global chat and private chat options.
   - WebSocket handles real-time messaging.
   - Users can switch between global and private chats.
   - Authenticated users only (protected via `AuthGuard`).

---

## Conclusion
This chat application is designed to be **secure, scalable, and real-time**. It ensures authenticated communication through JWT, maintains stable WebSocket connections with ping-pong mechanisms, and provides a smooth user experience with a well-structured React frontend.

## Future Improvements
- **Data Storage**: User data is currently stored in a JSON file. Moving to a database (e.g., PostgreSQL, MongoDB) would enhance security and scalability.
- **Chat History Storage**: Chat history is now stored in the server's in-memory storage. Implementing a Redis cache would improve performance and persistence.
- **State Management**: The app currently uses Context API for state management. If needed, Redux can be implemented for more efficient state handling.
- **Token Expiry Handling**: Implementing a refresh token mechanism would improve security by allowing seamless token renewal without requiring frequent logins.
- **Modular Backend Architecture**: The backend can be refactored into separate modules to enhance scalability and maintainability, making it easier to handle more complex features.
- **Notifications**: Notifications can be implemented for new messages in both global and private chats to enhance the user experience.
- **Additional Features**:
  - Message delivery status
  - Improved UI/UX enhancements
