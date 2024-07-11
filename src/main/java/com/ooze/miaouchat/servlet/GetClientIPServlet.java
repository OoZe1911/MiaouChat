package com.ooze.miaouchat.servlet;

import java.io.IOException;
import com.google.gson.JsonObject;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@WebServlet("/getClientIP")
public class GetClientIPServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;

    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        String clientIP = getClientIpAddr(request);
        JsonObject json = new JsonObject();
        json.addProperty("ip", clientIP);

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        
        response.getWriter().write(json.toString());
    }

    private String getClientIpAddr(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
            // X-Forwarded-For peut contenir une liste d'IP, nous devons prendre la première (l'IP d'origine)
            ip = ip.split(",")[0];
        } else {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        
        // Vérifiez si l'adresse IP est au format IPv6 et essayez de la convertir en IPv4 si possible
        if (ip != null && ip.contains(":")) {
            ip = convertIPv6ToIPv4(ip);
        }

        return ip;
    }

    private String convertIPv6ToIPv4(String ip) {
        if (ip.startsWith("::ffff:")) {
            ip = ip.substring(7);
        } else if (ip.equals("0:0:0:0:0:0:0:1") || ip.equals("::1")) {
            ip = "127.0.0.1";
        }
        return ip;
    }
}
