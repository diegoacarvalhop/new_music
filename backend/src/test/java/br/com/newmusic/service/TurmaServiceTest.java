package br.com.newmusic.service;

import br.com.newmusic.domain.Instrumento;
import br.com.newmusic.domain.Professor;
import br.com.newmusic.domain.Turma;
import br.com.newmusic.repository.*;
import br.com.newmusic.web.dto.TurmaInput;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TurmaServiceTest {

    @Mock
    private TurmaRepository turmaRepository;
    @Mock
    private InstrumentoRepository instrumentoRepository;
    @Mock
    private ProfessorRepository professorRepository;
    @Mock
    private MatriculaRepository matriculaRepository;
    @Mock
    private MensalidadeRepository mensalidadeRepository;
    @Mock
    private PresencaRepository presencaRepository;
    @Mock
    private PresencaProfessorRepository presencaProfessorRepository;
    @Mock
    private AuditService auditService;

    @InjectMocks
    private TurmaService turmaService;

    @Test
    void buscarPorId_quandoNaoExiste_lancaExcecao() {
        when(turmaRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> turmaService.buscarPorId(999L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Turma não encontrada");
    }

    @Test
    void criar_quandoInstrumentoNaoEncontrado_lancaExcecao() {
        TurmaInput input = new TurmaInput();
        input.setInstrumentoId(999L);
        input.setProfessorId(1L);
        input.setHorarios(List.of(horarioSlot(1, "09:00")));
        when(instrumentoRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> turmaService.criar(input))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Instrumento não encontrado");
    }

    @Test
    void criar_quandoDiaSemanaInvalido_lancaExcecao() {
        TurmaInput input = new TurmaInput();
        input.setInstrumentoId(1L);
        input.setProfessorId(1L);
        TurmaInput.HorarioSlotInput slot = new TurmaInput.HorarioSlotInput();
        slot.setDiaSemana(0);
        slot.setHorarioInicio(LocalTime.of(9, 0));
        input.setHorarios(List.of(slot));
        when(instrumentoRepository.findById(1L)).thenReturn(Optional.of(new Instrumento()));
        when(professorRepository.findById(1L)).thenReturn(Optional.of(new Professor()));

        assertThatThrownBy(() -> turmaService.criar(input))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Dia da semana");
    }

    @Test
    void excluir_quandoPossuiMatriculas_lancaExcecao() {
        Turma turma = new Turma();
        turma.setId(1L);
        when(turmaRepository.findById(1L)).thenReturn(Optional.of(turma));
        when(matriculaRepository.findByTurmaId(1L)).thenReturn(List.of(new br.com.newmusic.domain.Matricula()));

        assertThatThrownBy(() -> turmaService.excluir(1L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("não pode ser excluída");
    }

    @Test
    void excluir_sucesso() {
        Turma turma = new Turma();
        turma.setId(1L);
        Instrumento inst = new Instrumento();
        inst.setNome("Violão");
        Professor prof = new Professor();
        prof.setNome("Maria");
        turma.setInstrumento(inst);
        turma.setProfessor(prof);
        when(turmaRepository.findById(1L)).thenReturn(Optional.of(turma));
        when(matriculaRepository.findByTurmaId(1L)).thenReturn(List.of());
        when(presencaRepository.findByTurmaId(1L)).thenReturn(List.of());
        when(presencaProfessorRepository.findByTurmaId(1L)).thenReturn(List.of());

        turmaService.excluir(1L);

        verify(turmaRepository).delete(turma);
        verify(auditService).registrar(eq("EXCLUIR"), eq("turmas"), eq("1"), any(), any());
    }

    @Test
    void turmaPertenceAoProfessor_retornaTrueQuandoPertence() {
        Turma turma = new Turma();
        Professor prof = new Professor();
        prof.setId(5L);
        turma.setProfessor(prof);
        when(turmaRepository.findById(1L)).thenReturn(Optional.of(turma));

        boolean result = turmaService.turmaPertenceAoProfessor(1L, 5L);

        assertThat(result).isTrue();
    }

    @Test
    void turmaPertenceAoProfessor_retornaFalseQuandoNaoPertence() {
        Turma turma = new Turma();
        Professor prof = new Professor();
        prof.setId(5L);
        turma.setProfessor(prof);
        when(turmaRepository.findById(1L)).thenReturn(Optional.of(turma));

        boolean result = turmaService.turmaPertenceAoProfessor(1L, 99L);

        assertThat(result).isFalse();
    }

    private static TurmaInput.HorarioSlotInput horarioSlot(int dia, String hora) {
        TurmaInput.HorarioSlotInput slot = new TurmaInput.HorarioSlotInput();
        slot.setDiaSemana(dia);
        String[] parts = hora.split(":");
        slot.setHorarioInicio(LocalTime.of(Integer.parseInt(parts[0]), Integer.parseInt(parts[1])));
        return slot;
    }
}
