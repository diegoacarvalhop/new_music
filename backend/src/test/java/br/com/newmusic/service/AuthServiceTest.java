package br.com.newmusic.service;

import br.com.newmusic.domain.Perfil;
import br.com.newmusic.domain.Usuario;
import br.com.newmusic.repository.ProfessorRepository;
import br.com.newmusic.repository.UsuarioRepository;
import br.com.newmusic.security.JwtService;
import br.com.newmusic.security.UsuarioPrincipal;
import br.com.newmusic.web.dto.AuthResponse;
import br.com.newmusic.web.dto.LoginRequest;
import br.com.newmusic.web.dto.RefreshRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.Authentication;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private ProfessorRepository professorRepository;
    @Mock
    private JwtService jwtService;
    @Mock
    private AuthenticationManager authenticationManager;

    @InjectMocks
    private AuthService authService;

    @Test
    void login_sucesso_retornaAuthResponse() {
        LoginRequest request = new LoginRequest();
        request.setEmail("user@test.com");
        request.setSenha("senha");
        Usuario usuario = new Usuario();
        usuario.setId(1L);
        usuario.setEmail("user@test.com");
        usuario.setNome("User");
        usuario.setPerfil(Perfil.ADMINISTRADOR);
        UsuarioPrincipal principal = new UsuarioPrincipal(usuario, null);
        Authentication auth = mock(Authentication.class);
        when(authenticationManager.authenticate(any())).thenReturn(auth);
        when(auth.getPrincipal()).thenReturn(principal);
        when(usuarioRepository.findByEmail("user@test.com")).thenReturn(Optional.of(usuario));
        when(professorRepository.findByUsuario_Id(1L)).thenReturn(Optional.empty());
        when(jwtService.generateAccessToken(usuario)).thenReturn("access");
        when(jwtService.generateRefreshToken(usuario)).thenReturn("refresh");

        AuthResponse response = authService.login(request);

        assertThat(response.getAccessToken()).isEqualTo("access");
        assertThat(response.getRefreshToken()).isEqualTo("refresh");
        assertThat(response.getEmail()).isEqualTo("user@test.com");
        assertThat(response.getNome()).isEqualTo("User");
        assertThat(response.getPerfil()).isEqualTo(Perfil.ADMINISTRADOR);
    }

    @Test
    void refresh_quandoTokenInvalido_lancaExcecao() {
        RefreshRequest request = new RefreshRequest();
        request.setRefreshToken("token-invalido");
        when(jwtService.validateToken("token-invalido")).thenReturn(false);

        assertThatThrownBy(() -> authService.refresh(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Refresh token inválido");
    }

    @Test
    void refresh_quandoUsuarioNaoEncontrado_lancaExcecao() {
        RefreshRequest request = new RefreshRequest();
        request.setRefreshToken("token");
        when(jwtService.validateToken("token")).thenReturn(true);
        when(jwtService.isRefreshToken("token")).thenReturn(true);
        when(jwtService.extractEmail("token")).thenReturn("inexistente@test.com");
        when(usuarioRepository.findByEmail("inexistente@test.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.refresh(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Usuário não encontrado");
    }

    @Test
    void refresh_quandoUsuarioInativo_lancaExcecao() {
        RefreshRequest request = new RefreshRequest();
        request.setRefreshToken("token");
        Usuario usuario = new Usuario();
        usuario.setAtivo(false);
        when(jwtService.validateToken("token")).thenReturn(true);
        when(jwtService.isRefreshToken("token")).thenReturn(true);
        when(jwtService.extractEmail("token")).thenReturn("user@test.com");
        when(usuarioRepository.findByEmail("user@test.com")).thenReturn(Optional.of(usuario));

        assertThatThrownBy(() -> authService.refresh(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("inativo");
    }

    @Test
    void refresh_sucesso_retornaAuthResponse() {
        RefreshRequest request = new RefreshRequest();
        request.setRefreshToken("token");
        Usuario usuario = new Usuario();
        usuario.setId(1L);
        usuario.setEmail("user@test.com");
        usuario.setNome("User");
        usuario.setPerfil(Perfil.ADMINISTRADOR);
        usuario.setAtivo(true);
        when(jwtService.validateToken("token")).thenReturn(true);
        when(jwtService.isRefreshToken("token")).thenReturn(true);
        when(jwtService.extractEmail("token")).thenReturn("user@test.com");
        when(usuarioRepository.findByEmail("user@test.com")).thenReturn(Optional.of(usuario));
        when(professorRepository.findByUsuario_Id(1L)).thenReturn(Optional.empty());
        when(jwtService.generateAccessToken(usuario)).thenReturn("newAccess");
        when(jwtService.generateRefreshToken(usuario)).thenReturn("newRefresh");

        AuthResponse response = authService.refresh(request);

        assertThat(response.getAccessToken()).isEqualTo("newAccess");
        assertThat(response.getRefreshToken()).isEqualTo("newRefresh");
        assertThat(response.getEmail()).isEqualTo("user@test.com");
    }
}
