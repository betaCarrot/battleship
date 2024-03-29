const SignInForm = (function () {
    // This function initializes the UI
    const initialize = function () {
        // Populate the avatar selection
        Avatar.populate($('#register-avatar'));

        $("#description-button").on("click", () => {
            $("#rules-overlay").show();
        })

        $("#instruct-button").on("click", () => {
            $("#rules-overlay").hide();
        })

        // Hide it
        $('#signin-overlay').hide();
        $('#rules-overlay').hide();

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
                window.location.reload();
                hide();
                SignInForm.show();
            });
        });

        $('#pairup-button').on('click', () => {
            // Send a signout request
            Authentication.signout(() => {
                Socket.disconnect();
                window.location.reload();
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
        const invitationUsersArea = $('#invitation-users-area');

        // Clear the online users area
        onlineUsersArea.empty();
        invitationUsersArea.empty();

        // Get the current user
        const currentUser = Authentication.getUser();

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

        if (onlineUsersArea.html() == '') {
            onlineUsersArea.text('Waiting for users...');
        }

        if (invitationUsersArea.html() == '') {
            invitationUsersArea.text('Waiting for invitations...');
        }
    };

    // This function adds a user in the panel
    const addUser = function (user) {
        const onlineUsersArea = $('#online-users-area');

        onlineUsersArea.empty();

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
        const invitationUsersArea = $('#invitation-users-area');

        // Find the user
        const userDiv = onlineUsersArea.find('#username-' + user.username);

        // Remove the user
        if (userDiv.length > 0) userDiv.remove();

        const invitationDiv = invitationUsersArea.find('#username-' + user.username);
        if (invitationDiv.length > 0) invitationDiv.remove();

        if (onlineUsersArea.html() == '') {
            onlineUsersArea.text('Waiting for users...');
        }
    };

    const processInvite = function (user) {
        const invitationUsersArea = $('#invitation-users-area');
        invitationUsersArea.empty();
        invitationUsersArea.append(
            $('<div id=\'username-' + user.username + '\' class=\'row\'></div>')
                .append(UI.getUserDisplay(user)).append($('<button class= \'invitation\' id=\'accept-' + user.username + '\'>&#x2705;</button>')).append($('<button class= \'invitation\' id=\'reject-' + user.username + '\'>&#x274C;</button>')));
        $('#invitation-users-area').off('click', '#accept-' + user.username);
        $('#invitation-users-area').on('click', '#accept-' + user.username, () => {
            UI.startPreparation(user.username, false);
            UI.postOpponent(user);
            Socket.accept(user.username);
        });
        $('#invitation-users-area').off('click', '#reject-' + user.username);
        $('#invitation-users-area').on('click', '#reject-' + user.username, () => {
            const invitationDiv = invitationUsersArea.find('#username-' + user.username);
            if (invitationDiv.length > 0) invitationDiv.remove();
            if (invitationUsersArea.html() == '') {
                invitationUsersArea.text('Waiting for invitations...');
            }
            Socket.reject(user.username);
        });
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
            const { username, name, accuracy } = rankedUsers[i];
            if (Authentication.getUser().username == username) {
                RankingTable.append('<tr class=\'active-row\'><td>' + (i + 1) + '</td><td>' + name + '</td><td>' + accuracy + '%</td>')
            }
            else {
                RankingTable.append('<tr><td>' + (i + 1) + '</td><td>' + name + '</td><td>' + accuracy + '%</td>');
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

    let ships = {
        battleship: [],
        submarine: [],
        destroyer: []
    }
    const shots = [];

    let selectedShip = null;
    let selectedShipLength = 0;

    let numPlaced = 0;

    let readied = false;

    let opponentReadied = false;

    let inGame = false;

    let showingRanking = false;

    let myTurn = false;

    let sunk = [];

    let targetsHit = 0;

    let missilesLaunched = 0;

    let needShowSunk = false;
    let sunkType = null;
    let sunkLocations = [];
    let updated = false;

    let cheated = false;

    const sounds = {
        missile: new Audio("audios/missile.wav"),
        explosion: new Audio("audios/explosion.wav"),
        water: new Audio("audios/water.wav"),
        sat: new Audio("audios/sat.wav")
    };

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
        if (Object.values(ships).some(x => x.includes(curr))) return false;
        if (horizontal)
            return checkEmpty(curr + 1, length - 1);
        else
            return checkEmpty(curr + 10, length - 1);
    }

    function occupy(curr, length) {
        if (length == 0) return;
        ships[selectedShip].push(curr);
        const cell = $("#" + curr);
        cell.css("background-image", "url(images/" + selectedShip + (selectedShipLength - length) + ".png)");
        cell.css("background-size", "cover");
        cell.css("background-color", "blue");
        if (horizontal) {
            cell.css("transform", "rotate(-90deg)");
            occupy(curr + 1, length - 1);
        }
        else {
            cell.css("transform", "rotate(0deg)");
            occupy(curr + 10, length - 1);
        }
    }

    function indicate(curr, length, color) {
        if (length == 0) return;
        if (curr % 10 > 5 || curr > 60) return;
        const cell = $("#" + curr);
        cell.css("background-color", color);
        if (horizontal)
            indicate(curr + 1, length - 1, color);
        else
            indicate(curr + 10, length - 1, color);
    }

    function unindicate(curr, length) {
        if (length == 0) return;
        if (curr % 10 > 5 || curr > 60) return;
        const cell = $("#" + curr);
        cell.css("background-color", "blue");
        if (horizontal)
            unindicate(curr + 1, length - 1);
        else
            unindicate(curr + 10, length - 1);
    }

    function reset() {
        numPlaced = 0;
        horizontal = false;
        ships = {
            battleship: [],
            submarine: [],
            destroyer: []
        }
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
        $("#my-info").css("animation", "none");
        $("#opponent-info").css("animation", "blinker 2s step-start infinite");
        $("#waiting-message").text("Waiting for opponent...");
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
        $(".cell-opponent").on("click", (event) => {
            const id = parseInt(event.target.id) - 900;
            if (myTurn && !shots.includes(id)) {
                updated = false;
                missilesLaunched++;
                Socket.shoot(opponent, parseInt(event.target.id) - 900);
                myTurn = false;
                $("#waiting-message").text("Waiting for opponent...");
                $("#waiting-message").css("color", "red");
                $("#my-info").css("animation", "none");
                $("#opponent-info").css("animation", "blinker 2s step-start infinite");
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
        if (myTurn) {
            $("#waiting-message").text("Your turn");
            $("#waiting-message").css("color", "green");
            $("#my-info").css("animation", "blinker 2s step-start infinite");
            $("#opponent-info").css("animation", "none");
        } else {
            $("#waiting-message").text("Waiting for opponent...");
            $("#waiting-message").css("color", "red");
            $("#my-info").css("animation", "none");
            $("#opponent-info").css("animation", "blinker 2s step-start infinite");
        }
        $(document).on("keypress", function (event) {
            event.preventDefault();
            if (event.keyCode == 32) {
                if (opponent && !cheated) {
                    $('#svg2').show();
                    $('#sat').css('animation', 'none');
                    $('#sat').off();
                    const cellS = $("#951");
                    const cellE = $("#915");
                    const dispHS = (cellS.position().left - $('#sat').position().left)
                    const dispVS = (cellS.position().top - $('#sat').position().top);
                    const dispHE = (cellE.position().left - $('#sat').position().left);
                    const dispVE = (cellE.position().top - $('#sat').position().top);
                    Keyframes.define({
                        name: 'sat-animation',
                        from: {
                            transform: 'translate(' + dispHS + 'px,' + dispVS + 'px)'
                        },
                        to: {
                            transform: 'translate(' + dispHE + 'px,' + dispVE + 'px)'
                        }
                    });
                    $('#sat').css('animation', 'sat-animation');
                    $('#sat').css('animation-timing-function', 'linear');
                    $('#sat').css('animation-duration', '1.5s');
                    $('#sat').on('animationstart', () => {
                        sounds.sat.currentTime = 3.0;
                        sounds.sat.play();
                    });
                    $('#sat').on('animationend', () => {
                        $('#svg2').hide();
                        sounds.sat.pause();
                        Socket.cheat(opponent);
                        cheated = true;
                    });
                }
            }
        });
    }

    $("#rotate-button").on("click", () => {
        horizontal = !horizontal;
    });

    $("#reset-button").on("click", reset);

    $("#ready-button").on("click", ready);

    function postOpponent(user) {
        $('.my-avatar').html(Avatar.getCode(Authentication.getUser().avatar));
        $('.my-name').text(Authentication.getUser().name);
        $('.opponent-avatar').html(Avatar.getCode(user.avatar));
        $('.opponent-name').text(user.name);
    }

    function startPreparation(username, turn) {
        sounds.missile.play();
        sounds.missile.pause();
        sounds.explosion.play();
        sounds.explosion.pause();
        sounds.water.play();
        sounds.water.pause();
        sounds.sat.play();
        sounds.sat.pause();
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
                        indicate(id, selectedShipLength, 'lightgreen');
                    }
                    else {
                        indicate(id, selectedShipLength, 'red');
                    }
                }
            },
            mouseleave: function (event) {
                if (selectedShip) {
                    const id = parseInt(event.target.id);
                    unindicate(id, selectedShipLength);
                }
            }
        });
        opponent = username;
        myTurn = turn;
    }

    function checkDisconnection(username) {
        if (!showingRanking && opponent && opponent == username) {
            alert("Opponent has disconnected");
            window.location.reload();
        }
    }

    function endGame(win) {
        inGame = false;
        $("#waiting-message").text("");
        $("#my-info").css("animation", "none");
        $("#opponent-info").css("animation", "none");
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
        showingRanking = true;
    }

    function updateMyBoard(id) {
        const cell = $("#" + id);
        myTurn = true;
        $("#waiting-message").text("Your turn");
        $("#waiting-message").css("color", "green");
        $("#my-info").css("animation", "blinker 2s step-start infinite");
        $("#opponent-info").css("animation", "none");

        for (const [key, value] of Object.entries(ships)) {
            if (value.includes(parseInt(id))) {
                cell.append("<iframe src=\"https://giphy.com/embed/VzYcE4FrtkOhhgirkN\" width=\"120%\"height=\"120%\" frameBorder=\"0\" style=\"pointer-events: none;\"></iframe>");
                sunk.push(id);
                cell.css("background-color", "red");
                if (value.every(x => sunk.includes(x))) {
                    Socket.sunk(opponent, key, value);
                }
                if (sunk.length == 9) {
                    endGame(false);
                    Socket.result(opponent, id, "defeat");
                    return;
                }
                Socket.result(opponent, id, "hit");
                return;
            }
        }

        cell.css("background-color", "lightblue");
        cell.append("<iframe src=\"https://giphy.com/embed/YOk7USZ9k8yF4R0yn3\" width=\"100%\"height=\"100%\" frameBorder=\"0\" style=\"pointer-events: none;\"></iframe>");
        Socket.result(opponent, id, "miss");
    }

    function shootMissile(id, state) {
        $('#svg').show();
        $('#missile').css('animation', 'none');
        $('#missile').off();
        const cell = $("#9" + id);
        const dispH = cell.position().left - $('#missile').position().left;
        const dispV = cell.position().top - $('#missile').position().top;

        Keyframes.define({
            name: 'missile-animation',
            from: {
                transform: 'translate(' + (dispH - 1000) + 'px,' + (dispV + 1000) + 'px)'
            },
            to: {
                transform: 'translate(' + dispH + 'px,' + dispV + 'px)'
            }
        });

        $('#missile').css('animation', 'missile-animation');
        $('#missile').css('animation-timing-function', 'linear');
        $('#missile').css('animation-duration', '1.5s');
        $('#missile').on('animationstart', () => {
            sounds.missile.volume = 0.5;
            sounds.missile.currentTime = 0.75;
            sounds.missile.play();
        });
        $('#missile').on('animationend', () => {
            $('#svg').hide();
            updateOpponentBoard(id, state);
        });
    }

    function updateOpponentBoard(id, state) {
        const cell = $("#9" + id);
        if (state == "defeat") {
            targetsHit++;
            cell.append("<iframe src=\"https://giphy.com/embed/VzYcE4FrtkOhhgirkN\" width=\"120%\"height=\"120%\" frameBorder=\"0\" style=\"pointer-events: none;\"></iframe>");
            sounds.missile.pause();
            sounds.explosion.volume = 0.5;
            sounds.explosion.play();
            $("#result-message").text("Hit!");
            cell.css("background-color", "red");
            if (needShowSunk) {
                sink();
                needShowSunk = false;
            }
            endGame(true);
        }
        else if (state == "hit") {
            targetsHit++;
            cell.append("<iframe src=\"https://giphy.com/embed/VzYcE4FrtkOhhgirkN\" width=\"120%\"height=\"120%\" frameBorder=\"0\" style=\"pointer-events: none;\"></iframe>");
            sounds.missile.pause();
            sounds.explosion.volume = 0.5;
            sounds.explosion.play();
            $("#result-message").text("Hit!");
            cell.css("background-color", "red");
            if (needShowSunk) {
                sink();
                needShowSunk = false;
            }
        }
        else {
            cell.append("<iframe src=\"https://giphy.com/embed/YOk7USZ9k8yF4R0yn3\" width=\"100%\"height=\"100%\" frameBorder=\"0\" style=\"pointer-events: none;\"></iframe>");
            sounds.missile.pause();
            sounds.water.play();
            $("#result-message").text("miss...");
            cell.css("background-color", "lightblue");
        }

    }

    function sink() {
        let curr = 0;
        sunkLocations.forEach(id => {
            const cell = $("#9" + id);
            cell.css("background-image", "url(images/" + sunkType + curr + ".png)");
            cell.css("background-size", "cover");
            if (sunkLocations[1] - sunkLocations[0] == 1) {
                cell.css("transform", "rotate(-90deg)");
            }
            curr++;
        })
    }

    function forceShowSunk(type, locations) {
        let curr = 0;
        locations.forEach(id => {
            const cell = $("#9" + id);
            cell.css("background-image", "url(images/" + type + curr + ".png)");
            cell.css("background-size", "cover");
            if (locations[1] - locations[0] == 1) {
                cell.css("transform", "rotate(-90deg)");
            }
            curr++;
        })
    }

    function showSunk(type, locations) {
        sunkType = type;
        sunkLocations = locations;
        if (updated) {
            sink();
        }
        else {
            needShowSunk = true;
        }
    }

    function showCheat() {
        Object.entries(ships).forEach(([key, value]) => {
            Socket.cheatSunk(opponent, key, value);
        });
    }

    function getSound() {
        return sounds;
    }

    return { getUserDisplay, startPreparation, postOpponent, processReady, checkDisconnection, updateMyBoard, shootMissile, updateOpponentBoard, forceShowSunk, showSunk, showCheat, getSound };

})();
