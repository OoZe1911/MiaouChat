package com.ooze.miaouchat.servlet;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.Part;

@WebServlet("/upload")
@MultipartConfig
public class FileUploadServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;
	private static final String UPLOAD_DIR = "/tmp/miaouchat";

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        // Créer le répertoire s'il n'existe pas
        File uploadDir = new File(UPLOAD_DIR);
        if (!uploadDir.exists()) {
            uploadDir.mkdir();
        }

        // Nettoyer les anciens fichiers
        cleanOldFiles(uploadDir);

        // Récupérer le fichier téléchargé
        Part filePart = request.getPart("file");
        String fileName = getFileName(filePart);
        String fileType = filePart.getContentType();

        // Vérifier le type de fichier
        if (!fileType.startsWith("audio/") && !fileType.startsWith("image/") && !fileType.startsWith("video/")) {
            response.sendError(HttpServletResponse.SC_UNSUPPORTED_MEDIA_TYPE, "Type de fichier non supporté.");
            return;
        }

        // Sauvegarder le fichier
        File file = new File(uploadDir, fileName);
        try (FileOutputStream fos = new FileOutputStream(file)) {
            filePart.write(file.getAbsolutePath());
        }

        // Répondre avec le chemin du fichier
        response.setContentType("application/json");
        response.getWriter().write("{\"filePath\":\"" + file.getAbsolutePath() + "\"}");
    }

    private void cleanOldFiles(File uploadDir) {
        File[] files = uploadDir.listFiles();
        if (files != null) {
            long now = System.currentTimeMillis();
            for (File file : files) {
                if (now - file.lastModified() > 10 * 60 * 1000) { // Fichiers plus vieux de 10 minutes
                    file.delete();
                }
            }
        }
    }

    private String getFileName(Part part) {
        String contentDisposition = part.getHeader("content-disposition");
        for (String content : contentDisposition.split(";")) {
            if (content.trim().startsWith("filename")) {
                return content.substring(content.indexOf("=") + 2, content.length() - 1);
            }
        }
        return "unknown";
    }
}