package com.ooze.miaouchat.servlet;

import com.ooze.miaouchat.bean.User;

import java.io.IOException;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.FilterConfig;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

/**
 * Servlet Filter implementation class ServletFilter
 */
@WebFilter("/*")
public class ServletFilter implements Filter {

    public ServletFilter() {
    }

    public void destroy() {
    }

    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;
        // Security headers
        res.setHeader("X-XSS-Protection", "1; mode=block");
        res.setHeader("Strict-transport-security", "max-age=31536000; includeSubDomains");
        res.setHeader("X-Frame-Options", "deny");
        res.setHeader("X-Content-Type-Options","nosniff");

        String uri = req.getRequestURI().toLowerCase();

        // Exclude static resources and specific endpoints
        boolean isLoginPage = uri.contains("login");
        boolean isStaticResource = uri.endsWith(".css") || uri.endsWith(".js") || uri.endsWith(".ico") || uri.endsWith(".png") || uri.endsWith("getclientip");

        if(isLoginPage || isStaticResource) {
            chain.doFilter(request, response);
        } else {
            // Check if session is new
            HttpSession session = req.getSession(false);
            if (session == null || session.isNew()) {
                res.sendRedirect("login.html");
            } else {
                // Check user authentication
                User user = (User) session.getAttribute("user");
                if(user != null) {
                    chain.doFilter(request, response);
                } else {
                    res.sendRedirect("login.html");
                }
            }
        }
    }

    public void init(FilterConfig fConfig) throws ServletException {
    }
}
