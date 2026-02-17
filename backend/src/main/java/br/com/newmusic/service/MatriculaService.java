package br.com.newmusic.service;

import br.com.newmusic.domain.Aluno;
import br.com.newmusic.domain.Matricula;
import br.com.newmusic.domain.StatusMensalidade;
import br.com.newmusic.domain.Turma;
import br.com.newmusic.repository.AlunoRepository;
import br.com.newmusic.repository.MatriculaRepository;
import br.com.newmusic.repository.MensalidadeRepository;
import br.com.newmusic.repository.TurmaRepository;
import br.com.newmusic.web.dto.MatriculaDTO;
import br.com.newmusic.web.dto.MatriculaInput;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.newmusic.domain.TurmaHorario;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MatriculaService {

    private final MatriculaRepository matriculaRepository;
    private final AlunoRepository alunoRepository;
    private final TurmaRepository turmaRepository;
    private final MensalidadeRepository mensalidadeRepository;
    private final MensalidadeService mensalidadeService;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<MatriculaDTO> listar(Pageable pageable, String busca) {
        if (busca == null || busca.isBlank()) {
            return matriculaRepository.findAll(pageable).map(this::toDTO);
        }
        String b = busca.trim();
        return matriculaRepository.findByAlunoNomeContainingIgnoreCaseOrAlunoCpfContainingOrderByAlunoNomeAscDataInicioDesc(b, b, pageable).map(this::toDTO);
    }

    @Transactional(readOnly = true)
    public List<Long> listarAlunoIdsComMatriculaAtiva() {
        return matriculaRepository.findDistinctAlunoIdsByAtivoTrue();
    }

    @Transactional(readOnly = true)
    public List<MatriculaDTO> listarPorAluno(Long alunoId) {
        return matriculaRepository.findByAlunoIdAndAtivoTrue(alunoId).stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MatriculaDTO> listarPorTurma(Long turmaId) {
        return matriculaRepository.findByTurmaId(turmaId).stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public MatriculaDTO buscarPorId(Long id) {
        Matricula matricula = matriculaRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Matrícula não encontrada"));
        return toDTO(matricula);
    }

    @Transactional
    public MatriculaDTO criar(MatriculaInput input) {
        Aluno aluno = alunoRepository.findById(input.getAlunoId()).orElseThrow(() -> new IllegalArgumentException("Aluno não encontrado"));
        if (!Boolean.TRUE.equals(aluno.getAtivo())) {
            throw new IllegalArgumentException("Só é possível matricular alunos ativos. Ative o cadastro do aluno para inseri-lo na turma.");
        }
        Turma turma = turmaRepository.findByIdWithHorarios(input.getTurmaId()).orElseThrow(() -> new IllegalArgumentException("Turma não encontrada"));
        if (matriculaRepository.existsByAlunoIdAndTurmaIdAndAtivoTrue(input.getAlunoId(), input.getTurmaId())) {
            throw new IllegalArgumentException("Aluno já possui matrícula ativa nesta turma");
        }
        if (turma.getCapacidade() != null && matriculaRepository.countByTurmaIdAndAtivoTrue(turma.getId()) >= turma.getCapacidade()) {
            throw new IllegalArgumentException("Turma já está com capacidade máxima. Só é possível matricular quando uma vaga for liberada.");
        }
        validarTurmaComDiasEPeriodosDiferentes(input.getAlunoId(), turma, null);
        Integer aulasPorSemana = input.getAulasPorSemana() != null ? input.getAulasPorSemana() : aulasPorSemanaDaTurma(turma);
        boolean isCanto = turma.getInstrumento() != null
                && turma.getInstrumento().getGrupo() != null
                && turma.getInstrumento().getGrupo().getNome() != null
                && turma.getInstrumento().getGrupo().getNome().equalsIgnoreCase("Canto");
        LocalDate dataFim = calcularDataFimCurso(input.getDataInicio(), aulasPorSemana, isCanto);
        Matricula matricula = Matricula.builder()
                .dataInicio(input.getDataInicio())
                .dataFim(dataFim)
                .ativo(input.getAtivo() != null ? input.getAtivo() : true)
                .valorCurso(input.getValorCurso())
                .dataVencimento(input.getDataVencimento())
                .aulasPorSemana(aulasPorSemana)
                .aluno(aluno)
                .turma(turma)
                .build();
        matricula = matriculaRepository.save(matricula);
        if (input.getValorCurso() != null && input.getDataVencimento() != null) {
            mensalidadeService.criarMensalidadesParaMatricula(matricula.getId(), aluno.getId(), input.getDataInicio(), dataFim, input.getValorCurso(), input.getDataVencimento(), aulasPorSemana);
        }
        String conteudo = "Aluno: " + aluno.getNome() + ", Turma: " + turma.getInstrumento().getNome() + " - " + turma.getProfessor().getNome() + ", Data início: " + input.getDataInicio() + ", Data fim: " + dataFim;
        auditService.registrar("CRIAR", "matriculas", String.valueOf(matricula.getId()), "Criou matrícula do aluno " + aluno.getNome() + " na turma " + turma.getInstrumento().getNome() + " (id " + matricula.getId() + ")", conteudo);
        return toDTO(matricula);
    }

    @Transactional
    public MatriculaDTO atualizar(Long id, MatriculaInput input) {
        Matricula matricula = matriculaRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Matrícula não encontrada"));
        Turma turmaDestino = matricula.getTurma();
        if (!turmaDestino.getId().equals(input.getTurmaId())) {
            Turma novaTurma = turmaRepository.findByIdWithHorarios(input.getTurmaId()).orElseThrow(() -> new IllegalArgumentException("Turma não encontrada"));
            if (novaTurma.getCapacidade() != null && matriculaRepository.countByTurmaIdAndAtivoTrue(novaTurma.getId()) >= novaTurma.getCapacidade()) {
                throw new IllegalArgumentException("Turma já está com capacidade máxima. Só é possível matricular quando uma vaga for liberada.");
            }
            validarTurmaComDiasEPeriodosDiferentes(matricula.getAluno().getId(), novaTurma, matricula.getId());
            turmaDestino = novaTurma;
        }
        boolean isCanto = turmaDestino.getInstrumento() != null
                && turmaDestino.getInstrumento().getGrupo() != null
                && turmaDestino.getInstrumento().getGrupo().getNome() != null
                && turmaDestino.getInstrumento().getGrupo().getNome().equalsIgnoreCase("Canto");
        LocalDate novaDataFim = calcularDataFimCurso(input.getDataInicio(), input.getAulasPorSemana(), isCanto);
        validarNenhumaMensalidadePagaAposDataFim(matricula.getAluno().getId(), novaDataFim);
        matricula.setDataInicio(input.getDataInicio());
        matricula.setDataFim(novaDataFim);
        matricula.setValorCurso(input.getValorCurso());
        matricula.setDataVencimento(input.getDataVencimento());
        matricula.setAulasPorSemana(input.getAulasPorSemana());
        if (input.getAtivo() != null) {
            if (Boolean.FALSE.equals(input.getAtivo()) && possuiMensalidadePagaNoPeriodo(matricula.getAluno().getId(), matricula.getDataInicio(), matricula.getDataFim())) {
                throw new IllegalArgumentException("Matrícula não pode ser inativada pois possui mensalidade(s) com status PAGO.");
            }
            matricula.setAtivo(input.getAtivo());
        }
        if (!matricula.getAluno().getId().equals(input.getAlunoId())) {
            Aluno aluno = alunoRepository.findById(input.getAlunoId()).orElseThrow(() -> new IllegalArgumentException("Aluno não encontrado"));
            if (!Boolean.TRUE.equals(aluno.getAtivo())) {
                throw new IllegalArgumentException("Só é possível matricular alunos ativos. Ative o cadastro do aluno para inseri-lo na turma.");
            }
            matricula.setAluno(aluno);
        }
        if (!matricula.getTurma().getId().equals(input.getTurmaId())) {
            matricula.setTurma(turmaDestino);
        }
        matricula = matriculaRepository.save(matricula);
        auditService.registrar("ATUALIZAR", "matriculas", String.valueOf(id), "Editou a matrícula (id " + id + ")", "Aluno id: " + input.getAlunoId() + ", Turma id: " + input.getTurmaId() + ", Data início: " + input.getDataInicio());
        return toDTO(matricula);
    }

    @Transactional
    public void excluir(Long id) {
        Matricula matricula = matriculaRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Matrícula não encontrada"));
        String alunoNome = matricula.getAluno().getNome();
        String turmaDesc = matricula.getTurma().getInstrumento().getNome() + " - " + matricula.getTurma().getProfessor().getNome();
        Long idMat = matricula.getId();
        mensalidadeService.excluirPorMatriculaId(id, matricula.getAluno().getId(), matricula.getDataInicio(), matricula.getDataFim());
        matriculaRepository.delete(matricula);
        auditService.registrar("EXCLUIR", "matriculas", String.valueOf(idMat), "Excluiu a matrícula do aluno " + alunoNome + " (id " + idMat + ")", "Aluno: " + alunoNome + ", Turma: " + turmaDesc);
    }

    private static int aulasPorSemanaDaTurma(Turma turma) {
        if (turma.getHorarios() != null && !turma.getHorarios().isEmpty()) {
            return turma.getHorarios().size() >= 2 ? 2 : 1;
        }
        return turma.getDiaSemana() != null ? 1 : 1;
    }

    private static LocalDate calcularDataFimCurso(LocalDate dataInicio, Integer aulasPorSemana) {
        return calcularDataFimCurso(dataInicio, aulasPorSemana, false);
    }

    private static LocalDate calcularDataFimCurso(LocalDate dataInicio, Integer aulasPorSemana, boolean isCanto) {
        int meses;
        if (isCanto) {
            meses = (aulasPorSemana != null && aulasPorSemana == 2) ? 3 : 6;
        } else {
            meses = (aulasPorSemana != null && aulasPorSemana == 2) ? 12 : 24;
        }
        return dataInicio.plusMonths(meses);
    }

    private boolean possuiMensalidadePagaNoPeriodo(Long alunoId, LocalDate dataInicio, LocalDate dataFim) {
        if (dataInicio == null || dataFim == null) return false;
        YearMonth inicio = YearMonth.from(dataInicio);
        YearMonth fim = YearMonth.from(dataFim);
        return mensalidadeRepository.findByAlunoIdAndStatus(alunoId, StatusMensalidade.PAGO).stream()
                .anyMatch(m -> {
                    YearMonth ym = YearMonth.of(m.getAno(), m.getMes());
                    return !ym.isBefore(inicio) && !ym.isAfter(fim);
                });
    }

    private void validarNenhumaMensalidadePagaAposDataFim(Long alunoId, LocalDate dataFim) {
        if (dataFim == null) return;
        YearMonth limite = YearMonth.from(dataFim);
        boolean temPagaDepois = mensalidadeRepository.findByAlunoIdAndStatus(alunoId, StatusMensalidade.PAGO).stream()
                .anyMatch(m -> YearMonth.of(m.getAno(), m.getMes()).isAfter(limite));
        if (temPagaDepois) {
            throw new IllegalArgumentException("Não é permitido alterar a data fim para antes de existir mensalidade paga.");
        }
    }

    private void validarTurmaComDiasEPeriodosDiferentes(Long alunoId, Turma novaTurma, Long matriculaIdExcluir) {
        if (novaTurma == null || novaTurma.getHorarios() == null || novaTurma.getHorarios().isEmpty()) return;
        List<Matricula> ativas = matriculaRepository.findByAlunoIdAndAtivoTrue(alunoId).stream()
                .filter(m -> matriculaIdExcluir == null || !m.getId().equals(matriculaIdExcluir))
                .collect(Collectors.toList());
        for (Matricula m : ativas) {
            Turma existente = turmaRepository.findByIdWithHorarios(m.getTurma().getId()).orElse(m.getTurma());
            if (existente.getHorarios() == null || existente.getHorarios().isEmpty()) continue;
            for (TurmaHorario slotNovo : novaTurma.getHorarios()) {
                LocalTime fimNovo = slotNovo.getHorarioFim() != null ? slotNovo.getHorarioFim() : slotNovo.getHorarioInicio().plusHours(1);
                for (TurmaHorario slotExistente : existente.getHorarios()) {
                    if (!slotNovo.getDiaSemana().equals(slotExistente.getDiaSemana())) continue;
                    LocalTime fimExistente = slotExistente.getHorarioFim() != null ? slotExistente.getHorarioFim() : slotExistente.getHorarioInicio().plusHours(1);
                    boolean sobrepoe = slotNovo.getHorarioInicio().isBefore(fimExistente) && fimNovo.isAfter(slotExistente.getHorarioInicio());
                    if (sobrepoe) {
                        throw new IllegalArgumentException("Não é permitido matricular o aluno em turma com dias e horários que coincidem com outra matrícula ativa. Escolha uma turma com dias e períodos diferentes.");
                    }
                }
            }
        }
    }

    private MatriculaDTO toDTO(Matricula matricula) {
        Turma t = matricula.getTurma();
        String instrumentoNome = t.getInstrumento().getNome();
        String professorNome = t.getProfessor().getNome();
        String turmaDescricao = instrumentoNome + " - " + professorNome;
        return MatriculaDTO.builder()
                .id(matricula.getId())
                .dataInicio(matricula.getDataInicio())
                .dataFim(matricula.getDataFim())
                .ativo(matricula.getAtivo())
                .valorCurso(matricula.getValorCurso())
                .dataVencimento(matricula.getDataVencimento())
                .aulasPorSemana(matricula.getAulasPorSemana())
                .alunoId(matricula.getAluno().getId())
                .alunoNome(matricula.getAluno().getNome())
                .turmaId(matricula.getTurma().getId())
                .turmaDescricao(turmaDescricao)
                .build();
    }
}
