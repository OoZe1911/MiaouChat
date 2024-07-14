package com.ooze.miaouchat.servlet;

import com.ooze.miaouchat.bean.User;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
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
        //String httpsUrl = "https://" + request.getServerName() + request.getContextPath() + "/chat.html";
        //response.sendRedirect(httpsUrl);
    }
}
