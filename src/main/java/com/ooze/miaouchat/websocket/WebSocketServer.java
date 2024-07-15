package com.ooze.miaouchat.websocket;

import com.google.gson.Gson;
import com.ooze.miaouchat.bean.User;
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

    @OnOpen
    public void onOpen(Session session) {
        System.out.println("New session opened: " + session.getId());
    }

    @OnClose
    public void onClose(Session session) {
        System.out.println("Session closed: " + session.getId());
        String username = getUsernameBySession(session);
        if (username != null) {
            sessions.remove(username);
            users.remove(username);
            broadcastUserList();
        }
    }

    @OnMessage
    public void onMessage(String message, Session session) {
        System.out.println("Message received: " + message);
        Gson gson = new Gson();
        Message msg = gson.fromJson(message, Message.class);

        switch (msg.getType()) {
            case "connect":
                users.put(msg.getUsername(), new User(msg.getUsername(), msg.getAge(), msg.getGender(), msg.getCity()));
                sessions.put(msg.getUsername(), session);
                broadcastUserList();
                break;
            case "message":
                sendMessageToUser(msg.getFrom(), msg.getTo(), msg.getContent(), msg.getGender());
                break;
            case "ping":
                // Ignorer les messages de type 'ping'
                break;
        }
    }

    private void broadcastUserList() {
        Gson gson = new Gson();
        List<User> userList = new ArrayList<>(users.values());
        String userListJson = gson.toJson(new Message("userList", userList));
        sessions.values().forEach(session -> {
            try {
                session.getBasicRemote().sendText(userListJson);
            } catch (Exception e) {
                e.printStackTrace();
            }
        });
    }

    private void sendMessageToUser(String from, String to, String content, String gender) {
        Session session = sessions.get(to);
        if (session != null) {
            try {
                Gson gson = new Gson();
                String messageJson = gson.toJson(new Message("message", from, content, gender));
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
        private List<User> users;

        // Constructeur sans arguments
        public Message() {}

        // Constructeurs, getters et setters
        public Message(String type, List<User> users) {
            this.type = type;
            this.users = users;
        }

        public Message(String type, String from, String content, String gender) {
            this.type = type;
            this.from = from;
            this.content = content;
            this.gender = gender;
        }

        // Getters et setters
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

        public List<User> getUsers() {
            return users;
        }
    }
}
