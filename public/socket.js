const Socket = (function () {
    // This stores the current Socket.IO socket
    let socket = null;

    // This function gets the socket from the module
    const getSocket = function () {
        return socket;
    };

    // This function connects the server and initializes the socket
    const connect = function () {
        socket = io();

        // Wait for the socket to connect successfully
        socket.on("connect", () => {
            socket.emit("get users");
        });

        // Set up the users event
        socket.on("users", (onlineUsers) => {
            onlineUsers = JSON.parse(onlineUsers);

            // Show the online users
            OnlineUsersPanel.update(onlineUsers);
        });

        // Set up the add user event
        socket.on("add user", (user) => {
            user = JSON.parse(user);

            // Add the online user
            OnlineUsersPanel.addUser(user);
        });

        // Set up the remove user event
        socket.on("remove user", (user) => {
            user = JSON.parse(user);

            const { username } = user;

            // Remove the online user
            OnlineUsersPanel.removeUser(user);
            UI.checkDisconnection(username);
        });

        socket.on("target", (json) => {
            const { username, id } = JSON.parse(json);

            if ($('#user-panel .user-name').text() != username) {
                const state = UI.updateMyBoard(id);
                socket.emit("result", JSON.stringify({ username, id, state }));
            }
        });

        socket.on("post result", (json) => {
            const { username, id, state } = JSON.parse(json);
            if ($('#user-panel .user-name').text() == username) {
                UI.updateOpponentBoard(id, state);
            }
        });

        socket.on("post invite", (json) => {
            const { username, target } = JSON.parse(json);
            if ($('#user-panel .user-name').text() == target) {
                OnlineUsersPanel.processInvite(username);
            }
        });

        socket.on("post accept", (json) => {
            const { username, target } = JSON.parse(json);
            if ($('#user-panel .user-name').text() == target) {
                OnlineUsersPanel.hide();
                UI.startGame(username);
            }
            else {
                OnlineUsersPanel.setInGame(username);
                OnlineUsersPanel.setInGame(target);
            }
        });

        socket.on("post reject", (json) => {
            const { username, target } = JSON.parse(json);
            if ($('#user-panel .user-name').text() == target) {
                OnlineUsersPanel.processReject(username);
            }
        });

        socket.on("game unavailable", (username) => {
            if ($('#user-panel .user-name').text() == username) {
                alert("This game is no longer available");
            }
        });

    };

    const shoot = function (id) {
        socket.emit("shoot", id);
    }

    // This function disconnects the socket from the server
    const disconnect = function () {
        socket.disconnect();
        socket = null;
    };

    const invite = function (username) {
        socket.emit("invite", username);
    }

    const accept = function (username) {
        OnlineUsersPanel.hide();
        socket.emit("accept", username);
    }

    const reject = function (username) {
        socket.emit("reject", username);
    }

    return { getSocket, connect, shoot, disconnect, invite, accept, reject };
})();
