package br.com.newmusic.service;

import br.com.newmusic.domain.AuditLog;
import br.com.newmusic.repository.AuditLogRepository;
import br.com.newmusic.security.UsuarioPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    @Transactional
    public void registrar(String acao, String tabela, String tabelaId) {
        registrar(acao, tabela, tabelaId, null, null);
    }

    @Transactional
    public void registrar(String acao, String tabela, String tabelaId, String descricao, String conteudoAlteracao) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof UsuarioPrincipal)) {
            return;
        }
        UsuarioPrincipal principal = (UsuarioPrincipal) auth.getPrincipal();
        AuditLog log = AuditLog.builder()
                .usuarioId(principal.getId())
                .usuarioEmail(principal.getEmail())
                .acao(acao)
                .tabela(tabela)
                .tabelaId(tabelaId != null ? String.valueOf(tabelaId) : null)
                .dataHora(LocalDateTime.now())
                .descricao(descricao)
                .conteudoAlteracao(conteudoAlteracao)
                .build();
        auditLogRepository.save(log);
    }
}
