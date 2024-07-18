package com.ooze.miaouchat.bean;

import java.util.Date;

public class User {
    private String username;
    private int age;
    private String gender;
    private String city;
    private String postalCode;
    private Date connectedAt;

    // Constructeur utilisé par WebSocketServer
    public User(String username, int age, String gender, String city) {
        this.username = username;
        this.age = age;
        this.gender = gender;
        this.city = city;
        this.connectedAt = new Date(); // Initialiser à l'heure actuelle
    }

    // Constructeur utilisé par LoginServlet
    public User(String username, int age, String gender, String city, String postalCode) {
        this.username = username;
        this.age = age;
        this.gender = gender;
        this.city = city;
        this.postalCode = postalCode;
        this.connectedAt = new Date(); // Initialiser à l'heure actuelle
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

    public String getPostalCode() {
        return postalCode;
    }

    public Date getConnectedAt() {
        return connectedAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        User user = (User) o;

        return username.equals(user.username);
    }

    @Override
    public int hashCode() {
        return username.hashCode();
    }
}
