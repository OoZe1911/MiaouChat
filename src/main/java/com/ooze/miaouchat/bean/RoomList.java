package com.ooze.miaouchat.bean;

import java.util.ArrayList;
import java.util.List;

public class RoomList {
    private List<Room> rooms = new ArrayList<>();

    public List<Room> getRooms() {
        return rooms;
    }

    public void addRoom(Room room) {
        rooms.add(room);
    }
}
