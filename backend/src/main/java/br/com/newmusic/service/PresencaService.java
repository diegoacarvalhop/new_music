package br.com.newmusic.service;

import br.com.newmusic.domain.Matricula;
import br.com.newmusic.domain.Presenca;
import br.com.newmusic.domain.Turma;
import br.com.newmusic.domain.TurmaHorario;
import br.com.newmusic.repository.MatriculaRepository;
import br.com.newmusic.repository.PresencaRepository;
import br.com.newmusic.repository.TurmaRepository;
import br.com.newmusic.web.dto.PresencaDTO;
import br.com.newmusic.web.dto.PresencaLoteInput;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PresencaService {

    private final PresencaRepository presencaRepository;
    private final TurmaRepository turmaRepository;
    private final MatriculaRepository matriculaRepository;
    private final MensalidadeService mensalidadeService;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<PresencaDTO> listarPorTurmaEData(Long turmaId, LocalDate dataAula) {
        return presencaRepository.findByTurmaIdAndDataAulaOrderByMatricula_Aluno_Nome(turmaId, dataAula)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PresencaDTO> listarPorTurmaMatriculaEMes(Long turmaId, Long matriculaId, int ano, int mes) {
        YearMonth ym = YearMonth.of(ano, mes);
        LocalDate start = ym.atDay(1);
        LocalDate end = ym.atEndOfMonth();
        return presencaRepository.findByTurmaIdAndMatriculaIdAndDataAulaBetweenOrderByDataAulaAsc(turmaId, matriculaId, start, end)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PresencaDTO> listarChamadaPorTurmaEData(Long turmaId, LocalDate dataAula) {
        Turma turma = turmaRepository.findById(turmaId).orElseThrow(() -> new IllegalArgumentException("Turma não encontrada"));
        Set<Integer> diasAula = diasAulaDaTurma(turma);
        int diaDaData = dataAula.getDayOfWeek().getValue();
        if (!diasAula.contains(diaDaData)) {
            return List.of();
        }
        List<Matricula> matriculas = matriculaRepository.findByTurmaId(turmaId);
        List<Presenca> existentes = presencaRepository.findByTurmaIdAndDataAulaOrderByMatricula_Aluno_Nome(turmaId, dataAula);
        var porMatricula = existentes.stream().collect(Collectors.toMap(p -> p.getMatricula().getId(), p -> p));
        return matriculas.stream().map(m -> {
            boolean pagamentoEmDia = mensalidadeService.alunoPagamentoEmDia(m.getAluno().getId());
            Presenca p = porMatricula.get(m.getId());
            if (p != null) {
                return toDTO(p, pagamentoEmDia);
            }
            return PresencaDTO.builder()
                    .turmaId(turmaId)
                    .matriculaId(m.getId())
                    .alunoNome(m.getAluno().getNome())
                    .dataAula(dataAula)
                    .presente(true)
                    .conteudoAula(null)
                    .pagamentoEmDia(pagamentoEmDia)
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional
    public List<PresencaDTO> salvarLote(Long turmaId, PresencaLoteInput input) {
        Turma turma = turmaRepository.findById(turmaId).orElseThrow(() -> new IllegalArgumentException("Turma não encontrada"));
        LocalDate data = input.getDataAula();
        if (data.isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("Não é possível fazer chamada em data futura. Selecione uma data até hoje.");
        }
        Set<Integer> diasAula = diasAulaDaTurma(turma);
        int diaDaData = data.getDayOfWeek().getValue();
        if (!diasAula.contains(diaDaData)) {
            throw new IllegalArgumentException("Não há aula desta turma nesta data. Selecione um dia em que a turma tem aula.");
        }
        for (PresencaLoteInput.PresencaRegistroInput reg : input.getRegistros()) {
            Matricula matricula = matriculaRepository.findById(reg.getMatriculaId())
                    .orElseThrow(() -> new IllegalArgumentException("Matrícula não encontrada: " + reg.getMatriculaId()));
            if (!matricula.getTurma().getId().equals(turmaId)) {
                throw new IllegalArgumentException("Matrícula não pertence a esta turma");
            }
            boolean presente = reg.getPresente() == null || reg.getPresente();
            if (presente && !mensalidadeService.alunoPagamentoEmDia(matricula.getAluno().getId())) {
                throw new IllegalArgumentException(
                    "Não é possível marcar presença para " + matricula.getAluno().getNome()
                    + ": aluno não está em dia com as mensalidades. Regularize o pagamento no financeiro.");
            }
            Presenca presenca = presencaRepository.findByTurmaIdAndMatriculaIdAndDataAula(turmaId, reg.getMatriculaId(), data)
                    .orElse(null);
            String conteudoAula = reg.getConteudoAula() != null && !reg.getConteudoAula().isBlank() ? reg.getConteudoAula().trim() : null;
            if (presenca != null) {
                presenca.setPresente(presente);
                presenca.setConteudoAula(conteudoAula);
                presencaRepository.save(presenca);
                auditService.registrar("ATUALIZAR", "presencas", String.valueOf(presenca.getId()), "Alterou presença do aluno " + matricula.getAluno().getNome() + " na data " + data + " (id " + presenca.getId() + ")", (presente ? "Presença: Sim" : "Presença: Não") + (conteudoAula != null ? ", Conteúdo: " + conteudoAula : ""));
            } else {
                presenca = Presenca.builder()
                        .turma(turma)
                        .matricula(matricula)
                        .dataAula(data)
                        .presente(presente)
                        .conteudoAula(conteudoAula)
                        .build();
                presencaRepository.save(presenca);
                auditService.registrar("CRIAR", "presencas", String.valueOf(presenca.getId()), "Registrou presença do aluno " + matricula.getAluno().getNome() + " na data " + data + " (id " + presenca.getId() + ")", (presente ? "Presença: Sim" : "Presença: Não") + (conteudoAula != null ? ", Conteúdo: " + conteudoAula : ""));
            }
        }
        return listarPorTurmaEData(turmaId, data);
    }

    private Set<Integer> diasAulaDaTurma(Turma turma) {
        if (turma.getHorarios() != null && !turma.getHorarios().isEmpty()) {
            return turma.getHorarios().stream()
                    .map(TurmaHorario::getDiaSemana)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());
        }
        if (turma.getDiaSemana() != null) {
            return Set.of(turma.getDiaSemana());
        }
        return Set.of();
    }

    private PresencaDTO toDTO(Presenca p) {
        boolean pagamentoEmDia = mensalidadeService.alunoPagamentoEmDia(p.getMatricula().getAluno().getId());
        return toDTO(p, pagamentoEmDia);
    }

    private PresencaDTO toDTO(Presenca p, boolean pagamentoEmDia) {
        return PresencaDTO.builder()
                .id(p.getId())
                .turmaId(p.getTurma().getId())
                .matriculaId(p.getMatricula().getId())
                .alunoNome(p.getMatricula().getAluno().getNome())
                .dataAula(p.getDataAula())
                .presente(p.getPresente())
                .conteudoAula(p.getConteudoAula())
                .pagamentoEmDia(pagamentoEmDia)
                .build();
    }
}
