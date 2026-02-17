package br.com.newmusic.service;

import br.com.newmusic.domain.Aluno;
import br.com.newmusic.repository.AlunoRepository;
import br.com.newmusic.repository.MatriculaRepository;
import br.com.newmusic.repository.MensalidadeRepository;
import br.com.newmusic.repository.UsuarioRepository;
import br.com.newmusic.web.dto.AlunoInput;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AlunoServiceTest {

    @Mock
    private AlunoRepository alunoRepository;
    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private MatriculaRepository matriculaRepository;
    @Mock
    private MensalidadeRepository mensalidadeRepository;
    @Mock
    private AuditService auditService;

    @InjectMocks
    private AlunoService alunoService;

    @Test
    void buscarPorId_quandoNaoExiste_lancaExcecao() {
        when(alunoRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> alunoService.buscarPorId(999L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Aluno não encontrado");
    }

    @Test
    void buscarPorId_retornaDTO() {
        Aluno aluno = new Aluno();
        aluno.setId(1L);
        aluno.setNome("João");
        aluno.setEmail("joao@test.com");
        when(alunoRepository.findById(1L)).thenReturn(Optional.of(aluno));

        var dto = alunoService.buscarPorId(1L);

        assertThat(dto.getId()).isEqualTo(1L);
        assertThat(dto.getNome()).isEqualTo("João");
        assertThat(dto.getEmail()).isEqualTo("joao@test.com");
    }

    @Test
    void criar_quandoEmailJaExiste_lancaExcecao() {
        AlunoInput input = new AlunoInput();
        input.setNome("João");
        input.setEmail("joao@test.com");
        when(alunoRepository.existsByEmail("joao@test.com")).thenReturn(true);

        assertThatThrownBy(() -> alunoService.criar(input))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("e-mail");
    }

    @Test
    void criar_quandoCpfInvalido_lancaExcecao() {
        AlunoInput input = new AlunoInput();
        input.setNome("João");
        input.setEmail("joao@test.com");
        input.setCpf("111.111.111-11");
        when(alunoRepository.existsByEmail(any())).thenReturn(false);
        when(usuarioRepository.existsByEmail(any())).thenReturn(false);

        assertThatThrownBy(() -> alunoService.criar(input))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("CPF inválido");
    }

    @Test
    void criar_sucesso_retornaDTO() {
        AlunoInput input = new AlunoInput();
        input.setNome("João");
        input.setEmail("joao@test.com");
        input.setCpf("529.982.247-25");
        when(alunoRepository.existsByEmail(any())).thenReturn(false);
        when(usuarioRepository.existsByEmail(any())).thenReturn(false);
        when(alunoRepository.findByNomeTrimEqualsIgnoreCase("João")).thenReturn(List.of());
        Aluno salvo = new Aluno();
        salvo.setId(1L);
        salvo.setNome("João");
        salvo.setEmail("joao@test.com");
        when(alunoRepository.save(any(Aluno.class))).thenReturn(salvo);

        var dto = alunoService.criar(input);

        assertThat(dto.getId()).isEqualTo(1L);
        assertThat(dto.getNome()).isEqualTo("João");
        verify(auditService).registrar(eq("CRIAR"), eq("alunos"), eq("1"), any(), any());
    }

    @Test
    void excluir_quandoPossuiMatricula_lancaExcecao() {
        Aluno aluno = new Aluno();
        aluno.setId(1L);
        when(alunoRepository.findById(1L)).thenReturn(Optional.of(aluno));
        when(matriculaRepository.findByAlunoId(1L)).thenReturn(List.of(new br.com.newmusic.domain.Matricula()));

        assertThatThrownBy(() -> alunoService.excluir(1L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("matrícula");
    }

    @Test
    void excluir_sucesso() {
        Aluno aluno = new Aluno();
        aluno.setId(1L);
        aluno.setNome("João");
        aluno.setEmail("joao@test.com");
        when(alunoRepository.findById(1L)).thenReturn(Optional.of(aluno));
        when(matriculaRepository.findByAlunoId(1L)).thenReturn(List.of());
        when(mensalidadeRepository.existsByAlunoIdAndStatus(1L, br.com.newmusic.domain.StatusMensalidade.PAGO)).thenReturn(false);

        alunoService.excluir(1L);

        verify(alunoRepository).delete(aluno);
        verify(auditService).registrar(eq("EXCLUIR"), eq("alunos"), eq("1"), any(), any());
    }
}
