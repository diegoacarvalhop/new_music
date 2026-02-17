package br.com.newmusic.service;

import br.com.newmusic.domain.Instrumento;
import br.com.newmusic.domain.Professor;
import br.com.newmusic.domain.Turma;
import br.com.newmusic.domain.TurmaHorario;
import br.com.newmusic.domain.StatusMensalidade;
import br.com.newmusic.repository.MatriculaRepository;
import br.com.newmusic.repository.MensalidadeRepository;
import br.com.newmusic.repository.PresencaProfessorRepository;
import br.com.newmusic.repository.PresencaRepository;
import br.com.newmusic.repository.InstrumentoRepository;
import br.com.newmusic.repository.ProfessorRepository;
import br.com.newmusic.repository.TurmaRepository;
import br.com.newmusic.web.dto.TurmaDTO;
import br.com.newmusic.web.dto.TurmaInput;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TurmaService {

    private final TurmaRepository turmaRepository;
    private final InstrumentoRepository instrumentoRepository;
    private final ProfessorRepository professorRepository;
    private final MatriculaRepository matriculaRepository;
    private final MensalidadeRepository mensalidadeRepository;
    private final PresencaRepository presencaRepository;
    private final PresencaProfessorRepository presencaProfessorRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<TurmaDTO> listar(Pageable pageable, String busca, Long professorIdFiltro) {
        String termo = busca != null ? busca.trim() : "";
        if (professorIdFiltro != null) {
            return turmaRepository.findByProfessor_IdAndInstrumentoNomeContainingIgnoreCase(professorIdFiltro, termo, pageable).map(this::toDTO);
        }
        if (termo.isEmpty()) {
            return turmaRepository.findAll(pageable).map(this::toDTO);
        }
        return turmaRepository.findByInstrumentoOuProfessor(termo, pageable).map(this::toDTO);
    }

    @Transactional(readOnly = true)
    public List<TurmaDTO> listarPorProfessor(Long professorId) {
        return turmaRepository.findByProfessorIdWithHorarios(professorId)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TurmaDTO buscarPorId(Long id) {
        Turma turma = turmaRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Turma não encontrada"));
        return toDTO(turma);
    }

    @Transactional(readOnly = true)
    public boolean turmaPertenceAoProfessor(Long turmaId, Long professorId) {
        return turmaRepository.findById(turmaId)
                .map(t -> t.getProfessor().getId().equals(professorId))
                .orElse(false);
    }

    @Transactional
    public TurmaDTO criar(TurmaInput input) {
        Instrumento instrumento = instrumentoRepository.findById(input.getInstrumentoId())
                .orElseThrow(() -> new IllegalArgumentException("Instrumento não encontrado"));
        Professor professor = professorRepository.findById(input.getProfessorId())
                .orElseThrow(() -> new IllegalArgumentException("Professor não encontrado"));
        for (TurmaInput.HorarioSlotInput slot : input.getHorarios()) {
            if (slot.getDiaSemana() < 1 || slot.getDiaSemana() > 5) {
                throw new IllegalArgumentException("Dia da semana deve ser entre 1 (segunda) e 5 (sexta)");
            }
        }
        Turma turma = Turma.builder()
                .capacidade(input.getCapacidade())
                .ativo(input.getAtivo() != null ? input.getAtivo() : true)
                .instrumento(instrumento)
                .professor(professor)
                .build();
        turma = turmaRepository.save(turma);
        Set<String> vistos = new HashSet<>();
        for (TurmaInput.HorarioSlotInput slot : input.getHorarios()) {
            String chave = slot.getDiaSemana() + "|" + slot.getHorarioInicio();
            if (!vistos.add(chave)) continue;
            var fim = slot.getHorarioFim() != null ? slot.getHorarioFim() : slot.getHorarioInicio().plusHours(1);
            TurmaHorario h = TurmaHorario.builder()
                    .turma(turma)
                    .diaSemana(slot.getDiaSemana())
                    .horarioInicio(slot.getHorarioInicio())
                    .horarioFim(fim)
                    .build();
            turma.getHorarios().add(h);
        }
        turma = turmaRepository.save(turma);
        String desc = instrumento.getNome() + " - " + professor.getNome();
        String conteudo = "Instrumento: " + instrumento.getNome() + ", Professor: " + professor.getNome() + ", Capacidade: " + turma.getCapacidade() + ", Horários: " + input.getHorarios().size();
        auditService.registrar("CRIAR", "turmas", String.valueOf(turma.getId()), "Criou a turma " + desc + " (id " + turma.getId() + ")", conteudo);
        return toDTO(turma);
    }

    @Transactional
    public TurmaDTO atualizar(Long id, TurmaInput input) {
        Turma turma = turmaRepository.findByIdWithHorarios(id).orElseThrow(() -> new IllegalArgumentException("Turma não encontrada"));
        Instrumento instrumento = instrumentoRepository.findById(input.getInstrumentoId())
                .orElseThrow(() -> new IllegalArgumentException("Instrumento não encontrado"));
        Professor professor = professorRepository.findById(input.getProfessorId())
                .orElseThrow(() -> new IllegalArgumentException("Professor não encontrado"));
        for (TurmaInput.HorarioSlotInput slot : input.getHorarios()) {
            if (slot.getDiaSemana() < 1 || slot.getDiaSemana() > 5) {
                throw new IllegalArgumentException("Dia da semana deve ser entre 1 (segunda) e 5 (sexta)");
            }
        }
        if (Boolean.FALSE.equals(input.getAtivo())) {
            if (!matriculaRepository.findByTurmaId(id).isEmpty()) {
                throw new IllegalArgumentException("Turma não pode ser inativada pois possui alunos associados.");
            }
            if (!presencaRepository.findByTurmaId(id).isEmpty() || !presencaProfessorRepository.findByTurmaId(id).isEmpty()) {
                throw new IllegalArgumentException("Turma não pode ser inativada pois possui registro(s) de presença.");
            }
        }
        turma.setCapacidade(input.getCapacidade());
        if (input.getAtivo() != null) turma.setAtivo(input.getAtivo());
        turma.setInstrumento(instrumento);
        turma.setProfessor(professor);
        Set<String> vistos = new HashSet<>();
        Set<String> chavesNovas = new HashSet<>();
        for (TurmaInput.HorarioSlotInput slot : input.getHorarios()) {
            String chave = slot.getDiaSemana() + "|" + slot.getHorarioInicio();
            if (!vistos.add(chave)) continue;
            chavesNovas.add(chave);
            var fim = slot.getHorarioFim() != null ? slot.getHorarioFim() : slot.getHorarioInicio().plusHours(1);
            TurmaHorario existente = turma.getHorarios().stream()
                    .filter(h -> chave.equals(h.getDiaSemana() + "|" + h.getHorarioInicio().toString()))
                    .findFirst()
                    .orElse(null);
            if (existente != null) {
                existente.setHorarioFim(fim);
            } else {
                TurmaHorario h = TurmaHorario.builder()
                        .turma(turma)
                        .diaSemana(slot.getDiaSemana())
                        .horarioInicio(slot.getHorarioInicio())
                        .horarioFim(fim)
                        .build();
                turma.getHorarios().add(h);
            }
        }
        turma.getHorarios().removeIf(h -> !chavesNovas.contains(h.getDiaSemana() + "|" + h.getHorarioInicio().toString()));
        turma = turmaRepository.save(turma);
        String desc = instrumento.getNome() + " - " + professor.getNome();
        auditService.registrar("ATUALIZAR", "turmas", String.valueOf(id), "Editou a turma " + desc + " (id " + id + ")", "Instrumento: " + instrumento.getNome() + ", Professor: " + professor.getNome() + ", Capacidade: " + input.getCapacidade());
        return toDTO(turma);
    }

    @Transactional
    public void excluir(Long id) {
        Turma turma = turmaRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Turma não encontrada"));
        if (!matriculaRepository.findByTurmaId(id).isEmpty()) {
            throw new IllegalArgumentException("Turma não pode ser excluída pois possui professor e alunos associados.");
        }
        if (!presencaRepository.findByTurmaId(id).isEmpty() || !presencaProfessorRepository.findByTurmaId(id).isEmpty()) {
            throw new IllegalArgumentException("Turma não pode ser excluída pois possui registro(s) de presença.");
        }
        String desc = (turma.getInstrumento() != null ? turma.getInstrumento().getNome() : "") + (turma.getProfessor() != null ? " - " + turma.getProfessor().getNome() : "");
        Long idTurma = turma.getId();
        turmaRepository.delete(turma);
        auditService.registrar("EXCLUIR", "turmas", String.valueOf(idTurma), "Excluiu a turma " + desc + " (id " + idTurma + ")", "Turma: " + desc);
    }

    private TurmaDTO toDTO(Turma turma) {
        var inst = turma.getInstrumento();
        List<TurmaDTO.HorarioSlotDTO> horariosDto = new ArrayList<>();
        if (turma.getHorarios() != null && !turma.getHorarios().isEmpty()) {
            for (TurmaHorario h : turma.getHorarios()) {
                var fim = h.getHorarioFim() != null ? h.getHorarioFim() : h.getHorarioInicio().plusHours(1);
                horariosDto.add(TurmaDTO.HorarioSlotDTO.builder()
                        .diaSemana(h.getDiaSemana())
                        .horarioInicio(h.getHorarioInicio())
                        .horarioFim(fim)
                        .build());
            }
        } else if (turma.getDiaSemana() != null && turma.getHorarioInicio() != null) {
            var inicio = turma.getHorarioInicio();
            horariosDto.add(TurmaDTO.HorarioSlotDTO.builder()
                    .diaSemana(turma.getDiaSemana())
                    .horarioInicio(inicio)
                    .horarioFim(inicio.plusHours(1))
                    .build());
        }
        Integer primeiroDia = horariosDto.isEmpty() ? null : horariosDto.get(0).getDiaSemana();
        var primeiroHorario = horariosDto.isEmpty() ? null : horariosDto.get(0).getHorarioInicio();
        long capacidadePreenchida = matriculaRepository.countByTurmaIdAndAtivoTrue(turma.getId());
        int aulasPorSemana = turma.getHorarios() != null ? turma.getHorarios().size() : (turma.getDiaSemana() != null ? 1 : 0);
        List<String> alunos = matriculaRepository.findByTurmaId(turma.getId()).stream()
                .filter(m -> Boolean.TRUE.equals(m.getAtivo()))
                .filter(m -> mensalidadeRepository.findByAlunoIdAndAnoAndMes(
                        m.getAluno().getId(),
                        m.getDataInicio().getYear(),
                        m.getDataInicio().getMonthValue())
                        .map(msg -> msg.getStatus() == StatusMensalidade.PAGO)
                        .orElse(false))
                .map(m -> m.getAluno().getNome())
                .sorted()
                .collect(Collectors.toList());
        return TurmaDTO.builder()
                .id(turma.getId())
                .diaSemana(primeiroDia)
                .horarioInicio(primeiroHorario)
                .capacidade(turma.getCapacidade())
                .capacidadePreenchida((int) capacidadePreenchida)
                .aulasPorSemana(aulasPorSemana)
                .alunos(alunos)
                .instrumentoId(inst.getId())
                .instrumentoNome(inst.getNome())
                .instrumentoGrupoId(inst.getGrupo() != null ? inst.getGrupo().getId() : null)
                .instrumentoGrupoNome(inst.getGrupo() != null ? inst.getGrupo().getNome() : null)
                .professorId(turma.getProfessor().getId())
                .professorNome(turma.getProfessor().getNome())
                .ativo(turma.getAtivo())
                .horarios(horariosDto)
                .build();
    }
}
