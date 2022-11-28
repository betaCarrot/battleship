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

            if (Authentication.getUser().username == username) {
                UI.updateMyBoard(id);
            }
        });

        socket.on("post sunk", (json) => {
            const { username, type, locations } = JSON.parse(json);
            if (Authentication.getUser().username == username) {
                UI.showSunk(type, locations);
            }
        });

        socket.on("post cheat sunk", (json) => {
            const { username, type, locations } = JSON.parse(json);
            if (Authentication.getUser().username == username) {
                UI.forceShowSunk(type, locations);
            }
        });

        socket.on("post cheat", (username) => {
            if (Authentication.getUser().username == username) {
                UI.showCheat();
            }
        });

        socket.on("post result", (json) => {
            const { username, id, state } = JSON.parse(json);
            if (Authentication.getUser().username == username) {
                UI.shootMissile(id, state);
            }
        });

        socket.on("post invite", (json) => {
            const { user, target } = JSON.parse(json);
            if (Authentication.getUser().username == target) {
                OnlineUsersPanel.processInvite(user);
            }
        });

        socket.on("post accept", (json) => {
            const { user, target } = JSON.parse(json);
            if (Authentication.getUser().username == target) {
                OnlineUsersPanel.hide();
                UI.postOpponent(user);
                UI.startPreparation(user.username, true);
            }
            else {
                OnlineUsersPanel.setInGame(user.username);
                OnlineUsersPanel.setInGame(target);
            }
        });

        socket.on("post reject", (json) => {
            const { username, target } = JSON.parse(json);
            if (Authentication.getUser().username == target) {
                OnlineUsersPanel.processReject(username);
            }
        });

        socket.on("game unavailable", (username) => {
            if (Authentication.getUser().username == username) {
                alert("This game is no longer available");
                window.location.reload();
            }
        });

        socket.on("post ready", (target) => {
            if (Authentication.getUser().username == target) {
                UI.processReady();
            }
        });

        socket.on("post ranking", (json) => {
            const rankings = JSON.parse(json);
            RankingPanel.update(rankings);
        });

    };

    const shoot = function (username, id) {
        socket.emit("shoot", JSON.stringify({ username, id }));
    }

    const result = function (username, id, state) {
        socket.emit("result", JSON.stringify({ username, id, state }));
    }

    const sunk = function (username, type, locations) {
        socket.emit("sunk", JSON.stringify({ username, type, locations }));
    }

    const cheatSunk = function (username, type, locations) {
        socket.emit("cheat sunk", JSON.stringify({ username, type, locations }));
    }

    const cheat = function (username) {
        socket.emit("cheat", username);
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

    const ready = function (username) {
        socket.emit("ready", username);
    }

    const ranking = function () {
        socket.emit("ranking");
    }

    const insert = function (accuracy) {
        socket.emit("insert", accuracy);
    }

    return { getSocket, connect, shoot, result, sunk, cheatSunk, cheat, disconnect, invite, accept, reject, ready, ranking, insert };
})();
