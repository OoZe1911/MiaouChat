package com.ooze.miaouchat.servlet;

import com.ooze.miaouchat.bean.User;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.io.IOException;

@WebServlet("/login")
public class LoginServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;

    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        String username = request.getParameter("username");
        int age = Integer.parseInt(request.getParameter("age"));
        String gender = request.getParameter("gender");
        String city = request.getParameter("city");
        String postalCode = request.getParameter("postalCode");

        User user = new User(username, age, gender, city, postalCode);

        HttpSession session = request.getSession();
        session.setAttribute("user", user);

        response.sendRedirect("chat.html");
    }
}
