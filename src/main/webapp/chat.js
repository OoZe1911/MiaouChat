function openTab(evt, tabName) {
    console.log("openTab called for:", tabName);
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(tabName).style.display = "block";
    if (evt) {
        evt.currentTarget.className += " active";
    }
}

let socket;

$(document).ready(function() {
    console.log("Document ready");
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    document.getElementById("defaultOpen").click();

	const loc = window.location;
	const wsStart = loc.protocol === 'https:' ? 'wss://' : 'ws://';
	const endPoint = wsStart + loc.host + loc.pathname.replace('chat.html', 'chat');
	socket = new WebSocket(endPoint);

    socket.onopen = function() {
        console.log("WebSocket connection opened");
        socket.send(JSON.stringify({ type: 'connect', username: user.username, age: user.age, gender: user.gender, city: user.city }));
    };

    socket.onmessage = function(event) {
        console.log("Message received:", event.data);
        const msg = JSON.parse(event.data);
        switch (msg.type) {
            case 'userList':
                updateUserList(msg.users);
                break;
            case 'roomList':
                updateRoomList(msg.rooms);
                break;
            case 'roomUsers':
                // Mettre à jour la liste des utilisateurs dans le salon
                break;
            case 'message':
                displayMessage(msg);
                break;
        }
    };

    loadRooms();
    loadUsers();

    function loadRooms() {
        $.get('api/rooms', function(data) {
            console.log("Rooms loaded:", data);
            updateRoomList(data);
        });
    }

    function loadUsers() {
        $.get('api/users', function(data) {
            console.log("Users loaded:", data);
            updateUserList(data);
        });
    }

    function updateRoomList(rooms) {
        $('#roomList').empty();
        rooms.sort((a, b) => a.name.localeCompare(b.name));
        rooms.forEach(function(room) {
            $('#roomList').append('<tr><td><a href="#" class="room-link" data-roomid="' + room.name + '">' + room.name + ' (' + room.users.length + ')</a></td></tr>');
        });

        // Ajouter l'événement de clic aux liens des salons
        $('.room-link').click(function(event) {
            event.preventDefault();
            const roomId = $(this).data('roomid');
            openRoomChatTab(roomId);
            socket.send(JSON.stringify({ type: 'joinRoom', roomName: roomId }));
        });
    }

    function updateUserList(users) {
        $('#userList').empty();
        users.forEach(function(user) {
            const rowClass = user.gender === 'male' ? 'user-male' : 'user-female';
            $('#userList').append(
                '<tr class="' + rowClass + '">' +
                '<td><a href="#" class="user-link" data-username="' + user.username + '">' + user.username + '</a></td>' +
                '<td>' + user.age + '</td>' +
                '<td>' + user.city + '</td>' +
                '</tr>'
            );
        });

        // Ajouter l'événement de clic aux liens des utilisateurs
        $('.user-link').click(function(event) {
            event.preventDefault();
            const username = $(this).data('username');
            openUserChatTab(username);
        });
    }

    function openUserChatTab(username) {
        console.log("Opening chat tab for user:", username);
        const formattedUsername = username.replace(/\s/g, '-');
        // Vérifier si l'onglet existe déjà
        if ($('#tab-' + formattedUsername).length === 0) {
            // Créer un nouvel onglet
            $('.tab').append('<button class="tablinks" onclick="openTab(event, \'' + formattedUsername + '\')" id="tab-' + formattedUsername + '">' + username + ' <svg onclick="closeTab(event, \'' + formattedUsername + '\')" style="width:12px; height:12px; cursor: pointer;"><use href="#icon-close"></use></svg></button>');

            // Créer un nouveau contenu d'onglet
            $('body').append(
                '<div id="' + formattedUsername + '" class="tabcontent">' +
                '<div class="icon-buttons">' +
                '<svg onclick="startWebcam()" style="cursor: pointer;"><use href="#icon-cam"></use></svg>' +
                '<svg onclick="startMicrophone()" style="cursor: pointer;"><use href="#icon-mic"></use></svg>' +
                '<svg onclick="sendFile()" style="cursor: pointer;"><use href="#icon-file"></use></svg>' +
                '<svg onclick="closeTab(event, \'' + formattedUsername + '\')" style="cursor: pointer;"><use href="#icon-close"></use></svg>' +
                '</div>' +
                '<h3>Discussion avec ' + username + '</h3>' +
                '<div class="chat-window" id="chat-' + formattedUsername + '"></div>' +
                '<input type="text" id="message-' + formattedUsername + '" class="message-input" placeholder="Entrez votre message">' +
                '</div>'
            );

            // Ajouter l'événement keypress pour envoyer le message
            $('#message-' + formattedUsername).keypress(function(event) {
                console.log("Key press event in chat input for user:", username, "Key:", event.key);
                if (event.which === 13) {
                    sendMessageToUser(username);
                }
            });
        }

        // Ouvrir l'onglet
        openTab(null, formattedUsername);
    }

    function openRoomChatTab(roomId) {
        console.log("Opening chat tab for room:", roomId);
        const formattedRoomId = roomId.replace(/\s/g, '-');
        // Vérifier si l'onglet existe déjà
        if ($('#tab-room-' + formattedRoomId).length === 0) {
            // Créer un nouvel onglet
            $('.tab').append('<button class="tablinks" onclick="openTab(event, \'room-' + formattedRoomId + '\')" id="tab-room-' + formattedRoomId + '">' + roomId + ' <svg onclick="closeTab(event, \'room-' + formattedRoomId + '\')" style="width:12px; height:12px; cursor: pointer;"><use href="#icon-close"></use></svg></button>');

            // Créer un nouveau contenu d'onglet
            $('body').append(
                '<div id="room-' + formattedRoomId + '" class="tabcontent">' +
                '<div class="icon-buttons">' +
                '<svg onclick="startWebcam()" style="cursor: pointer;"><use href="#icon-cam"></use></svg>' +
                '<svg onclick="startMicrophone()" style="cursor: pointer;"><use href="#icon-mic"></use></svg>' +
                '<svg onclick="sendFile()" style="cursor: pointer;"><use href="#icon-file"></use></svg>' +
                '<svg onclick="closeTab(event, \'room-' + formattedRoomId + '\')" style="cursor: pointer;"><use href="#icon-close"></use></svg>' +
                '</div>' +
                '<h3>Discussion dans ' + roomId + '</h3>' +
                '<div class="chat-window" id="chat-room-' + formattedRoomId + '"></div>' +
                '<input type="text" id="message-room-' + formattedRoomId + '" class="message-input" placeholder="Entrez votre message">' +
                '</div>'
            );

            // Ajouter l'événement keypress pour envoyer le message
            $('#message-room-' + formattedRoomId).keypress(function(event) {
                console.log("Key press event in chat input for room:", roomId, "Key:", event.key);
                if (event.which === 13) {
                    sendMessageToRoom(roomId);
                }
            });
        }

        // Ouvrir l'onglet
        openTab(null, 'room-' + formattedRoomId);
    }

    function displayMessage(msg) {
        console.log("Displaying message:", msg);
        const nameColor = (msg.gender === 'female' ? 'red' : 'blue');
        const fromUser = msg.from ? msg.from.replace(/\s/g, '-') : 'Unknown';
        const roomName = msg.roomName ? msg.roomName.replace(/\s/g, '-') : null;
        const messageHtml = '<p><span style="color:' + nameColor + ';">' + msg.from + '</span>: ' + msg.content + '</p>';
        if (roomName) {
            $('#chat-room-' + roomName).append(messageHtml);
        } else {
            // Vérifier si l'onglet utilisateur existe déjà
            if ($('#chat-' + fromUser).length === 0) {
                openUserChatTab(msg.from);
            }
            $('#chat-' + fromUser).append(messageHtml);
        }
    }

    window.closeTab = function(event, tabName) {
        console.log("Closing tab:", tabName);
        event.stopPropagation();
        const tabContent = $('#' + tabName);
        const tabButton = $('#tab-' + tabName);
        if (tabContent.length) {
            tabContent.remove();
        } else {
            console.log("Tab content not found for:", tabName);
        }
        if (tabButton.length) {
            tabButton.remove();
        } else {
            console.log("Tab button not found for:", tabName);
        }

        // Revenir à l'onglet Accueil si aucun autre onglet n'est ouvert
        if ($('.tablinks.active').length === 0) {
            document.getElementById("defaultOpen").click();
        }
        socket.send(JSON.stringify({ type: 'leaveRoom', roomName: tabName }));
    }

    window.createRoom = function() {
        const roomName = $('#newRoomName').val().trim();
        if (roomName !== '') {
            // Envoyer la demande de création de salon au serveur
            $.post('api/rooms', { name: roomName }, function() {
                console.log("Room created:", roomName);
                loadRooms();
                $('#newRoomName').val('');
            });
        }
    }

    function sendMessageToUser(username) {
        const formattedUsername = username.replace(/\s/g, '-');
        const message = $('#message-' + formattedUsername).val();
        $('#chat-' + formattedUsername).append('<p><span style="color:' + (user.gender === 'female' ? 'red' : 'blue') + ';">' + user.username + '</span>: ' + message + '</p>');
        $('#message-' + formattedUsername).val('');

        // Envoyer le message au serveur via WebSocket
        console.log("Sending message to user:", username, "Message:", message);
        socket.send(JSON.stringify({ type: 'message', from: user.username, to: username, content: message, gender: user.gender }));
    }

    function sendMessageToRoom(roomId) {
        const formattedRoomId = roomId.replace(/\s/g, '-');
        const message = $('#message-room-' + formattedRoomId).val();
        $('#chat-room-' + formattedRoomId).append('<p><span style="color:' + (user.gender === 'female' ? 'red' : 'blue') + ';">' + user.username + '</span>: ' + message + '</p>');
        $('#message-room-' + formattedRoomId).val('');

        // Envoyer le message au serveur via WebSocket
        console.log("Sending message to room:", roomId, "Message:", message);
        socket.send(JSON.stringify({ type: 'message', roomName: roomId, from: user.username, content: message, gender: user.gender }));
    }

    function startWebcam() {
        console.log("Starting webcam");
        alert('Démarrer la webcam');
    }

    function startMicrophone() {
        console.log("Starting microphone");
        alert('Démarrer le micro');
    }

    function sendFile() {
        console.log("Sending file");
        alert('Envoyer un fichier');
    }
});
