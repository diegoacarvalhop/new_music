package br.com.newmusic.service;

import br.com.newmusic.domain.Grupo;
import br.com.newmusic.repository.AlunoRepository;
import br.com.newmusic.repository.AuditLogRepository;
import br.com.newmusic.repository.ErrorLogRepository;
import br.com.newmusic.repository.GrupoRepository;
import br.com.newmusic.repository.InstrumentoRepository;
import br.com.newmusic.repository.MatriculaRepository;
import br.com.newmusic.repository.MensalidadeRepository;
import br.com.newmusic.repository.PresencaProfessorRepository;
import br.com.newmusic.repository.PresencaRepository;
import br.com.newmusic.repository.ProfessorRepository;
import br.com.newmusic.repository.TurmaRepository;
import br.com.newmusic.repository.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReportServiceTest {

    @Mock
    private GrupoRepository grupoRepository;
    @Mock
    private InstrumentoRepository instrumentoRepository;
    @Mock
    private AlunoRepository alunoRepository;
    @Mock
    private ProfessorRepository professorRepository;
    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private TurmaRepository turmaRepository;
    @Mock
    private MatriculaRepository matriculaRepository;
    @Mock
    private MensalidadeRepository mensalidadeRepository;
    @Mock
    private PresencaRepository presencaRepository;
    @Mock
    private PresencaProfessorRepository presencaProfessorRepository;
    @Mock
    private AuditLogRepository auditLogRepository;
    @Mock
    private ErrorLogRepository errorLogRepository;

    @InjectMocks
    private ReportService reportService;

    @Test
    void relatorioGrupos_retornaListaOrdenadaPorId() {
        Grupo g1 = new Grupo();
        g1.setId(1L);
        g1.setNome("Cordas");
        Grupo g2 = new Grupo();
        g2.setId(2L);
        g2.setNome("Canto");
        when(grupoRepository.findAll()).thenReturn(List.of(g2, g1));
        when(instrumentoRepository.findByGrupoIdOrderByNomeAsc(1L)).thenReturn(List.of());
        when(instrumentoRepository.findByGrupoIdOrderByNomeAsc(2L)).thenReturn(List.of());

        var result = reportService.relatorioGrupos();

        assertThat(result).hasSize(2);
        assertThat(result.get(0).get("id")).isEqualTo(1L);
        assertThat(result.get(0).get("nome")).isEqualTo("Cordas");
        assertThat(result.get(1).get("id")).isEqualTo(2L);
        assertThat(result.get(1).get("nome")).isEqualTo("Canto");
    }

    @Test
    void relatorioConsolidadoDashboard_retornaContagens() {
        when(alunoRepository.count()).thenReturn(10L);
        when(professorRepository.count()).thenReturn(3L);
        when(turmaRepository.count()).thenReturn(5L);
        when(mensalidadeRepository.countDistinctAlunoByStatus(br.com.newmusic.domain.StatusMensalidade.ATRASADO)).thenReturn(1L);
        when(turmaRepository.findAllWithHorariosAndInstrumentoAndProfessor()).thenReturn(List.of());
        when(matriculaRepository.findAll()).thenReturn(List.of());

        var result = reportService.relatorioConsolidadoDashboard();

        assertThat(result).containsEntry("alunos", 10L);
        assertThat(result).containsEntry("professores", 3L);
        assertThat(result).containsEntry("turmas", 5L);
        assertThat(result).containsKey("matriculasAtivas");
        assertThat(result).containsEntry("alunosComPagamentoAtrasado", 1L);
        assertThat(result).containsKey("aulasHoje");
    }
}
