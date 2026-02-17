package br.com.newmusic.service;

import br.com.newmusic.domain.ErrorLog;
import br.com.newmusic.repository.ErrorLogRepository;
import br.com.newmusic.security.UsuarioPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.servlet.http.HttpServletRequest;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ErrorLogService {

    private static final int STACK_TRACE_MAX = 8000;
    private static final int MENSAGEM_MAX = 2000;
    private static final int ACAO_MAX = 500;
    private static final int CONTEXTO_MAX = 1000;

    private final ErrorLogRepository errorLogRepository;

    @Transactional
    public void registrar(Throwable ex, HttpServletRequest request) {
        try {
            String acao = buildAcao(request);
            String mensagem = ex.getMessage() != null ? ex.getMessage() : ex.getClass().getSimpleName();
            if (mensagem.length() > MENSAGEM_MAX) mensagem = mensagem.substring(0, MENSAGEM_MAX);
            String tipoExcecao = ex.getClass().getName();
            if (tipoExcecao.length() > 500) tipoExcecao = tipoExcecao.substring(0, 500);
            String stackTrace = stackTraceToString(ex);
            if (stackTrace != null && stackTrace.length() > STACK_TRACE_MAX) stackTrace = stackTrace.substring(0, STACK_TRACE_MAX);
            String contexto = buildContexto(request);
            if (contexto != null && contexto.length() > CONTEXTO_MAX) contexto = contexto.substring(0, CONTEXTO_MAX);
            if (acao.length() > ACAO_MAX) acao = acao.substring(0, ACAO_MAX);

            Long usuarioId = null;
            String usuarioEmail = null;
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof UsuarioPrincipal principal) {
                usuarioId = principal.getId();
                usuarioEmail = principal.getEmail();
            }

            ErrorLog log = ErrorLog.builder()
                    .dataHora(LocalDateTime.now())
                    .usuarioId(usuarioId)
                    .usuarioEmail(usuarioEmail)
                    .acao(acao)
                    .mensagemErro(mensagem)
                    .tipoExcecao(tipoExcecao)
                    .stackTrace(stackTrace)
                    .contexto(contexto)
                    .build();
            errorLogRepository.save(log);
        } catch (Exception ignored) {
        }
    }

    private String buildAcao(HttpServletRequest request) {
        if (request == null) return "N/A";
        String method = request.getMethod();
        String path = request.getRequestURI();
        return method + " " + path;
    }

    private String buildContexto(HttpServletRequest request) {
        if (request == null) return null;
        String q = request.getQueryString();
        return q != null && !q.isBlank() ? "query: " + q : null;
    }

    private String stackTraceToString(Throwable ex) {
        if (ex == null) return null;
        StringWriter sw = new StringWriter();
        ex.printStackTrace(new PrintWriter(sw));
        return sw.toString();
    }
}
