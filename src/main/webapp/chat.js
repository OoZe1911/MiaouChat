// Fonction pour faire défiler vers le bas
function scrollToBottom(element) {
    if (element) {
        element.scrollTop = element.scrollHeight;
    }
}

let currentContext = {
    type: 'user', // 'user' or 'room'
    id: '' // userId or roomId
};

// Fonction pour ouvrir un onglet
function openTab(evt, tabName) {
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
        evt.currentTarget.className = evt.currentTarget.className.replace(" notification", ""); // Retire la classe notification uniquement de l'onglet cliqué
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

    // Mise à jour du contexte actuel
    if (tabName.startsWith('room-')) {
        currentContext.type = 'room';
        currentContext.id = tabName.replace('room-', '');
    } else {
        currentContext.type = 'user';
        currentContext.id = tabName;
    }
}

function sendFile() {
    $('#fileInput').click();
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
			case 'userDisconnect':
			    handleUserDisconnect(msg.username);
			    break;
            case 'ping':
                // Ignorer les messages de type 'ping'
                break;
        }
    };

	// Méthode pour gérer la déconnexion d'un utilisateur
	function handleUserDisconnect(username) {
	    // Retirer l'utilisateur de la liste des utilisateurs connectés
	    users = users.filter(user => user.username !== username);
	    updateUserList(users);

	    // Retirer l'utilisateur de la liste des utilisateurs dans chaque salon
	    $('.room-user-link').each(function() {
	        if ($(this).data('username') === username) {
	            $(this).closest('tr').remove();
	        }
	    });
	}
	
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

	let users = [];

	function updateUserList(newUsers) {
	    users = newUsers; // Mettre à jour la variable globale
	    $('#userList').empty();
	    
	    // Trier les utilisateurs par ordre de connexion (les plus récents en haut)
	    users.sort(function(a, b) {
	        return new Date(b.connectedAt) - new Date(a.connectedAt);
	    });

	    // Récupérer les filtres sélectionnés
	    const filter = $('input[name="filter"]:checked').val();
	    const nameFilter = $('#nameFilter').val().trim().toLowerCase();
	    
	    let maleCount = 0;
	    let femaleCount = 0;

	    users.forEach(function(user) {
	        const rowClass = user.gender === 'male' ? 'user-male' : 'user-female';
	        if (user.gender === 'male') {
	            maleCount++;
	        } else {
	            femaleCount++;
	        }

	        // Appliquer les filtres
	        if (
	            (filter === 'all' || (filter === 'male' && user.gender === 'male') || (filter === 'female' && user.gender === 'female')) &&
	            (nameFilter === '' || user.username.toLowerCase().includes(nameFilter)
)	        ) {
	            $('#userList').append(
	                '<tr class="' + rowClass + '">' +
	                '<td><a href="#" class="user-link" data-username="' + user.username + '">' + user.username + '</a></td>' +
	                '<td>' + user.age + '</td>' +
	                '<td>' + user.city + '</td>' +
	                '</tr>'
	            );
	        }
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

	function debounce(func, wait) {
	    let timeout;
	    return function() {
	        const context = this, args = arguments;
	        clearTimeout(timeout);
	        timeout = setTimeout(() => func.apply(context, args), wait);
	    };
	}
	
	// Ajouter des gestionnaires d'événements pour changer les filtres
	$(document).ready(function() {
	    $('input[name="filter"]').change(function() {
	        updateUserList(users);
	    });

	    $('#nameFilter').on('input', debounce(function() {
	        updateUserList(users);
	    }, 300));  // 300 millisecondes de délai
	});


	// Ajouter un gestionnaire d'événements pour changer le filtre
	$(document).ready(function() {
	    $('input[name="filter"]').change(function() {
	        updateUserList(users); // Assurez-vous que 'users' est une variable globale ou accessible ici
	    });
	});

	function updateRoomUserList(roomName, users) {
	    const formattedRoomName = roomName.replace(/\s/g, '-');
	    const userListContainer = $('#room-users-' + formattedRoomName);
	    userListContainer.empty();
	    users.forEach(function(user) {
	        const rowClass = user.gender === 'male' ? 'user-male' : 'user-female';
	        userListContainer.append(
	            '<tr class="' + rowClass + '">' +
	            '<td><a href="#" class="room-user-link" data-username="' + user.username + '">' + user.username + '</a></td>' +
	            '<td>' + user.age + '</td>' +
	            '<td>' + user.city + '</td>' +
	            '</tr>'
	        );
	    });

	    // Ajouter l'événement de clic aux liens des utilisateurs dans les salons
	    $('.room-user-link').click(function(event) {
	        event.preventDefault();
	        const username = $(this).data('username');
	        openUserChatTab(username);
	    });
	}

	let currentChat;

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
	        const pageTitle = `<span style="color: ${titleColor};">${username}</span> ${age} ans <img src="town.png" alt="town icon" style="width:16px;height:16px;"> ${city}`;

	        // Créer un nouvel onglet avec juste le nom de l'utilisateur
	        $('.tab').append('<button class="tablinks" onclick="openTab(event, \'' + formattedUsername + '\')" id="tab-' + formattedUsername + '">' + username + ' <svg onclick="closeTab(event, \'' + formattedUsername + '\')" style="width:12px; height:12px; cursor: pointer;"><use href="#icon-close"></use></svg></button>');

	        // Créer un nouveau contenu d'onglet
	        $('body').append(
	            '<div id="' + formattedUsername + '" class="tabcontent">' +
	            '<div class="icon-buttons">' +
	            '<svg onclick="startWebcam()" style="cursor: pointer;color: #CCCCCC;"><use href="#icon-cam" fill="#cccccc"></use></svg>' +
	            '<svg onclick="startMicrophone()" style="cursor: pointer;"><use href="#icon-mic" fill="#cccccc"></use></svg>' +
	            '<svg onclick="sendFile()" style="cursor: pointer;"><use href="#icon-file"></use></svg>' +
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
	        currentChat = formattedUsername; // Mettre à jour currentChat
	        currentContext.type = 'user';
	        currentContext.id = formattedUsername;
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
	            '<svg onclick="sendFile()" style="cursor: pointer;"><use href="#icon-file"></use></svg>' +
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
	    currentChat = 'chat-room-' + formattedRoomId; // Mettre à jour currentChat
	}

	function displayMessage(msg) {
	    const nameColor = msg.gender === 'female' ? 'red' : 'blue';
	    const fromUser = msg.from ? msg.from.replace(/\s/g, '-') : 'Unknown';
	    const toUser = msg.to ? msg.to.replace(/\s/g, '-') : 'Unknown';
	    const roomName = msg.roomName ? msg.roomName.replace(/\s/g, '-') : null;
	    const fileUrl = msg.fileUrl ? msg.fileUrl : '';
	    const messageHtml = msg.fileType
	        ? `<p><span style="color:${nameColor};">${msg.from}</span>: <a href="#" class="media-link" data-filetype="${msg.fileType}" data-fileurl="${fileUrl}"><img src="${msg.fileType === 'audio' ? 'music.png' : msg.fileType === 'image' ? 'image.png' : 'movie.png'}" alt="file icon" style="width: 32px; height: 32px;" /></a></p>`
	        : `<p><span style="color:${nameColor};">${msg.from}</span>: ${msg.content}</p>`;

	    if (roomName) {
	        const chatWindowId = '#chat-room-' + roomName;
	        $(chatWindowId).append(messageHtml);
	        scrollToBottom(document.getElementById('chat-room-' + roomName));

	        if (!$(`#tab-room-${roomName}`).hasClass('active')) {
	            $(`#tab-room-${roomName}`).addClass('notification');
	        }
	    } else {
	        const chatWindowId = '#chat-' + (msg.to === user.username ? fromUser : toUser);
	        const chatWindow = $(chatWindowId);
	        const tabExists = chatWindow.length > 0;

	        if (!tabExists) {
	            openUserChatTab(msg.to === user.username ? fromUser : toUser, false);
	        }

	        $(chatWindowId).append(messageHtml);

	        if ($(chatWindowId).is(':visible')) {
	            scrollToBottom(chatWindow[0]);
	        } else {
	            $('#tab-' + (msg.to === user.username ? fromUser : toUser)).addClass('notification');
	        }
	    }

	    // Ajouter des handlers pour les liens de médias
	    $('.media-link').off('click').on('click', function(event) {
	        event.preventDefault();
	        const fileType = $(this).data('filetype');
	        const fileUrl = $(this).data('fileurl');
	        openMedia(fileType, fileUrl);
	    });
	}

	function openMedia(fileType, fileUrl) {
	    if (fileType === 'audio' || fileType === 'video') {
	        openMediaPopup(fileType, fileUrl);
	    } else if (fileType === 'image') {
	        window.open(fileUrl, '_blank');
	    }
	}

	function openMediaPopup(fileType, fileUrl) {
	    let mediaElement;
	    if (fileType === 'audio') {
	        mediaElement = `
	            <audio controls autoplay style="width:100%;">
	                <source src="${fileUrl}" type="audio/mpeg">
	                Your browser does not support the audio element.
	            </audio>`;
	    } else if (fileType === 'video') {
	        mediaElement = `
	            <video controls autoplay style="width:100%;">
	                <source src="${fileUrl}" type="video/mp4">
	                Your browser does not support the video element.
	            </video>`;
	    } else {
	        return;
	    }

	    const popupHtml = `
	        <div id="mediaPopup" style="position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); width:80%; max-width:600px; background-color:white; padding:20px; box-shadow:0 0 10px rgba(0, 0, 0, 0.5); z-index:1000;">
	            ${mediaElement}
	            <button onclick="closeMediaPopup()" style="margin-top:10px;">Fermer</button>
	        </div>
	        <div id="mediaOverlay" style="position:fixed; top:0; left:0; width:100%; height:100%; background-color:rgba(0, 0, 0, 0.5); z-index:999;" onclick="closeMediaPopup()"></div>
	    `;
	    $('body').append(popupHtml);
	}

	function closeMediaPopup() {
	    $('#mediaPopup').remove();
	    $('#mediaOverlay').remove();
	}

	// Attacher les fonctions à l'objet window pour assurer leur disponibilité dans le contexte global
	window.openMedia = openMedia;
	window.openMediaPopup = openMediaPopup;
	window.closeMediaPopup = closeMediaPopup;

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

	        // Joindre le salon après sa création
	        setTimeout(() => {
	            openRoomChatTab(roomName);
	            socket.send(JSON.stringify({ type: 'joinRoom', roomName: roomName, username: user.username }));
	        }, 500); // Attendre 500ms pour s'assurer que le salon est créé
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

	// Gérer la sélection du fichier
	$('#fileInput').on('change', function(event) {
	    const file = event.target.files[0];
	    if (file) {
	        uploadFile(file);
			// Réinitialiser la valeur du champ de saisie de fichier pour permettre de sélectionner le même fichier à nouveau
			$(this).val('');
	    }
	});

	function uploadFile(file) {
	    if (file.size > 10 * 1024 * 1024) { // Vérifie la taille du fichier (10 Mo maximum)
	        alert('Le fichier est trop grand. Maximum 10 Mo.');
	        return;
	    }

	    const formData = new FormData();
	    formData.append('file', file);

	    $.ajax({
	        url: 'upload', // URL de l'endpoint pour le téléchargement
	        type: 'POST',
	        data: formData,
	        processData: false,
	        contentType: false,
	        success: function(response) {
	            const fileType = file.type.split('/')[0];
	            let icon = '';
	            if (fileType === 'audio') {
	                icon = 'music.png';
	            } else if (fileType === 'image') {
	                icon = 'image.png';
	            } else if (fileType === 'video') {
	                icon = 'movie.png';
	            }

	            const userColor = user.gender === 'female' ? 'red' : 'blue';
	            const fileName = response.filePath.split('/').pop(); // Récupère le nom du fichier
	            const fileUrl = 'download?file=' + encodeURIComponent(fileName); // Encodage du nom de fichier

	            let message;

	            if (currentContext.type === 'room') {
	                message = {
	                    type: 'message',
	                    from: user.username,
	                    content: fileName,
	                    fileType: fileType,
	                    fileUrl: fileUrl,
	                    gender: user.gender,
	                    roomName: currentContext.id.replace(/-/g, ' '),
	                    to: null
	                };
	            } else {
	                message = {
	                    type: 'message',
	                    from: user.username,
	                    content: fileName,
	                    fileType: fileType,
	                    fileUrl: fileUrl,
	                    gender: user.gender,
	                    roomName: null,
	                    to: currentContext.id.replace('chat-', '').replace(/-/g, ' ')
	                };
	            }

	            // Afficher le fichier dans le chat de l'expéditeur
	            displayMessage(message);

	            // Envoyer un message WebSocket pour informer les autres utilisateurs
	            socket.send(JSON.stringify(message));
	        },
	        error: function(error) {
	            alert('Type de fichier non supporté.');
	        }
	    });
	}

});

