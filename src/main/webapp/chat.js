// Fonction pour faire défiler vers le bas
function scrollToBottom(element) {
    if (element) {
        element.scrollTop = element.scrollHeight;
    }
}

// Fonction pour ouvrir un onglet
function openTab(evt, tabName) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "").replace(" notification", "");
    }
    document.getElementById(tabName).style.display = "block";
    if (evt) {
        evt.currentTarget.className += " active";
    }
    
    // Définir le focus sur le champ de saisie de message
    const messageInput = document.querySelector('#' + tabName + ' .message-input');
    if (messageInput) {
        messageInput.focus();
    }

    // Faire défiler automatiquement vers le bas
    const chatWindow = document.querySelector('#' + tabName + ' .chat-window');
    if (chatWindow) {
        setTimeout(() => {
            scrollToBottom(chatWindow);
        }, 0);
    }
}

let socket;

$(document).ready(function() {
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
        socket.send(JSON.stringify({ type: 'connect', username: user.username, age: user.age, gender: user.gender, city: user.city }));
        
        // Envoyer un ping toutes les 60 secondes pour garder la connexion WebSocket ouverte
        setInterval(() => {
            socket.send(JSON.stringify({ type: 'ping' }));
        }, 60000);
    };

    socket.onmessage = function(event) {
        const msg = JSON.parse(event.data);
        switch (msg.type) {
            case 'userList':
                updateUserList(msg.users);
                break;
            case 'roomList':
                updateRoomList(msg.rooms);
                break;
            case 'roomUsers':
                updateRoomUserList(msg.roomName, msg.users);
                break;
            case 'message':
                displayMessage(msg);
                break;
            case 'ping':
                // Ignorer les messages de type 'ping'
                break;
        }
    };

    function updateRoomList(rooms) {
        $('#roomList').empty();
        rooms.sort((a, b) => a.name.localeCompare(b.name));
        rooms.forEach(function(room) {
            $('#roomList').append('<tr><td><a href="#" class="room-link" data-roomid="' + room.name + '">' + room.name + ' (' + room.userCount + ')</a></td></tr>');
        });

        // Ajouter l'événement de clic aux liens des salons
        $('.room-link').click(function(event) {
            event.preventDefault();
            const roomId = $(this).data('roomid');
            openRoomChatTab(roomId);
            socket.send(JSON.stringify({ type: 'joinRoom', roomName: roomId, username: user.username }));
        });
    }

	function updateUserList(users) {
	    $('#userList').empty();
	    
	    let maleCount = 0;
	    let femaleCount = 0;
	    
	    users.forEach(function(user) {
	        const rowClass = user.gender === 'male' ? 'user-male' : 'user-female';
	        if (user.gender === 'male') {
	            maleCount++;
	        } else {
	            femaleCount++;
	        }
	        $('#userList').append(
	            '<tr class="' + rowClass + '">' +
	            '<td><a href="#" class="user-link" data-username="' + user.username + '">' + user.username + '</a></td>' +
	            '<td>' + user.age + '</td>' +
	            '<td>' + user.city + '</td>' +
	            '</tr>'
	        );
	    });

	    // Mise à jour du texte avec le nombre d'hommes et de femmes connectés
	    $('#userCount').html(`Utilisateurs Connectés (<span style="color: blue;">hommes : </span>${maleCount} / <span style="color: red;">femmes : </span>${femaleCount}) :`);

	    // Ajouter l'événement de clic aux liens des utilisateurs
	    $('.user-link').click(function(event) {
	        event.preventDefault();
	        const username = $(this).data('username');
	        openUserChatTab(username);
	    });
	}


    function updateRoomUserList(roomName, users) {
        const formattedRoomName = roomName.replace(/\s/g, '-');
        const userListContainer = $('#room-users-' + formattedRoomName);
        userListContainer.empty();
        users.forEach(function(user) {
            const rowClass = user.gender === 'male' ? 'user-male' : 'user-female';
            userListContainer.append(
                '<tr class="' + rowClass + '">' +
                '<td>' + user.username + '</td>' +
                '<td>' + user.age + '</td>' +
                '<td>' + user.city + '</td>' +
                '</tr>'
            );
        });
    }

    function openUserChatTab(username, makeActive = true) {
        const formattedUsername = username.replace(/\s/g, '-');
        // Vérifier si l'onglet existe déjà
        if ($('#tab-' + formattedUsername).length === 0) {
            // Récupérer les informations de l'utilisateur depuis la liste des utilisateurs
            const userElement = $(`a.user-link[data-username="${username}"]`).closest('tr');
            const age = userElement.find('td:eq(1)').text();
            const city = userElement.find('td:eq(2)').text();
            const gender = userElement.hasClass('user-female') ? 'female' : 'male';

            const titleColor = gender === 'female' ? 'red' : 'blue';
            const pageTitle = `<span style="color: ${titleColor};">${username}</span> / ${age} ans / ${city}`;

            // Créer un nouvel onglet avec juste le nom de l'utilisateur
            $('.tab').append('<button class="tablinks" onclick="openTab(event, \'' + formattedUsername + '\')" id="tab-' + formattedUsername + '">' + username + ' <svg onclick="closeTab(event, \'' + formattedUsername + '\')" style="width:12px; height:12px; cursor: pointer;"><use href="#icon-close"></use></svg></button>');

            // Créer un nouveau contenu d'onglet
            $('body').append(
                '<div id="' + formattedUsername + '" class="tabcontent">' +
                '<div class="icon-buttons">' +
                '<svg onclick="startWebcam()" style="cursor: pointer;color: #CCCCCC;"><use href="#icon-cam" fill="#cccccc"></use></svg>' +
                '<svg onclick="startMicrophone()" style="cursor: pointer;"><use href="#icon-mic" fill="#cccccc"></use></svg>' +
                '<svg onclick="sendFile()" style="cursor: pointer;"><use href="#icon-file" fill="#cccccc"></use></svg>' +
                '<svg onclick="closeTab(event, \'' + formattedUsername + '\')" style="cursor: pointer;"><use href="#icon-close"></use></svg>' +
                '</div>' +
                '<h3>Discussion avec ' + pageTitle + '</h3>' +
                '<div class="chat-window" id="chat-' + formattedUsername + '"></div>' +
                '<input type="text" id="message-' + formattedUsername + '" class="message-input" placeholder="Entrez votre message">' +
                '</div>'
            );

            // Ajouter l'événement keypress pour envoyer le message
            $('#message-' + formattedUsername).keypress(function(event) {
                if (event.which === 13) {
                    sendMessageToUser(username);
                }
            });
        }

		// Ouvrir l'onglet si nécessaire
		if (makeActive) {
		     openTab(null, formattedUsername);
			$('#tab-' + formattedUsername).addClass('active');
		 } else {
		     $('#tab-' + formattedUsername).addClass('notification');
		 }
    }

    function openRoomChatTab(roomId) {
        const formattedRoomId = roomId.replace(/\s/g, '-');
        // Vérifier si l'onglet existe déjà
        if ($('#tab-room-' + formattedRoomId).length === 0) {
            // Créer un nouvel onglet
            $('.tab').append('<button class="tablinks" onclick="openTab(event, \'room-' + formattedRoomId + '\')" id="tab-room-' + formattedRoomId + '">' + roomId + ' <svg onclick="closeTab(event, \'room-' + formattedRoomId + '\')" style="width:12px; height:12px; cursor: pointer;"><use href="#icon-close"></use></svg></button>');

            // Créer un nouveau contenu d'onglet avec la zone utilisateur à droite
            $('body').append(
                '<div id="room-' + formattedRoomId + '" class="tabcontent">' +
                '<div class="icon-buttons">' +
                '<svg onclick="startWebcam()" style="cursor: pointer;"><use href="#icon-cam" fill="#cccccc"></use></svg>' +
                '<svg onclick="startMicrophone()" style="cursor: pointer;"><use href="#icon-mic" fill="#cccccc"></use></svg>' +
                '<svg onclick="sendFile()" style="cursor: pointer;"><use href="#icon-file" fill="#cccccc"></use></svg>' +
                '<svg onclick="closeTab(event, \'room-' + formattedRoomId + '\')" style="cursor: pointer;"><use href="#icon-close"></use></svg>' +
                '</div>' +
                '<div class="chat-room-container">' +
                '<div class="chat-window" id="chat-room-' + formattedRoomId + '"></div>' +
                '<div class="room-user-list">' +
                '<table class="user-table" id="room-users-' + formattedRoomId + '"></table>' +
                '</div>' +
                '</div>' +
                '<input type="text" id="message-room-' + formattedRoomId + '" class="message-input" placeholder="Entrez votre message">' +
                '</div>'
            );

            // Ajouter l'événement keypress pour envoyer le message
            $('#message-room-' + formattedRoomId).keypress(function(event) {
                if (event.which === 13) {
                    sendMessageToRoom(roomId);
                }
            });
        }

        // Ouvrir l'onglet
        openTab(null, 'room-' + formattedRoomId);
        $('#tab-room-' + formattedRoomId).addClass('active');
    }

	function displayMessage(msg) {
	    const nameColor = (msg.gender === 'female' ? 'red' : 'blue');
	    const fromUser = msg.from ? msg.from.replace(/\s/g, '-') : 'Unknown';
	    const roomName = msg.roomName ? msg.roomName.replace(/\s/g, '-') : null;
	    const messageHtml = '<p><span style="color:' + nameColor + ';">' + msg.from + '</span>: ' + msg.content + '</p>';

	    if (roomName) {
	        const chatWindowId = '#chat-room-' + roomName;
	        $(chatWindowId).append(messageHtml);
	        scrollToBottom(document.getElementById('chat-room-' + roomName));

	        // Ajouter la classe de notification si l'utilisateur n'est pas dans cet onglet
	        if (!$(`#tab-room-${roomName}`).hasClass('active')) {
	            $(`#tab-room-${roomName}`).addClass('notification');
	        }
	    } else {
	        const chatWindowId = '#chat-' + fromUser;
	        const chatWindow = $(chatWindowId);
	        const tabExists = chatWindow.length > 0;

	        if (!tabExists) {
	            openUserChatTab(msg.from, false);
	        }

	        $(chatWindowId).append(messageHtml);

	        if ($(chatWindowId).is(':visible')) {
	            scrollToBottom(chatWindow[0]);
	        } else {
	            $('#tab-' + fromUser).addClass('notification');
	        }
	    }
	}


    window.closeTab = function(event, tabName) {
        event.stopPropagation();
        const tabContent = $('#' + tabName);
        const tabButton = $('#tab-' + tabName);
        if (tabContent.length) {
            tabContent.remove();
        }
        if (tabButton.length) {
            tabButton.remove();
        }

        // Revenir à l'onglet Accueil si aucun autre onglet n'est ouvert
        if ($('.tablinks.active').length === 0) {
            document.getElementById("defaultOpen").click();
        }

        if (tabName.startsWith('room-')) {
            const roomName = tabName.replace('room-', '').replace(/-/g, ' ');
            socket.send(JSON.stringify({ type: 'leaveRoom', roomName: roomName, username: user.username }));
        }
    };

    window.createRoom = function() {
        const roomName = $('#newRoomName').val().trim();
        if (roomName !== '') {
            // Envoyer la demande de création de salon au serveur via WebSocket
            socket.send(JSON.stringify({ type: 'createRoom', roomName: roomName }));
            $('#newRoomName').val('');
        }
    };

    function sendMessageToUser(username) {
        const formattedUsername = username.replace(/\s/g, '-');
        const messageInput = $('#message-' + formattedUsername);
        const message = messageInput.val().trim();
        if (message === '') return;

        const chatWindowId = '#chat-' + formattedUsername;
        $(chatWindowId).append('<p><span style="color:' + (user.gender === 'female' ? 'red' : 'blue') + ';">' + user.username + '</span>: ' + message + '</p>');
        messageInput.val('');

        // Envoyer le message au serveur via WebSocket
        socket.send(JSON.stringify({ type: 'message', from: user.username, to: username, content: message, gender: user.gender }));

        // Défilement automatique vers le bas
        scrollToBottom(document.getElementById('chat-' + formattedUsername));
    }

    function sendMessageToRoom(roomId) {
        const formattedRoomId = roomId.replace(/\s/g, '-');
        const messageInput = $('#message-room-' + formattedRoomId);
        const message = messageInput.val().trim();
        if (message === '') return;

        $('#chat-room-' + formattedRoomId).append('<p><span style="color:' + (user.gender === 'female' ? 'red' : 'blue') + ';">' + user.username + '</span>: ' + message + '</p>');
        messageInput.val('');

        // Envoyer le message au serveur via WebSocket
        socket.send(JSON.stringify({ type: 'message', roomName: roomId, from: user.username, content: message, gender: user.gender }));

        // Défilement automatique vers le bas
        scrollToBottom(document.getElementById('chat-room-' + formattedRoomId));
    }

    function startWebcam() {
        alert('Démarrer la webcam');
    }

    function startMicrophone() {
        alert('Démarrer le micro');
    }

    function sendFile() {
        alert('Envoyer un fichier');
    }
});

