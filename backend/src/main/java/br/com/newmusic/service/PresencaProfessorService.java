package br.com.newmusic.service;

import br.com.newmusic.domain.PresencaProfessor;
import br.com.newmusic.domain.Professor;
import br.com.newmusic.domain.Turma;
import br.com.newmusic.repository.PresencaProfessorRepository;
import br.com.newmusic.repository.ProfessorRepository;
import br.com.newmusic.repository.TurmaRepository;
import br.com.newmusic.web.dto.PresencaProfessorDTO;
import br.com.newmusic.web.dto.PresencaProfessorLoteInput;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PresencaProfessorService {

    private final PresencaProfessorRepository presencaProfessorRepository;
    private final ProfessorRepository professorRepository;
    private final TurmaRepository turmaRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<PresencaProfessorDTO> listarChamadaPorProfessorEData(Long professorId, LocalDate dataAula) {
        Professor professor = professorRepository.findById(professorId).orElseThrow(() -> new IllegalArgumentException("Professor não encontrado"));
        List<Turma> turmasProfessor = turmaRepository.findByProfessorIdWithHorarios(professorId);
        int diaSemana = dataAula.getDayOfWeek().getValue();
        List<Turma> turmasNoDia = turmasProfessor.stream()
                .filter(t -> t.getHorarios().stream().anyMatch(h -> h.getDiaSemana() != null && h.getDiaSemana() == diaSemana))
                .collect(Collectors.toList());
        List<PresencaProfessor> existentes = presencaProfessorRepository.findByProfessorIdAndDataAulaOrderByTurma_Id(professorId, dataAula);
        Map<Long, PresencaProfessor> porTurma = existentes.stream().collect(Collectors.toMap(p -> p.getTurma().getId(), p -> p));
        return turmasNoDia.stream().map(turma -> {
            PresencaProfessor p = porTurma.get(turma.getId());
            if (p != null) {
                return toDTO(p);
            }
            return PresencaProfessorDTO.builder()
                    .professorId(professorId)
                    .turmaId(turma.getId())
                    .turmaDescricao(turma.getInstrumento().getNome() + " — " + turma.getProfessor().getNome())
                    .dataAula(dataAula)
                    .presente(true)
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional
    public List<PresencaProfessorDTO> salvarLote(Long professorId, PresencaProfessorLoteInput input) {
        Professor professor = professorRepository.findById(professorId).orElseThrow(() -> new IllegalArgumentException("Professor não encontrado"));
        LocalDate data = input.getDataAula();
        if (data.isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("Não é possível fazer chamada em data futura. Selecione uma data até hoje.");
        }
        for (PresencaProfessorLoteInput.RegistroInput reg : input.getRegistros()) {
            Turma turma = turmaRepository.findById(reg.getTurmaId()).orElseThrow(() -> new IllegalArgumentException("Turma não encontrada: " + reg.getTurmaId()));
            if (!turma.getProfessor().getId().equals(professorId)) {
                throw new IllegalArgumentException("Turma não pertence a este professor");
            }
            boolean presente = reg.getPresente() == null || reg.getPresente();
            PresencaProfessor presenca = presencaProfessorRepository.findByProfessorIdAndTurmaIdAndDataAula(professorId, reg.getTurmaId(), data).orElse(null);
            if (presenca != null) {
                presenca.setPresente(presente);
                presencaProfessorRepository.save(presenca);
                auditService.registrar("ATUALIZAR", "presencas-professores", String.valueOf(presenca.getId()), "Alterou presença do professor " + professor.getNome() + " na turma " + turma.getInstrumento().getNome() + " na data " + data + " (id " + presenca.getId() + ")", presente ? "Presença: Sim" : "Presença: Não");
            } else {
                presenca = PresencaProfessor.builder()
                        .professor(professor)
                        .turma(turma)
                        .dataAula(data)
                        .presente(presente)
                        .build();
                presencaProfessorRepository.save(presenca);
                auditService.registrar("CRIAR", "presencas-professores", String.valueOf(presenca.getId()), "Registrou presença do professor " + professor.getNome() + " na turma " + turma.getInstrumento().getNome() + " na data " + data + " (id " + presenca.getId() + ")", presente ? "Presença: Sim" : "Presença: Não");
            }
        }
        return listarChamadaPorProfessorEData(professorId, data);
    }

    @Transactional(readOnly = true)
    public List<PresencaProfessorDTO> listarPorProfessorEMes(Long professorId, int ano, int mes) {
        YearMonth ym = YearMonth.of(ano, mes);
        LocalDate start = ym.atDay(1);
        LocalDate end = ym.atEndOfMonth();
        return presencaProfessorRepository.findByProfessorIdAndDataAulaBetweenOrderByDataAulaAscTurma_Id(professorId, start, end)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    private PresencaProfessorDTO toDTO(PresencaProfessor p) {
        Turma t = p.getTurma();
        String turmaDescricao = t.getInstrumento().getNome() + " — " + t.getProfessor().getNome();
        return PresencaProfessorDTO.builder()
                .id(p.getId())
                .professorId(p.getProfessor().getId())
                .turmaId(p.getTurma().getId())
                .turmaDescricao(turmaDescricao)
                .dataAula(p.getDataAula())
                .presente(p.getPresente())
                .build();
    }
}
