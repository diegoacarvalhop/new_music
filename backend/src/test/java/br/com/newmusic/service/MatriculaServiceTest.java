package br.com.newmusic.service;

import br.com.newmusic.domain.*;
import br.com.newmusic.repository.*;
import br.com.newmusic.web.dto.MatriculaInput;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MatriculaServiceTest {

    @Mock
    private MatriculaRepository matriculaRepository;
    @Mock
    private AlunoRepository alunoRepository;
    @Mock
    private TurmaRepository turmaRepository;
    @Mock
    private MensalidadeRepository mensalidadeRepository;
    @Mock
    private MensalidadeService mensalidadeService;
    @Mock
    private AuditService auditService;

    @InjectMocks
    private MatriculaService matriculaService;

    @Test
    void buscarPorId_quandoNaoExiste_lancaExcecao() {
        when(matriculaRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> matriculaService.buscarPorId(999L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Matrícula não encontrada");
    }

    @Test
    void criar_quandoAlunoNaoEncontrado_lancaExcecao() {
        MatriculaInput input = new MatriculaInput();
        input.setAlunoId(999L);
        input.setTurmaId(1L);
        input.setDataInicio(LocalDate.now());
        when(alunoRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> matriculaService.criar(input))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Aluno não encontrado");
    }

    @Test
    void criar_quandoAlunoInativo_lancaExcecao() {
        MatriculaInput input = new MatriculaInput();
        input.setAlunoId(1L);
        input.setTurmaId(1L);
        input.setDataInicio(LocalDate.now());
        Aluno aluno = new Aluno();
        aluno.setId(1L);
        aluno.setAtivo(false);
        when(alunoRepository.findById(1L)).thenReturn(Optional.of(aluno));

        assertThatThrownBy(() -> matriculaService.criar(input))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("ativos");
    }

    @Test
    void criar_quandoTurmaNaoEncontrada_lancaExcecao() {
        MatriculaInput input = new MatriculaInput();
        input.setAlunoId(1L);
        input.setTurmaId(999L);
        input.setDataInicio(LocalDate.now());
        Aluno aluno = new Aluno();
        aluno.setId(1L);
        aluno.setAtivo(true);
        when(alunoRepository.findById(1L)).thenReturn(Optional.of(aluno));
        when(turmaRepository.findByIdWithHorarios(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> matriculaService.criar(input))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Turma não encontrada");
    }

    @Test
    void excluir_sucesso() {
        Aluno aluno = new Aluno();
        aluno.setId(10L);
        aluno.setNome("João");
        Turma turma = new Turma();
        turma.setId(1L);
        Instrumento inst = new Instrumento();
        inst.setNome("Violão");
        Professor prof = new Professor();
        prof.setNome("Maria");
        turma.setInstrumento(inst);
        turma.setProfessor(prof);
        Matricula mat = new Matricula();
        mat.setId(100L);
        mat.setAluno(aluno);
        mat.setTurma(turma);
        mat.setDataInicio(LocalDate.now());
        mat.setDataFim(LocalDate.now().plusMonths(12));
        when(matriculaRepository.findById(100L)).thenReturn(Optional.of(mat));

        matriculaService.excluir(100L);

        verify(mensalidadeService).excluirPorMatriculaId(eq(100L), eq(10L), any(), any());
        verify(matriculaRepository).delete(mat);
        verify(auditService).registrar(eq("EXCLUIR"), eq("matriculas"), eq("100"), any(), any());
    }
}
