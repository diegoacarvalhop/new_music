package br.com.newmusic.service;

import br.com.newmusic.domain.Professor;
import br.com.newmusic.repository.PresencaProfessorRepository;
import br.com.newmusic.repository.PresencaRepository;
import br.com.newmusic.repository.ProfessorRepository;
import br.com.newmusic.repository.TurmaRepository;
import br.com.newmusic.repository.UsuarioRepository;
import br.com.newmusic.web.dto.ProfessorInput;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProfessorServiceTest {

    @Mock
    private ProfessorRepository professorRepository;
    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private TurmaRepository turmaRepository;
    @Mock
    private br.com.newmusic.repository.MatriculaRepository matriculaRepository;
    @Mock
    private PresencaProfessorRepository presencaProfessorRepository;
    @Mock
    private PresencaRepository presencaRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private AuditService auditService;

    @InjectMocks
    private ProfessorService professorService;

    @Test
    void buscarPorId_quandoNaoExiste_lancaExcecao() {
        when(professorRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> professorService.buscarPorId(999L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Professor não encontrado");
    }

    @Test
    void criar_quandoEmailJaExiste_lancaExcecao() {
        ProfessorInput input = new ProfessorInput();
        input.setNome("Maria");
        input.setEmail("maria@test.com");
        input.setCpf("529.982.247-25");
        when(professorRepository.existsByEmail("maria@test.com")).thenReturn(true);

        assertThatThrownBy(() -> professorService.criar(input))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("e-mail");
    }

    @Test
    void criar_quandoCpfInvalido_lancaExcecao() {
        ProfessorInput input = new ProfessorInput();
        input.setNome("Maria");
        input.setEmail("maria@test.com");
        input.setCpf("111.111.111-11");
        when(professorRepository.existsByEmail(any())).thenReturn(false);
        when(usuarioRepository.existsByEmail(any())).thenReturn(false);

        assertThatThrownBy(() -> professorService.criar(input))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("CPF inválido");
    }

    @Test
    void criar_sucesso_retornaDTO() {
        ProfessorInput input = new ProfessorInput();
        input.setNome("Maria");
        input.setEmail("maria@test.com");
        input.setCpf("529.982.247-25");
        when(professorRepository.existsByEmail(any())).thenReturn(false);
        when(usuarioRepository.existsByEmail(any())).thenReturn(false);
        when(professorRepository.findByNomeTrimEqualsIgnoreCase("Maria")).thenReturn(List.of());
        Professor salvo = new Professor();
        salvo.setId(1L);
        salvo.setNome("Maria");
        salvo.setEmail("maria@test.com");
        when(professorRepository.save(any(Professor.class))).thenReturn(salvo);

        var dto = professorService.criar(input);

        assertThat(dto.getId()).isEqualTo(1L);
        assertThat(dto.getNome()).isEqualTo("Maria");
        verify(auditService).registrar(eq("CRIAR"), eq("professores"), eq("1"), any(), any());
    }

    @Test
    void excluir_quandoPossuiTurmasComAlunos_lancaExcecao() {
        Professor prof = new Professor();
        prof.setId(1L);
        br.com.newmusic.domain.Turma turma = new br.com.newmusic.domain.Turma();
        turma.setId(10L);
        when(professorRepository.findById(1L)).thenReturn(Optional.of(prof));
        when(turmaRepository.findByProfessor_IdOrderById(1L)).thenReturn(List.of(turma));
        when(matriculaRepository.countByTurmaIdAndAtivoTrue(10L)).thenReturn(1L);

        assertThatThrownBy(() -> professorService.excluir(1L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("turmas com alunos");
    }

    @Test
    void excluir_sucesso() {
        Professor prof = new Professor();
        prof.setId(1L);
        prof.setNome("Maria");
        when(professorRepository.findById(1L)).thenReturn(Optional.of(prof));
        when(turmaRepository.findByProfessor_IdOrderById(1L)).thenReturn(List.of());
        when(presencaProfessorRepository.findByProfessorId(1L)).thenReturn(List.of());

        professorService.excluir(1L);

        verify(professorRepository).delete(prof);
        verify(auditService).registrar(eq("EXCLUIR"), eq("professores"), eq("1"), any(), any());
    }
}
