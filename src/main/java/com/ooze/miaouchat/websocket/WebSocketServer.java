package com.ooze.miaouchat.websocket;

import com.google.gson.Gson;
import com.ooze.miaouchat.bean.Room;
import com.ooze.miaouchat.bean.User;

import jakarta.servlet.http.HttpSession;
import jakarta.websocket.EndpointConfig;
import jakarta.websocket.OnClose;
import jakarta.websocket.OnMessage;
import jakarta.websocket.OnOpen;
import jakarta.websocket.Session;
import jakarta.websocket.server.ServerEndpoint;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@ServerEndpoint("/chat")
public class WebSocketServer {
    private static Map<String, Session> sessions = new ConcurrentHashMap<>();
    private static Map<String, User> users = new ConcurrentHashMap<>();
    private static Map<String, Room> rooms = new ConcurrentHashMap<>();

    @OnOpen
    public void onOpen(Session session, EndpointConfig config) {
    	// Gather user http session
        HttpSession httpSession = (HttpSession) config.getUserProperties().get(HttpSession.class.getName());
        session.getUserProperties().put(HttpSession.class.getName(), httpSession);
    }


    @OnClose
    public void onClose(Session session) {
        String username = getUsernameBySession(session);
        if (username != null) {
            sessions.remove(username);
            User user = users.remove(username);
            if (user != null) {
                for (Room room : rooms.values()) {
                    room.removeUser(user);
                    if (room.getUserCount() == 0) {
                        rooms.remove(room.getName());
                    }
                }
                broadcastRoomList();
                broadcastUserDisconnect(user); // Diffuse le message de déconnexion
            }
            broadcastUserList();
        }

        // Invalider la session HTTP
        HttpSession httpSession = (HttpSession) session.getUserProperties().get(HttpSession.class.getName());
        if (httpSession != null) {
            httpSession.invalidate();
        }
    }


    @OnMessage
    public void onMessage(String message, Session session) {
        Gson gson = new Gson();
        Message msg = gson.fromJson(message, Message.class);

        switch (msg.getType()) {
            case "connect":
                if (users.containsKey(msg.getUsername())) {
                    sendErrorMessage(session, "Pseudo déjà utilisé actuellement.");
                } else {
                    User newUser = new User(msg.getUsername(), msg.getAge(), msg.getGender(), msg.getCity());
                    users.put(msg.getUsername(), newUser);
                    sessions.put(msg.getUsername(), session);
                    broadcastUserList();
                    broadcastRoomList();
                }
                break;
            case "joinRoom":
                joinRoom(msg.getRoomName(), msg.getUsername());
                break;
            case "leaveRoom":
                leaveRoom(msg.getRoomName(), msg.getUsername());
                break;
            case "createRoom":
                createRoom(msg.getRoomName());
                break;
            case "message":
                if (msg.getRoomName() != null) {
                    sendMessageToRoom(msg.getRoomName(), msg.getFrom(), msg.getContent(), msg.getGender(), msg.getFileName(), msg.getFileUrl(), msg.getFileType());
                } else {
                    sendMessageToUser(msg.getFrom(), msg.getTo(), msg.getContent(), msg.getGender(), msg.getFileName(), msg.getFileUrl(), msg.getFileType());
                }
                break;
            case "ping":
                // Ignorer les messages de type 'ping'
                break;
        }
    }
    
    private void broadcastUserDisconnect(User user) {
        Gson gson = new Gson();
        String messageJson = gson.toJson(Message.createUserDisconnectMessage(user.getUsername()));
        sessions.values().forEach(session -> {
            try {
                session.getBasicRemote().sendText(messageJson);
            } catch (Exception e) {
                e.printStackTrace();
            }
        });
    }
    
    private void sendErrorMessage(Session session, String errorMessage) {
        try {
            Gson gson = new Gson();
            String errorJson = gson.toJson(Message.createErrorMessage(errorMessage));
            session.getBasicRemote().sendText(errorJson);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void createRoom(String roomName) {
        rooms.putIfAbsent(roomName, new Room(roomName));
        broadcastRoomList();
    }

    private void joinRoom(String roomName, String username) {
        Room room = rooms.computeIfAbsent(roomName, Room::new);
        User user = users.get(username);
        if (user != null && !room.getUsers().contains(user)) {
            room.addUser(user);
            broadcastRoomUsers(roomName);
            broadcastRoomList();
        }
    }

    private void leaveRoom(String roomName, String username) {
        Room room = rooms.get(roomName);
        User user = users.get(username);
        if (room != null && user != null) {
            room.removeUser(user);
            if (room.getUserCount() == 0) {
                rooms.remove(roomName);
            }
            broadcastRoomUsers(roomName);
            broadcastRoomList();
        }
    }

    private void broadcastRoomList() {
        Gson gson = new Gson();
        List<Room> roomList = new ArrayList<>(rooms.values());
        String roomListJson = gson.toJson(Message.createRoomListMessage(roomList));
        sessions.values().forEach(session -> {
            try {
                session.getBasicRemote().sendText(roomListJson);
            } catch (Exception e) {
                e.printStackTrace();
            }
        });
    }

    private void broadcastUserList() {
        Gson gson = new Gson();
        List<User> userList = new ArrayList<>(users.values());
        String userListJson = gson.toJson(Message.createUserListMessage(userList));
        sessions.values().forEach(session -> {
            try {
                session.getBasicRemote().sendText(userListJson);
            } catch (Exception e) {
                e.printStackTrace();
            }
        });
    }

    private void broadcastRoomUsers(String roomName) {
        Gson gson = new Gson();
        Room room = rooms.get(roomName);
        if (room != null) {
            List<User> roomUsers = room.getUsers();
            String roomUsersJson = gson.toJson(Message.createRoomUsersMessage(roomName, roomUsers));
            for (User user : roomUsers) {
                try {
                    sessions.get(user.getUsername()).getBasicRemote().sendText(roomUsersJson);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }
    }

    private void sendMessageToRoom(String roomName, String from, String content, String gender, String fileName, String fileUrl, String fileType) {
        Gson gson = new Gson();
        String messageJson = gson.toJson(Message.createRoomMessage(from, content, gender, roomName, fileName, fileUrl, fileType));
        Room room = rooms.get(roomName);
        if (room != null) {
            for (User user : room.getUsers()) {
                if (!user.getUsername().equals(from)) {
                    try {
                        sessions.get(user.getUsername()).getBasicRemote().sendText(messageJson);
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            }
        }
    }

    private void sendMessageToUser(String from, String to, String content, String gender, String fileName, String fileUrl, String fileType) {
        Session session = sessions.get(to);
        if (session != null) {
            try {
                Gson gson = new Gson();
                String messageJson = gson.toJson(Message.createUserMessage(from, to, content, gender, fileName, fileUrl, fileType));
                session.getBasicRemote().sendText(messageJson);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    private String getUsernameBySession(Session session) {
        for (Map.Entry<String, Session> entry : sessions.entrySet()) {
            if (entry.getValue().equals(session)) {
                return entry.getKey();
            }
        }
        return null;
    }

    private static class Message {
        private String type;
        private String username;
        private int age;
        private String gender;
        private String city;
        private String from;
        private String to;
        private String content;
        private String roomName;
        private List<User> users;
        private List<Room> rooms;
        private String error;
        private boolean isRoomMessage;
        private String fileType;  // Nouvel attribut
        private String fileName;  // Nouvel attribut
        private String fileUrl;   // Nouvel attribut

        public Message() {}

        // Méthodes existantes

        public static Message createUserListMessage(List<User> users) {
            Message message = new Message();
            message.type = "userList";
            message.users = users;
            return message;
        }

        public static Message createRoomListMessage(List<Room> rooms) {
            Message message = new Message();
            message.type = "roomList";
            message.rooms = rooms;
            return message;
        }

        public static Message createRoomUsersMessage(String roomName, List<User> users) {
            Message message = new Message();
            message.type = "roomUsers";
            message.roomName = roomName;
            message.users = users;
            return message;
        }

        public static Message createRoomMessage(String from, String content, String gender, String roomName, String fileName, String fileUrl, String fileType) {
            Message message = new Message();
            message.type = "message";
            message.from = from;
            message.content = content;
            message.gender = gender;
            message.roomName = roomName;
            message.isRoomMessage = true;
            message.fileName = fileName;
            message.fileUrl = fileUrl;
            message.fileType = fileType;
            return message;
        }

        public static Message createUserMessage(String from, String to, String content, String gender, String fileName, String fileUrl, String fileType) {
            Message message = new Message();
            message.type = "message";
            message.from = from;
            message.to = to;
            message.content = content;
            message.gender = gender;
            message.isRoomMessage = false;
            message.fileName = fileName;
            message.fileUrl = fileUrl;
            message.fileType = fileType;
            return message;
        }

        public static Message createErrorMessage(String error) {
            Message message = new Message();
            message.type = "error";
            message.error = error;
            return message;
        }

        private static String getFileType(String content) {
            String extension = content.substring(content.lastIndexOf('.') + 1);
            switch (extension) {
                case "mp3":
                case "wav":
                case "ogg":
                    return "audio";
                case "mp4":
                case "mov":
                case "avi":
                    return "video";
                case "jpg":
                case "jpeg":
                case "png":
                case "gif":
                    return "image";
                default:
                    return "unknown";
            }
        }

        public static Message createUserDisconnectMessage(String username) {
            Message message = new Message();
            message.type = "userDisconnect";
            message.username = username;
            return message;
        }

        // Getters
        public String getType() {
            return type;
        }

        public String getUsername() {
            return username;
        }

        public int getAge() {
            return age;
        }

        public String getGender() {
            return gender;
        }

        public String getCity() {
            return city;
        }

        public String getFrom() {
            return from;
        }

        public String getTo() {
            return to;
        }

        public String getContent() {
            return content;
        }

        public String getRoomName() {
            return roomName;
        }

        public List<User> getUsers() {
            return users;
        }

        public List<Room> getRooms() {
            return rooms;
        }

        public String getError() {
            return error;
        }

        public boolean isRoomMessage() {
            return isRoomMessage;
        }

        public String getFileType() {
            return fileType;
        }

        public String getFileName() {
            return fileName;
        }

        public String getFileUrl() {
            return fileUrl;
        }
    }


}
