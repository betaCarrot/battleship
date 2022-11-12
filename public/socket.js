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

        });

        socket.on("target", (json) => {
            const { username, id } = JSON.parse(json);

            if ($('#user-panel .user-name').text() != username) {
                const state = UI.updateMyBoard(id);
                socket.emit("result", JSON.stringify({ username, id, state }));
            }
        })

        socket.on("post result", (json) => {
            const { username, id, state } = JSON.parse(json);
            if ($('#user-panel .user-name').text() == username) {
                UI.updateOpponentBoard(id, state);
            }
        })
    };

    const shoot = function (id) {
        socket.emit("shoot", id);
    }

    // This function disconnects the socket from the server
    const disconnect = function () {
        socket.disconnect();
        socket = null;
    };

    return { getSocket, connect, shoot, disconnect };
})();
