package com.ooze.miaouchat.bean;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Random;

public class ConnectedUsers {
    private final List<User> users = Collections.synchronizedList(new ArrayList<>());

    public List<User> getUsers() {
        synchronized (users) {
            return new ArrayList<>(users);  // Retourne une nouvelle liste pour éviter les modifications extérieures
        }
    }

    public void addUser(User user) {
        synchronized (users) {
            users.add(user);
        }
    }

    public void generateFakeUsers(int count) {
        String[] names = {"Alice", "Bob", "Charlie", "David", "Eve", "Frank", "Grace", "Hank", "Ivy", "Jack", "Kathy", "Leo", "Mona", "Nina", "Oscar", "Paul", "Quincy", "Rose", "Sam", "Tina", "Uma", "Vince", "Wendy", "Xander", "Yara", "Zack"};
        String[] cities = {"Paris", "Lyon", "Marseille", "Toulouse", "Nice", "Nantes", "Strasbourg", "Montpellier", "Bordeaux", "Lille"};

        Random random = new Random();

        for (int i = 0; i < count; i++) {
            String name = names[random.nextInt(names.length)] + i;
            int age = 18 + random.nextInt(82); // Age entre 18 et 99
            String gender = random.nextBoolean() ? "male" : "female";
            String postalCode = String.format("%05d", random.nextInt(100000)); // Code postal aléatoire
            String city = cities[random.nextInt(cities.length)];
            User user = new User(name, age, city, gender, postalCode);
            addUser(user);
        }
    }
}
