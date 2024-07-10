package com.ooze.miaouchat.servlet;

import com.google.gson.Gson;
import com.ooze.miaouchat.bean.Room;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@WebServlet("/api/rooms")
public class RoomServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;

    private List<Room> rooms = new ArrayList<>();

    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        String json = new Gson().toJson(rooms);
        response.getWriter().write(json);
    }

    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        String name = request.getParameter("name");
        if (name != null && !name.isEmpty()) {
            rooms.add(new Room(name));
        }
    }
}
