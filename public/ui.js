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

const UI = (function () {

    SignInForm.initialize();
    UserPanel.initialize();

    const ships = [];

    let selectedShip = null;

    $(".setup-ship").on("click", (event) => {
        selectedShip = event.target;
        $(".setup-ship").css("border", "1px solid black");
        $(event.target).css("border", "5px solid red");
    });

    function checkEmpty(curr, length) {
        if (length == 0) return true;
        if (curr % 10 > 5) return false;
        const cell = $("#" + curr);
        console.log(cell.css("background-color"));
        if (cell.css("background-color") == $(selectedShip).css("background-color")) return false;
        return checkEmpty(curr + 1, length - 1);
    }

    function occupy(curr, length) {
        console.log(curr, length);
        if (length == 0) return;
        ships.push(curr);
        const cell = $("#" + curr);
        cell.css("background-color", "orange");
        occupy(curr + 1, length - 1);
    }

    $(".cell").on("click", (event) => {
        if (selectedShip) {
            const length = parseInt(selectedShip.id);
            const id = parseInt(event.target.id);
            if (checkEmpty(id, length)) {
                occupy(id, length);
                $(selectedShip).hide();
                selectedShip = null;
            }
        }
    })

    $(".cell-opponent").on("click", (event) => {
        Socket.shoot(parseInt(event.target.id) - 900);
    });

    function updateMyBoard(id) {
        const cell = $("#" + id);
        if (ships.includes(parseInt(id))) {
            cell.css("background-color", "red");
            return "hit";
        }
        else {
            cell.css("background-color", "lightblue");
            return "miss";
        }
    }

    function updateOpponentBoard(id, state) {
        const cell = $("#9" + id);
        if (state == "hit") {
            cell.css("background-color", "red");
        }
        else {
            cell.css("background-color", "lightblue");
        }
    }

    return { updateMyBoard, updateOpponentBoard };

})();
