package com.ooze.miaouchat.servlet;

import com.google.gson.Gson;
import com.ooze.miaouchat.bean.User;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@WebServlet("/api/users")
public class UserServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;

    private List<User> users = new ArrayList<>();

    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        String json = new Gson().toJson(users);
        response.getWriter().write(json);
    }
}
