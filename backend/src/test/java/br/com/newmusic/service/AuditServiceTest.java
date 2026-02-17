package br.com.newmusic.service;

import br.com.newmusic.domain.AuditLog;
import br.com.newmusic.domain.Perfil;
import br.com.newmusic.domain.Usuario;
import br.com.newmusic.repository.AuditLogRepository;
import br.com.newmusic.security.UsuarioPrincipal;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuditServiceTest {

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private SecurityContext securityContext;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private AuditService auditService;

    @Test
    void registrar_comUsuarioAutenticado_salvaLog() {
        Usuario usuario = new Usuario();
        usuario.setId(1L);
        usuario.setEmail("user@test.com");
        usuario.setSenha("x");
        usuario.setPerfil(Perfil.ADMINISTRADOR);
        UsuarioPrincipal principal = new UsuarioPrincipal(usuario, null);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getPrincipal()).thenReturn(principal);
        SecurityContextHolder.setContext(securityContext);
        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        when(auditLogRepository.save(any(AuditLog.class))).thenAnswer(i -> i.getArgument(0));

        auditService.registrar("CRIAR", "alunos", "10", "Criou aluno", "Nome: João");

        verify(auditLogRepository).save(captor.capture());
        AuditLog log = captor.getValue();
        assertThat(log.getAcao()).isEqualTo("CRIAR");
        assertThat(log.getTabela()).isEqualTo("alunos");
        assertThat(log.getTabelaId()).isEqualTo("10");
        assertThat(log.getDescricao()).isEqualTo("Criou aluno");
        assertThat(log.getConteudoAlteracao()).isEqualTo("Nome: João");
        assertThat(log.getUsuarioId()).isEqualTo(1L);
        assertThat(log.getUsuarioEmail()).isEqualTo("user@test.com");
        SecurityContextHolder.clearContext();
    }

    @Test
    void registrar_semAutenticacao_naoSalva() {
        when(securityContext.getAuthentication()).thenReturn(null);
        SecurityContextHolder.setContext(securityContext);

        auditService.registrar("CRIAR", "alunos", "10");

        verify(auditLogRepository, never()).save(any());
        SecurityContextHolder.clearContext();
    }
}
