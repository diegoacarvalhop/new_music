package br.com.newmusic.service;

import br.com.newmusic.domain.Perfil;
import br.com.newmusic.domain.Usuario;
import br.com.newmusic.repository.UsuarioRepository;
import br.com.newmusic.web.dto.UsuarioInput;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UsuarioServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private AuditService auditService;

    @InjectMocks
    private UsuarioService usuarioService;

    @Test
    void buscarPorId_quandoNaoExiste_lancaExcecao() {
        when(usuarioRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> usuarioService.buscarPorId(999L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Usuário não encontrado");
    }

    @Test
    void criar_quandoEmailJaExiste_lancaExcecao() {
        UsuarioInput input = new UsuarioInput();
        input.setNome("Admin");
        input.setEmail("admin@test.com");
        input.setSenha("senha123");
        input.setPerfil(Perfil.ADMINISTRADOR);
        when(usuarioRepository.existsByEmail("admin@test.com")).thenReturn(true);

        assertThatThrownBy(() -> usuarioService.criar(input))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("e-mail");
    }

    @Test
    void criar_quandoSenhaVazia_lancaExcecao() {
        UsuarioInput input = new UsuarioInput();
        input.setNome("Admin");
        input.setEmail("admin@test.com");
        input.setSenha("");
        input.setPerfil(Perfil.ADMINISTRADOR);
        when(usuarioRepository.existsByEmail(any())).thenReturn(false);

        assertThatThrownBy(() -> usuarioService.criar(input))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Senha");
    }

    @Test
    void criar_quandoPerfilProfessor_lancaExcecao() {
        UsuarioInput input = new UsuarioInput();
        input.setNome("Prof");
        input.setEmail("prof@test.com");
        input.setSenha("senha123");
        input.setPerfil(Perfil.PROFESSOR);
        when(usuarioRepository.existsByEmail(any())).thenReturn(false);

        assertThatThrownBy(() -> usuarioService.criar(input))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Professor");
    }

    @Test
    void criar_sucesso_retornaDTO() {
        UsuarioInput input = new UsuarioInput();
        input.setNome("Admin");
        input.setEmail("admin@test.com");
        input.setSenha("senha123");
        input.setPerfil(Perfil.ADMINISTRADOR);
        when(usuarioRepository.existsByEmail(any())).thenReturn(false);
        when(passwordEncoder.encode("senha123")).thenReturn("hash");
        Usuario salvo = new Usuario();
        salvo.setId(1L);
        salvo.setNome("Admin");
        salvo.setEmail("admin@test.com");
        salvo.setPerfil(Perfil.ADMINISTRADOR);
        when(usuarioRepository.save(any(Usuario.class))).thenReturn(salvo);

        var dto = usuarioService.criar(input);

        assertThat(dto.getId()).isEqualTo(1L);
        assertThat(dto.getEmail()).isEqualTo("admin@test.com");
        verify(auditService).registrar(eq("CRIAR"), eq("usuarios"), eq("1"), any(), any());
    }

    @Test
    void excluir_quandoUnicoAdmin_lancaExcecao() {
        Usuario usuario = new Usuario();
        usuario.setId(1L);
        usuario.setPerfil(Perfil.ADMINISTRADOR);
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario));
        when(usuarioRepository.countByPerfil(Perfil.ADMINISTRADOR)).thenReturn(1L);

        assertThatThrownBy(() -> usuarioService.excluir(1L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("único administrador");
    }

    @Test
    void excluir_quandoVinculadoAluno_lancaExcecao() {
        Usuario usuario = new Usuario();
        usuario.setId(1L);
        usuario.setPerfil(Perfil.ADMINISTRADOR);
        usuario.setAluno(new br.com.newmusic.domain.Aluno());
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario));
        when(usuarioRepository.countByPerfil(Perfil.ADMINISTRADOR)).thenReturn(2L);

        assertThatThrownBy(() -> usuarioService.excluir(1L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("vinculado");
    }

    @Test
    void excluir_sucesso() {
        Usuario usuario = new Usuario();
        usuario.setId(1L);
        usuario.setNome("User");
        usuario.setEmail("user@test.com");
        usuario.setPerfil(Perfil.FUNCIONARIO);
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario));

        usuarioService.excluir(1L);

        verify(usuarioRepository).delete(usuario);
        verify(auditService).registrar(eq("EXCLUIR"), eq("usuarios"), eq("1"), any(), any());
    }
}
