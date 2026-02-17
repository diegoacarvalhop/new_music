package br.com.newmusic.service;

import br.com.newmusic.domain.TokenRedefinicaoSenha;
import br.com.newmusic.domain.Usuario;
import br.com.newmusic.repository.TokenRedefinicaoSenhaRepository;
import br.com.newmusic.repository.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RedefinicaoSenhaServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private TokenRedefinicaoSenhaRepository tokenRepository;
    @Mock
    private EmailService emailService;
    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private RedefinicaoSenhaService redefinicaoSenhaService;

    @Test
    void redefinirSenha_quandoTokenNaoExiste_lancaExcecao() {
        when(tokenRepository.findByToken("token-invalido")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> redefinicaoSenhaService.redefinirSenha("token-invalido", "novaSenha"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Token inválido ou expirado");
    }

    @Test
    void redefinirSenha_quandoTokenExpirado_lancaExcecao() {
        Usuario usuario = new Usuario();
        TokenRedefinicaoSenha token = TokenRedefinicaoSenha.builder()
                .token("token")
                .usuario(usuario)
                .expiraEm(Instant.now().minusSeconds(1))
                .build();
        when(tokenRepository.findByToken("token")).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> redefinicaoSenhaService.redefinirSenha("token", "novaSenha"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Token inválido ou expirado");

        verify(tokenRepository).delete(token);
    }

    @Test
    void redefinirSenha_sucesso_alteraSenhaEDeletaToken() {
        Usuario usuario = new Usuario();
        usuario.setId(1L);
        TokenRedefinicaoSenha token = TokenRedefinicaoSenha.builder()
                .token("token-valido")
                .usuario(usuario)
                .expiraEm(Instant.now().plusSeconds(3600))
                .build();
        when(tokenRepository.findByToken("token-valido")).thenReturn(Optional.of(token));
        when(passwordEncoder.encode("novaSenha")).thenReturn("hash");

        redefinicaoSenhaService.redefinirSenha("token-valido", "novaSenha");

        verify(passwordEncoder).encode("novaSenha");
        verify(usuarioRepository).save(usuario);
        verify(tokenRepository).delete(token);
    }

    @Test
    void solicitarRedefinicaoSenha_quandoEmailNaoExiste_naoEnviaEmail() {
        when(usuarioRepository.findByEmail("inexistente@test.com")).thenReturn(Optional.empty());

        redefinicaoSenhaService.solicitarRedefinicaoSenha("inexistente@test.com");

        verify(tokenRepository, never()).save(any());
        verify(emailService, never()).enviarEmailRedefinicaoSenha(any(), any());
    }

    @Test
    void solicitarRedefinicaoSenha_quandoEmailExiste_salvaTokenEEnviaEmail() {
        ReflectionTestUtils.setField(redefinicaoSenhaService, "linkBase", "http://localhost:5173");
        Usuario usuario = new Usuario();
        usuario.setId(1L);
        usuario.setEmail("user@test.com");
        when(usuarioRepository.findByEmail("user@test.com")).thenReturn(Optional.of(usuario));
        when(tokenRepository.save(any(TokenRedefinicaoSenha.class))).thenAnswer(i -> i.getArgument(0));

        redefinicaoSenhaService.solicitarRedefinicaoSenha("user@test.com");

        verify(tokenRepository).deleteByUsuario_Id(1L);
        verify(tokenRepository).save(any(TokenRedefinicaoSenha.class));
        verify(emailService).enviarEmailRedefinicaoSenha(eq("user@test.com"), org.mockito.ArgumentMatchers.contains("token="));
    }
}
