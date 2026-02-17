package br.com.newmusic.config;

import br.com.newmusic.service.AuditService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
@RequiredArgsConstructor
public class AuditInterceptor implements HandlerInterceptor {

    private final AuditService auditService;

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        if (ex != null || response.getStatus() < 200 || response.getStatus() >= 300) {
            return;
        }
        String path = request.getRequestURI();
        if (!path.startsWith("/api/") || path.equals("/api/auth/login") || path.equals("/api/auth/refresh")) {
            return;
        }
        String pathAfterApi = path.length() > 5 ? path.substring(5) : "";
        if (pathAfterApi.isEmpty()) {
            return;
        }
        String method = request.getMethod();
        String acao;
        switch (method) {
            case "GET": acao = "CONSULTAR"; break;
            case "POST": acao = "CRIAR"; break;
            case "PUT":
            case "PATCH": acao = "ATUALIZAR"; break;
            case "DELETE": acao = "EXCLUIR"; break;
            default: return;
        }
        String[] parts = pathAfterApi.split("/");
        String tabelaId = null;
        for (String p : parts) {
            if (!p.isEmpty() && p.matches("\\d+")) {
                tabelaId = p;
                break;
            }
        }
        auditService.registrar(acao, pathAfterApi, tabelaId);
    }
}
