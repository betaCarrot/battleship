const SignInForm = (function () {
    // This function initializes the UI
    const initialize = function () {
        // Populate the avatar selection
        Avatar.populate($('#register-avatar'));

        // Hide it
        $('#signin-overlay').hide();

        // Submit event for the signin form
        $('#signin-form').on('submit', (e) => {
            // Do not submit the form
            e.preventDefault();

            // Get the input fields
            const username = $('#signin-username').val().trim();
            const password = $('#signin-password').val().trim();

            // Send a signin request
            Authentication.signin(
                username, password,
                () => {
                    hide();
                    UserPanel.update(Authentication.getUser());
                    UserPanel.show();

                    Socket.connect();
                },
                (error) => {
                    $('#signin-message').text(error);
                });
        });

        // Submit event for the register form
        $('#register-form').on('submit', (e) => {
            // Do not submit the form
            e.preventDefault();

            // Get the input fields
            const username = $('#register-username').val().trim();
            const avatar = $('#register-avatar').val();
            const name = $('#register-name').val().trim();
            const password = $('#register-password').val().trim();
            const confirmPassword = $('#register-confirm').val().trim();

            // Password and confirmation does not match
            if (password != confirmPassword) {
                $('#register-message').text('Passwords do not match.');
                return;
            }

            // Send a register request
            Registration.register(
                username, avatar, name, password,
                () => {
                    $('#register-form').get(0).reset();
                    $('#register-message').text('You can sign in now.');
                },
                (error) => {
                    $('#register-message').text(error);
                });
        });
    };

    // This function shows the form
    const show = function () {
        $('#signin-overlay').fadeIn(500);
    };

    // This function hides the form
    const hide = function () {
        $('#signin-form').get(0).reset();
        $('#signin-message').text('');
        $('#register-message').text('');
        $('#signin-overlay').fadeOut(500);
    };

    return { initialize, show, hide };
})();

const UserPanel = (function () {
    // This function initializes the UI
    const initialize = function () {
        // Hide it
        $('#user-panel').hide();

        // Click event for the signout button
        $('#signout-button').on('click', () => {
            // Send a signout request
            Authentication.signout(() => {
                Socket.disconnect();

                hide();
                SignInForm.show();
            });
        });
    };

    // This function shows the form with the user
    const show = function (user) {
        $('#user-panel').show();
    };

    // This function hides the form
    const hide = function () {
        $('#user-panel').hide();
    };

    // This function updates the user panel
    const update = function (user) {
        if (user) {
            $('#user-panel .user-avatar').html(Avatar.getCode(user.avatar));
            $('#user-panel .user-name').text(user.name);
        } else {
            $('#user-panel .user-avatar').html('');
            $('#user-panel .user-name').text('');
        }
    };

    return { initialize, show, hide, update };
})();

const OnlineUsersPanel = (function () {

    // This function updates the online users panel
    const update = function (onlineUsers) {
        const onlineUsersArea = $('#online-users-area');

        // Clear the online users area
        onlineUsersArea.empty();

        // Get the current user
        const currentUser = Authentication.getUser();

        console.log(onlineUsers);

        // Add the user one-by-one
        for (const username in onlineUsers) {
            if (username != currentUser.username) {
                onlineUsersArea.append(
                    $('<div id=\'username-' + username + '\' class=\'row\'></div>')
                        .append(UI.getUserDisplay(onlineUsers[username])).append($('<span id=\'invite-' + username + '\'></span>')));
                $('#online-users-area').on('click', '#username-' + username, () => {
                    if ($('#invite-' + username).text() == '') {
                        $('#invite-' + username).text('invite sent');
                        Socket.invite(username);
                    }
                });
                if (onlineUsers[username].inGame) {
                    $('#invite-' + username).text('in game');
                }
            }
        }
    };

    // This function adds a user in the panel
    const addUser = function (user) {
        const onlineUsersArea = $('#online-users-area');

        // Find the user
        const userDiv = onlineUsersArea.find('#username-' + user.username);

        // Add the user
        if (userDiv.length == 0) {
            onlineUsersArea.append(
                $('<div id=\'username-' + user.username + '\' class=\'row\'></div>')
                    .append(UI.getUserDisplay(user)).append($('<span id=\'invite-' + user.username + '\'></span>')));
            $('#online-users-area').on('click', '#username-' + user.username, () => {
                if ($('#invite-' + user.username).text() == '') {
                    $('#invite-' + user.username).text('invite sent');
                    Socket.invite(user.username);
                }
            });
        }
    };

    // This function removes a user from the panel
    const removeUser = function (user) {
        const onlineUsersArea = $('#online-users-area');

        // Find the user
        const userDiv = onlineUsersArea.find('#username-' + user.username);

        // Remove the user
        if (userDiv.length > 0) userDiv.remove();
    };

    const processInvite = function (username) {
        if (confirm(username + " is inviting you to a game. Would you like to accept?")) {
            UI.startPreparation(username, false);
            Socket.accept(username);
        }
        else {
            Socket.reject(username);
        }
    }

    const processReject = function (username) {
        $('#invite-' + username).text('invite rejected');
    }

    const setInGame = function (username) {
        $('#invite-' + username).text('in game');
    }

    const hide = function () {
        $('#pairup-overlay').fadeOut(500);
    };

    return { update, addUser, removeUser, processInvite, processReject, setInGame, hide };
})();

const RankingPanel = (function () {

    const initialize = function () {
        $("#proceed-button").on("click", () => {
            Socket.ranking();
        })
        $("#return-button").on("click", () => {
            window.location.reload();
        })
    };

    // This function updates the online users panel
    const update = function (rankedUsers) {
        const RankingTable = $('#table-body');

        RankingTable.empty();

        // Add the user one-by-one
        for (let i = 0; i < rankedUsers.length; i++) {
            const { username, accuracy } = rankedUsers[i];
            if ($('#user-panel .user-name').text() == username) {
                RankingTable.append('<tr class=\'active-row\'><td>' + (i + 1) + '</td><td>' + username + '</td><td>' + accuracy + '%</td>')
            }
            else {
                RankingTable.append('<tr><td>' + (i + 1) + '</td><td>' + username + '</td><td>' + accuracy + '%</td>');
            }
        }
        $("#stats-overlay").hide();
        $("#ranking-overlay").show();
    };

    return { initialize, update };
})();

const UI = (function () {

    const getUserDisplay = function (user) {
        return $('<div class=\'field-content row shadow\'></div>')
            .append(
                $('<span class=\'user-avatar\'>' + Avatar.getCode(user.avatar) +
                    '</span>'))
            .append($('<span class=\'user-name\'>' + user.name + '</span>'));
    };



    SignInForm.initialize();
    UserPanel.initialize();
    RankingPanel.initialize();

    let opponent = null;

    let horizontal = true;

    let ships = [];
    const shots = [];

    let selectedShip = null;
    let selectedShipLength = 0;

    let numPlaced = 0;

    let readied = false;

    let opponentReadied = false;

    let inGame = false;

    let myTurn = false;

    let sunk = 0;

    let targetsHit = 0;

    let missilesLaunched = 0;

    $(".battleship-container").on("click", (event) => {
        selectedShip = "battleship";
        selectedShipLength = 4;
        $(".submarine-container").css("border", "none");
        $(".destroyer-container").css("border", "none");
        $(".battleship-container").css("border", "5px solid red");
        horizontal = true;
    });

    $(".submarine-container").on("click", (event) => {
        selectedShip = "submarine";
        selectedShipLength = 3;
        $(".battleship-container").css("border", "none");
        $(".destroyer-container").css("border", "none");
        $(".submarine-container").css("border", "5px solid red");
        horizontal = true;
    });

    $(".destroyer-container").on("click", (event) => {
        selectedShip = "destroyer";
        selectedShipLength = 2;
        $(".battleship-container").css("border", "none");
        $(".submarine-container").css("border", "none");
        $(".destroyer-container").css("border", "5px solid red");
        horizontal = true;
    });

    function checkEmpty(curr, length) {
        if (length == 0) return true;
        if (curr % 10 > 5 || curr > 60) return false;
        const cell = $("#" + curr);
        if (ships.includes(curr)) return false;
        if (horizontal)
            return checkEmpty(curr + 1, length - 1);
        else
            return checkEmpty(curr + 10, length - 1);
    }

    function occupy(curr, length) {
        if (length == 0) return;
        ships.push(curr);
        const cell = $("#" + curr);
        console.log(selectedShipLength - length);
        cell.css("background-image", "url(images/" + selectedShip + (selectedShipLength - length) + ".png)");
        cell.css("background-size", "cover");
        cell.css("background-color", "blue");
        if (horizontal) {
            cell.css("transform", "rotate(-90deg)");
            occupy(curr + 1, length - 1);
        }
        else {
            occupy(curr + 10, length - 1);
        }
    }

    function indicate(curr, length) {
        if (length == 0) return;
        const cell = $("#" + curr);
        cell.css("background-color", "#FED8B1");
        if (horizontal)
            indicate(curr + 1, length - 1);
        else
            indicate(curr + 10, length - 1);
    }

    function unindicate(curr, length) {
        if (length == 0) return;
        const cell = $("#" + curr);
        cell.css("background-color", "blue");
        if (horizontal)
            unindicate(curr + 1, length - 1);
        else
            unindicate(curr + 10, length - 1);
    }

    function reset() {
        numPlaced = 0;
        ships = [];
        $(".cell").css("background-color", "blue");
        $(".cell").css("background-image", "none");
        $(".battleship-container").show();
        $(".submarine-container").show();
        $(".destroyer-container").show();
        $("#rotate-button").show();
        $("#ready-button").hide();
    }

    function ready() {
        $("#ship-container").hide();
        $("#control-container").hide();
        $("#waiting-message").show();
        readied = true;
        if (opponentReadied) {
            inGame = true;
            startGame();
        }
        Socket.ready(opponent);
    }

    function processReady() {
        if (inGame) return;
        if (readied) {
            inGame = true;
            startGame();
        }
        else {
            opponentReadied = true;
        }
    }

    function startGame() {
        if (myTurn) {
            $("#waiting-message").text("Your turn");
            $("#waiting-message").css("color", "green");
            $("#waiting-message").css("animation", "none");
        } else {
            $("#waiting-message").text("Waiting for opponent...");
            $("#waiting-message").css("color", "red");
            $("#waiting-message").css("animation", "blinker 2s step-start infinite");
            $("#waiting-message").css("animation-delay", "0.75s");
        }
        $("#opponent-panel").show();
    }

    $(".cell").on("click", (event) => {
        if (selectedShip) {
            const id = parseInt(event.target.id);
            if (checkEmpty(id, selectedShipLength)) {
                occupy(id, selectedShipLength);
                numPlaced++;
                $('.' + selectedShip + '-container').css("border", "none");
                $('.' + selectedShip + '-container').hide();
                selectedShip = null;
                horizontal = true;
                if (numPlaced == 3) {
                    $("#rotate-button").hide();
                    $("#ready-button").show();
                }
            }
        }
    })

    $(".cell").on({
        mouseenter: function (event) {
            if (selectedShip) {
                const id = parseInt(event.target.id);
                if (checkEmpty(id, selectedShipLength)) {
                    indicate(id, selectedShipLength);
                }
            }
        },
        mouseleave: function (event) {
            if (selectedShip) {
                const id = parseInt(event.target.id);
                if (checkEmpty(id, selectedShipLength)) {
                    unindicate(id, selectedShipLength);
                }
            }
        }
    });

    $(".cell-opponent").on("click", (event) => {
        const id = parseInt(event.target.id) - 900;
        if (myTurn && !shots.includes(id)) {
            missilesLaunched++;
            console.log("missles", missilesLaunched);
            Socket.shoot(parseInt(event.target.id) - 900);
            myTurn = false;
            $("#waiting-message").text("Waiting for opponent...");
            $("#waiting-message").css("color", "red");
            $("#waiting-message").css("animation", "blinker 2s step-start infinite");
            $("#waiting-message").css("animation-delay", "0.75s");
            shots.push(id);
        }
    });

    $(".cell-opponent").on({
        mouseenter: function (event) {
            const id = parseInt(event.target.id) - 900;
            if (myTurn && !shots.includes(id)) {
                $(event.target).css("background-color", "white");
            }
        },
        mouseleave: function (event) {
            const id = parseInt(event.target.id) - 900;
            if (myTurn && !shots.includes(id)) {
                $(event.target).css("background-color", "blue");
            }
        }
    });

    $("#rotate-button").on("click", () => {
        horizontal = !horizontal;
    });

    $("#reset-button").on("click", reset);

    $("#ready-button").on("click", ready);

    function startPreparation(username, turn) {
        opponent = username;
        myTurn = turn;
    }

    function checkDisconnection(username) {
        if (opponent && opponent == username) {
            alert("Opponent has disconnected");
            window.location.reload();
        }
    }

    function endGame(win) {
        opponent = null;
        $("#waiting-message").text("");
        $("#waiting-message").css("animation", "none");
        if (win) {
            $("#game-result").text("YOU WON!");
            $("#game-result").css("color", "green");
        }
        else {
            $("#game-result").text("YOU LOST...");
            $("#game-result").css("color", "red");
        }
        $("#targets-hit").text(targetsHit);
        $("#missiles-launched").text(missilesLaunched);
        const accuracy = Math.round(targetsHit * 100 / missilesLaunched);
        Socket.insert(accuracy);
        $("#accuracy").text(accuracy + '%');
        $("#stats-overlay").show();
    }

    function updateMyBoard(id) {
        const cell = $("#" + id);
        myTurn = true;
        $("#waiting-message").text("Your turn");
        $("#waiting-message").css("color", "green");
        $("#waiting-message").css("animation", "none");
        if (ships.includes(parseInt(id))) {
            cell.css("background-color", "red");
            cell.append("<iframe src=\"https://giphy.com/embed/VzYcE4FrtkOhhgirkN\" width=\"120%\"height=\"120%\" frameBorder=\"0\" style=\"pointer-events: none;\"></iframe>");
            sunk++;
            if (sunk == 9) {
                endGame(false);
                return "defeat";
            }
            return "hit";
        }
        else {
            cell.css("background-color", "lightblue");
            cell.append("<iframe src=\"https://giphy.com/embed/YOk7USZ9k8yF4R0yn3\" width=\"100%\"height=\"100%\" frameBorder=\"0\" style=\"pointer-events: none;\"></iframe>");
            return "miss";
        }
    }

    function updateOpponentBoard(id, state) {
        const cell = $("#9" + id);
        if (state == "defeat") {
            targetsHit++;
            cell.css("background-color", "red");
            cell.append("<iframe src=\"https://giphy.com/embed/VzYcE4FrtkOhhgirkN\" width=\"120%\"height=\"120%\" frameBorder=\"0\" style=\"pointer-events: none;\"></iframe>");
            $("#result-message").text("Hit!");
            endGame(true);
        }
        else if (state == "hit") {
            targetsHit++;
            cell.css("background-color", "red");
            cell.append("<iframe src=\"https://giphy.com/embed/VzYcE4FrtkOhhgirkN\" width=\"120%\"height=\"120%\" frameBorder=\"0\" style=\"pointer-events: none;\"></iframe>");
            $("#result-message").text("Hit!");
        }
        else {
            cell.css("background-color", "lightblue");
            cell.append("<iframe src=\"https://giphy.com/embed/YOk7USZ9k8yF4R0yn3\" width=\"100%\"height=\"100%\" frameBorder=\"0\" style=\"pointer-events: none;\"></iframe>");
            $("#result-message").text("miss...");
        }
    }

    return { getUserDisplay, startPreparation, processReady, startGame, checkDisconnection, updateMyBoard, updateOpponentBoard };

})();
