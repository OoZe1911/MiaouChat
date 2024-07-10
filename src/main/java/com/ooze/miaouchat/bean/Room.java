package com.ooze.miaouchat.bean;

import java.util.ArrayList;
import java.util.List;

public class Room {
    private String name;
    private List<User> users;

    public Room(String name) {
        this.name = name;
        this.users = new ArrayList<>();
    }

    public String getName() {
        return name;
    }

    public List<User> getUsers() {
        return users;
    }

    public void addUser(User user) {
        this.users.add(user);
    }

    public void removeUser(User user) {
        this.users.remove(user);
    }

    public int getUserCount() {
        return this.users.size();
    }
}
