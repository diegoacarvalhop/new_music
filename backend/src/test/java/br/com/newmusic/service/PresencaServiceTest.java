package br.com.newmusic.service;

import br.com.newmusic.domain.*;
import br.com.newmusic.repository.MatriculaRepository;
import br.com.newmusic.repository.PresencaRepository;
import br.com.newmusic.repository.TurmaRepository;
import br.com.newmusic.web.dto.PresencaLoteInput;
import org.junit.jupiter.api.BeforeEach;
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
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PresencaServiceTest {

    @Mock
    private PresencaRepository presencaRepository;

    @Mock
    private TurmaRepository turmaRepository;

    @Mock
    private MatriculaRepository matriculaRepository;

    @Mock
    private MensalidadeService mensalidadeService;

    @Mock
    private br.com.newmusic.service.AuditService auditService;

    @InjectMocks
    private PresencaService presencaService;

    private Turma turma;
    private Aluno aluno;
    private Matricula matricula;
    private PresencaLoteInput input;

    private static final LocalDate SEGUNDA_PASSADA = LocalDate.of(2025, 2, 3);

    @BeforeEach
    void setUp() {
        turma = new Turma();
        turma.setId(1L);
        TurmaHorario horario = new TurmaHorario();
        horario.setDiaSemana(1);
        turma.setHorarios(List.of(horario));

        aluno = new Aluno();
        aluno.setId(10L);
        aluno.setNome("Aluno Teste");

        matricula = new Matricula();
        matricula.setId(100L);
        matricula.setAluno(aluno);
        matricula.setTurma(turma);

        input = new PresencaLoteInput();
        input.setDataAula(SEGUNDA_PASSADA);
        PresencaLoteInput.PresencaRegistroInput reg = new PresencaLoteInput.PresencaRegistroInput();
        reg.setMatriculaId(100L);
        reg.setPresente(true);
        input.setRegistros(List.of(reg));
    }

    @Test
    void salvarLote_quandoAlunoNaoEstaEmDia_comPresenteTrue_lancaExcecao() {
        when(turmaRepository.findById(1L)).thenReturn(Optional.of(turma));
        when(matriculaRepository.findById(100L)).thenReturn(Optional.of(matricula));
        when(mensalidadeService.alunoPagamentoEmDia(10L)).thenReturn(false);

        assertThatThrownBy(() -> presencaService.salvarLote(1L, input))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("não está em dia")
                .hasMessageContaining("Aluno Teste");

        verify(presencaRepository, never()).save(any());
    }

    @Test
    void salvarLote_quandoAlunoEstaEmDia_salvaPresenca() {
        when(turmaRepository.findById(1L)).thenReturn(Optional.of(turma));
        when(matriculaRepository.findById(100L)).thenReturn(Optional.of(matricula));
        when(mensalidadeService.alunoPagamentoEmDia(10L)).thenReturn(true);
        when(presencaRepository.findByTurmaIdAndMatriculaIdAndDataAula(1L, 100L, input.getDataAula()))
                .thenReturn(Optional.empty());
        when(presencaRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(presencaRepository.findByTurmaIdAndDataAulaOrderByMatricula_Aluno_Nome(1L, input.getDataAula()))
                .thenReturn(List.of());

        presencaService.salvarLote(1L, input);

        verify(presencaRepository).save(any(Presenca.class));
    }
}
