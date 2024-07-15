package com.ooze.miaouchat.bean;

import java.util.ArrayList;
import java.util.List;

public class Room {
    private String name;
    private List<User> users;
    private int userCount;

    public Room(String name) {
        this.name = name;
        this.users = new ArrayList<>();
        this.userCount = 0;
    }

    public String getName() {
        return name;
    }

    public List<User> getUsers() {
        return users;
    }

    public void addUser(User user) {
        this.users.add(user);
        this.userCount = this.users.size();
    }

    public void removeUser(User user) {
        this.users.remove(user);
        this.userCount = this.users.size();
    }

    public int getUserCount() {
        return this.userCount;
    }
}
