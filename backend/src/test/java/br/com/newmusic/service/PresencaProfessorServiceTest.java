package br.com.newmusic.service;

import br.com.newmusic.domain.Professor;
import br.com.newmusic.domain.Turma;
import br.com.newmusic.repository.PresencaProfessorRepository;
import br.com.newmusic.repository.ProfessorRepository;
import br.com.newmusic.repository.TurmaRepository;
import br.com.newmusic.web.dto.PresencaProfessorLoteInput;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PresencaProfessorServiceTest {

    @Mock
    private PresencaProfessorRepository presencaProfessorRepository;
    @Mock
    private ProfessorRepository professorRepository;
    @Mock
    private TurmaRepository turmaRepository;
    @Mock
    private AuditService auditService;

    @InjectMocks
    private PresencaProfessorService presencaProfessorService;

    @Test
    void listarChamadaPorProfessorEData_quandoProfessorNaoEncontrado_lancaExcecao() {
        when(professorRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> presencaProfessorService.listarChamadaPorProfessorEData(999L, LocalDate.now()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Professor não encontrado");
    }

    @Test
    void listarChamadaPorProfessorEData_retornaListaVaziaQuandoNenhumaTurmaNoDia() {
        Professor prof = new Professor();
        prof.setId(1L);
        when(professorRepository.findById(1L)).thenReturn(Optional.of(prof));
        when(turmaRepository.findByProfessorIdWithHorarios(1L)).thenReturn(List.of());
        when(presencaProfessorRepository.findByProfessorIdAndDataAulaOrderByTurma_Id(1L, LocalDate.of(2025, 2, 17))).thenReturn(List.of());

        var result = presencaProfessorService.listarChamadaPorProfessorEData(1L, LocalDate.of(2025, 2, 17));

        assertThat(result).isEmpty();
    }

    @Test
    void salvarLote_quandoDataFutura_lancaExcecao() {
        Professor prof = new Professor();
        prof.setId(1L);
        PresencaProfessorLoteInput input = new PresencaProfessorLoteInput();
        input.setDataAula(LocalDate.now().plusDays(1));
        input.setRegistros(List.of());
        when(professorRepository.findById(1L)).thenReturn(Optional.of(prof));

        assertThatThrownBy(() -> presencaProfessorService.salvarLote(1L, input))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("data futura");
    }

    @Test
    void salvarLote_quandoTurmaNaoPertenceAoProfessor_lancaExcecao() {
        Professor prof = new Professor();
        prof.setId(1L);
        prof.setNome("Maria");
        Turma turma = new Turma();
        turma.setId(10L);
        Professor outroProf = new Professor();
        outroProf.setId(99L);
        turma.setProfessor(outroProf);
        PresencaProfessorLoteInput input = new PresencaProfessorLoteInput();
        input.setDataAula(LocalDate.now());
        PresencaProfessorLoteInput.RegistroInput reg = new PresencaProfessorLoteInput.RegistroInput();
        reg.setTurmaId(10L);
        reg.setPresente(true);
        input.setRegistros(List.of(reg));
        when(professorRepository.findById(1L)).thenReturn(Optional.of(prof));
        when(turmaRepository.findById(10L)).thenReturn(Optional.of(turma));

        assertThatThrownBy(() -> presencaProfessorService.salvarLote(1L, input))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("não pertence a este professor");
    }
}
