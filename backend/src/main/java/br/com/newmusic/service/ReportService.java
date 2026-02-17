package br.com.newmusic.service;

import br.com.newmusic.domain.*;
import br.com.newmusic.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ISO_LOCAL_DATE;
    private static final DateTimeFormatter DATETIME_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private final GrupoRepository grupoRepository;
    private final InstrumentoRepository instrumentoRepository;
    private final AlunoRepository alunoRepository;
    private final ProfessorRepository professorRepository;
    private final UsuarioRepository usuarioRepository;
    private final TurmaRepository turmaRepository;
    private final MatriculaRepository matriculaRepository;
    private final MensalidadeRepository mensalidadeRepository;
    private final PresencaRepository presencaRepository;
    private final PresencaProfessorRepository presencaProfessorRepository;
    private final AuditLogRepository auditLogRepository;
    private final ErrorLogRepository errorLogRepository;

    @Transactional(readOnly = true)
    public List<Map<String, Object>> relatorioGrupos() {
        return grupoRepository.findAll().stream()
                .sorted(Comparator.comparing(Grupo::getId))
                .map(g -> {
                    long qtdInstrumentos = instrumentoRepository.findByGrupoIdOrderByNomeAsc(g.getId()).size();
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", g.getId());
                    row.put("nome", g.getNome());
                    row.put("quantidadeInstrumentos", qtdInstrumentos);
                    return row;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> relatorioInstrumentos(Long grupoId) {
        List<Instrumento> list = grupoId != null
                ? instrumentoRepository.findByGrupoIdOrderByNomeAsc(grupoId)
                : instrumentoRepository.findAll();
        return list.stream()
                .sorted(Comparator.comparing(Instrumento::getId))
                .map(i -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", i.getId());
                    row.put("nome", i.getNome());
                    row.put("descricao", nullToEmpty(i.getDescricao()));
                    row.put("grupoNome", i.getGrupo().getNome());
                    row.put("quantidadeTurmas", turmaRepository.countByInstrumentoId(i.getId()));
                    row.put("ativo", i.getAtivo());
                    return row;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> relatorioAlunos(Boolean ativo, Long instrumentoId) {
        List<Aluno> alunos = ativo != null
                ? (ativo ? alunoRepository.findAll().stream().filter(Aluno::getAtivo).toList() : alunoRepository.findAll().stream().filter(a -> !a.getAtivo()).toList())
                : alunoRepository.findAll();
        if (instrumentoId != null) {
            List<Long> turmaIds = turmaRepository.findAll().stream()
                    .filter(t -> t.getInstrumento().getId().equals(instrumentoId))
                    .map(Turma::getId).toList();
            Set<Long> alunoIds = new HashSet<>();
            turmaIds.forEach(tid -> matriculaRepository.findByTurmaId(tid).forEach(m -> alunoIds.add(m.getAluno().getId())));
            alunos = alunos.stream().filter(a -> alunoIds.contains(a.getId())).toList();
        }
        return alunos.stream()
                .sorted(Comparator.comparing(Aluno::getId))
                .map(a -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", a.getId());
                    m.put("nome", a.getNome());
                    m.put("email", a.getEmail());
                    m.put("telefone", nullToEmpty(a.getTelefone()));
                    m.put("cpf", nullToEmpty(a.getCpf()));
                    m.put("dataNascimento", a.getDataNascimento() != null ? a.getDataNascimento().format(DATE_FMT) : "");
                    m.put("endereco", nullToEmpty(a.getEndereco()));
                    m.put("ativo", a.getAtivo());
                    m.put("responsavelNome", nullToEmpty(a.getResponsavelNome()));
                    m.put("responsavelCpf", nullToEmpty(a.getResponsavelCpf()));
                    return m;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> instrumentosDasTurmas() {
        return turmaRepository.findDistinctInstrumentosFromTurmas().stream()
                .sorted(Comparator.comparing(Instrumento::getId))
                .map(i -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", i.getId());
                    m.put("nome", i.getNome());
                    return m;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> relatorioProfessores(Boolean ativo) {
        List<Professor> list = ativo != null
                ? (ativo ? professorRepository.findByAtivoTrue() : professorRepository.findAll().stream().filter(p -> !p.getAtivo()).toList())
                : professorRepository.findAll();
        return list.stream()
                .sorted(Comparator.comparing(Professor::getId))
                .map(p -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", p.getId());
                    m.put("nome", p.getNome());
                    m.put("cpf", nullToEmpty(p.getCpf()));
                    m.put("email", p.getEmail());
                    m.put("telefone", nullToEmpty(p.getTelefone()));
                    m.put("quantidadeTurmas", turmaRepository.findByProfessor_IdOrderById(p.getId()).size());
                    m.put("instrumentos", nullToEmpty(p.getInstrumentos()));
                    m.put("ativo", p.getAtivo());
                    return m;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> relatorioUsuarios(String perfil) {
        List<Usuario> list = usuarioRepository.findAll();
        if (perfil != null && !perfil.isBlank()) {
            try {
                Perfil p = Perfil.valueOf(perfil.trim().toUpperCase());
                list = list.stream().filter(u -> u.getPerfil() == p).toList();
            } catch (Exception ignored) {}
        }
        return list.stream()
                .sorted(Comparator.comparing(Usuario::getId))
                .map(u -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", u.getId());
                    row.put("nome", nullToEmpty(u.getNome()));
                    row.put("email", u.getEmail());
                    row.put("perfil", u.getPerfil().name());
                    row.put("ativo", u.getAtivo());
                    return row;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> relatorioTurmas(Boolean ativo, Long instrumentoId, Long professorId) {
        List<Turma> list = turmaRepository.findAllWithHorariosAndInstrumentoAndProfessor();
        if (ativo != null) list = list.stream().filter(t -> t.getAtivo().equals(ativo)).toList();
        if (instrumentoId != null) list = list.stream().filter(t -> t.getInstrumento().getId().equals(instrumentoId)).toList();
        if (professorId != null) list = list.stream().filter(t -> t.getProfessor().getId().equals(professorId)).toList();
        return list.stream()
                .sorted(Comparator.comparing(Turma::getId))
                .flatMap(t -> {
                    int cap = t.getCapacidade() != null ? t.getCapacidade() : 0;
                    int matriculados = (int) matriculaRepository.countByTurmaIdAndAtivoTrue(t.getId());
                    String capacidadeStr = cap > 0 ? matriculados + "/" + cap : "0/0";
                    var horarios = t.getHorarios();
                    if (horarios != null && !horarios.isEmpty()) {
                        return horarios.stream().map(h -> {
                            Map<String, Object> row = new LinkedHashMap<>();
                            row.put("id", t.getId());
                            row.put("professorNome", t.getProfessor().getNome());
                            row.put("instrumentoNome", t.getInstrumento().getNome());
                            row.put("diaSemana", formatDiaSemana(h.getDiaSemana()));
                            row.put("horarioInicio", h.getHorarioInicio() != null ? h.getHorarioInicio().toString() : "");
                            row.put("horarioFim", h.getHorarioFim() != null ? h.getHorarioFim().toString() : "");
                            row.put("capacidade", capacidadeStr);
                            row.put("ativo", t.getAtivo());
                            return row;
                        });
                    }
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", t.getId());
                    row.put("professorNome", t.getProfessor().getNome());
                    row.put("instrumentoNome", t.getInstrumento().getNome());
                    row.put("diaSemana", formatDiaSemana(t.getDiaSemana()));
                    row.put("horarioInicio", t.getHorarioInicio() != null ? t.getHorarioInicio().toString() : "");
                    row.put("horarioFim", "");
                    row.put("capacidade", capacidadeStr);
                    row.put("ativo", t.getAtivo());
                    return java.util.stream.Stream.of(row);
                })
                .collect(Collectors.toList());
    }

    private static String formatDiaSemana(Integer diaSemana) {
        if (diaSemana == null) return "";
        return switch (diaSemana) {
            case 1 -> "Seg";
            case 2 -> "Ter";
            case 3 -> "Qua";
            case 4 -> "Qui";
            case 5 -> "Sex";
            case 6 -> "Sáb";
            case 7 -> "Dom";
            default -> String.valueOf(diaSemana);
        };
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> relatorioMatriculas(Boolean ativo, Long alunoId, LocalDate dataInicio, LocalDate dataFim) {
        List<Matricula> list = matriculaRepository.findAll();
        if (ativo != null) list = list.stream().filter(m -> m.getAtivo().equals(ativo)).toList();
        if (alunoId != null) list = list.stream().filter(m -> m.getAluno().getId().equals(alunoId)).toList();
        if (dataInicio != null) list = list.stream().filter(m -> !m.getDataInicio().isBefore(dataInicio)).toList();
        if (dataFim != null) list = list.stream().filter(m -> !m.getDataInicio().isAfter(dataFim)).toList();
        NumberFormat currencyFmt = NumberFormat.getCurrencyInstance(Locale.forLanguageTag("pt-BR"));
        return list.stream()
                .sorted(Comparator.comparing(Matricula::getId))
                .map(m -> {
                    String valorFormatado = m.getValorCurso() != null ? currencyFmt.format(m.getValorCurso()) : "";
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", m.getId());
                    row.put("alunoNome", m.getAluno().getNome());
                    row.put("instrumentoNome", m.getTurma().getInstrumento().getNome());
                    row.put("dataInicio", m.getDataInicio().format(DATE_FMT));
                    row.put("dataFim", m.getDataFim() != null ? m.getDataFim().format(DATE_FMT) : "");
                    row.put("valorCurso", valorFormatado);
                    row.put("ativo", m.getAtivo());
                    return row;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> relatorioMensalidades(Integer ano, Integer mes, String status, Long alunoId) {
        List<Mensalidade> list = mensalidadeRepository.findAll();
        if (ano != null) list = list.stream().filter(m -> m.getAno().equals(ano)).toList();
        if (mes != null) list = list.stream().filter(m -> m.getMes().equals(mes)).toList();
        if (status != null && !status.isBlank()) {
            try {
                StatusMensalidade s = StatusMensalidade.valueOf(status.trim().toUpperCase());
                list = list.stream().filter(m -> m.getStatus() == s).toList();
            } catch (Exception ignored) {}
        }
        if (alunoId != null) list = list.stream().filter(m -> m.getAluno().getId().equals(alunoId)).toList();
        return list.stream()
                .sorted(Comparator.comparing(Mensalidade::getId))
                .map(m -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", m.getId());
                    row.put("alunoNome", m.getAluno().getNome());
                    row.put("mes", m.getMes());
                    row.put("ano", m.getAno());
                    row.put("vencimento", m.getVencimento().format(DATE_FMT));
                    row.put("valor", m.getValor());
                    row.put("status", m.getStatus().name());
                    row.put("dataPagamento", m.getDataPagamento() != null ? m.getDataPagamento().format(DATE_FMT) : "");
                    row.put("formaPagamento", nullToEmpty(m.getFormaPagamento()));
                    return row;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> relatorioInadimplencia(Integer ano, Integer mes) {
        List<Mensalidade> list = mensalidadeRepository.findByStatusOrderByAluno_NomeAsc(StatusMensalidade.ATRASADO);
        if (ano != null) list = list.stream().filter(m -> m.getAno().equals(ano)).toList();
        if (mes != null) list = list.stream().filter(m -> m.getMes().equals(mes)).toList();
        Map<Long, List<Mensalidade>> porAluno = list.stream().collect(Collectors.groupingBy(m -> m.getAluno().getId()));
        return porAluno.entrySet().stream()
                .map(e -> {
                    List<Mensalidade> parcelas = e.getValue();
                    BigDecimal total = parcelas.stream().map(Mensalidade::getValor).reduce(BigDecimal.ZERO, BigDecimal::add);
                    return Map.<String, Object>of(
                            "alunoId", e.getKey(),
                            "alunoNome", parcelas.get(0).getAluno().getNome(),
                            "quantidadeParcelas", parcelas.size(),
                            "valorTotal", total
                    );
                })
                .sorted(Comparator.comparing(m -> (Long) m.get("alunoId")))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> relatorioReceita(LocalDate dataInicio, LocalDate dataFim, String formaPagamento) {
        List<Mensalidade> list = mensalidadeRepository.findByStatusOrderByAluno_NomeAsc(StatusMensalidade.PAGO);
        list = list.stream().filter(m -> m.getDataPagamento() != null).toList();
        if (dataInicio != null) list = list.stream().filter(m -> !m.getDataPagamento().isBefore(dataInicio)).toList();
        if (dataFim != null) list = list.stream().filter(m -> !m.getDataPagamento().isAfter(dataFim)).toList();
        if (formaPagamento != null && !formaPagamento.isBlank())
            list = list.stream().filter(m -> formaPagamento.equals(m.getFormaPagamento())).toList();
        return list.stream()
                .sorted(Comparator.comparing(Mensalidade::getId))
                .map(m -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("dataPagamento", m.getDataPagamento().format(DATE_FMT));
                    row.put("alunoNome", m.getAluno().getNome());
                    row.put("valor", m.getValor());
                    row.put("formaPagamento", nullToEmpty(m.getFormaPagamento()));
                    row.put("mesAno", String.format("%02d/%d", m.getMes(), m.getAno()));
                    return row;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> relatorioPresencaAlunos(Long alunoId, LocalDate dataInicio, LocalDate dataFim) {
        LocalDate start = dataInicio != null ? dataInicio : LocalDate.of(2000, 1, 1);
        LocalDate end = dataFim != null ? dataFim : LocalDate.now().plusYears(1);

        if (alunoId != null) {
            List<Matricula> matriculas = matriculaRepository.findByAlunoId(alunoId);
            List<Presenca> all = new ArrayList<>();
            for (Matricula mat : matriculas) {
                all.addAll(presencaRepository.findByMatriculaIdAndDataAulaBetweenOrderByDataAulaAsc(mat.getId(), start, end));
            }
            return all.stream()
                    .sorted(Comparator.comparing(Presenca::getDataAula))
                    .map(p -> {
                        var t = p.getTurma();
                        String turmaDesc = (t.getInstrumento() != null ? t.getInstrumento().getNome() : "") + " - " + (t.getProfessor() != null ? t.getProfessor().getNome() : "");
                        return Map.<String, Object>of(
                                "dataAula", p.getDataAula().format(DATE_FMT),
                                "presente", p.getPresente(),
                                "alunoNome", p.getMatricula().getAluno().getNome(),
                                "turma", turmaDesc,
                                "conteudoAula", nullToEmpty(p.getConteudoAula())
                        );
                    })
                    .collect(Collectors.toList());
        }
        List<Presenca> list = presencaRepository.findAllWithAlunoOrderByDataAulaAscAlunoNome();
        if (dataInicio != null || dataFim != null) {
            list = list.stream()
                    .filter(p -> !p.getDataAula().isBefore(start) && !p.getDataAula().isAfter(end))
                    .toList();
        }
        return list.stream()
                .sorted(Comparator.comparing(Presenca::getDataAula))
                .map(p -> {
                    var t = p.getTurma();
                    String turmaDesc = (t.getInstrumento() != null ? t.getInstrumento().getNome() : "") + " - " + (t.getProfessor() != null ? t.getProfessor().getNome() : "");
                    return Map.<String, Object>of(
                            "dataAula", p.getDataAula().format(DATE_FMT),
                            "presente", p.getPresente(),
                            "alunoNome", p.getMatricula().getAluno().getNome(),
                            "turma", turmaDesc,
                            "conteudoAula", nullToEmpty(p.getConteudoAula())
                    );
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> relatorioPresencaProfessores(Long professorId, LocalDate dataInicio, LocalDate dataFim) {
        LocalDate start = dataInicio != null ? dataInicio : LocalDate.of(2000, 1, 1);
        LocalDate end = dataFim != null ? dataFim : LocalDate.now().plusYears(1);

        if (professorId != null) {
            List<PresencaProfessor> list = (dataInicio != null || dataFim != null)
                    ? presencaProfessorRepository.findByProfessorIdAndDataAulaBetweenOrderByDataAulaAscTurma_Id(professorId, start, end)
                    : presencaProfessorRepository.findByProfessorId(professorId).stream().toList();
            return list.stream()
                    .sorted(Comparator.comparing(PresencaProfessor::getDataAula))
                    .map(p -> Map.<String, Object>of(
                            "dataAula", p.getDataAula().format(DATE_FMT),
                            "presente", p.getPresente(),
                            "professorNome", p.getProfessor().getNome(),
                            "instrumento", p.getTurma().getInstrumento() != null ? p.getTurma().getInstrumento().getNome() : ""
                    ))
                    .collect(Collectors.toList());
        }
        List<PresencaProfessor> list = presencaProfessorRepository.findAll().stream().toList();
        if (dataInicio != null || dataFim != null) {
            list = list.stream()
                    .filter(p -> !p.getDataAula().isBefore(start) && !p.getDataAula().isAfter(end))
                    .toList();
        }
        return list.stream()
                .sorted(Comparator.comparing(PresencaProfessor::getDataAula))
                .map(p -> Map.<String, Object>of(
                        "dataAula", p.getDataAula().format(DATE_FMT),
                        "presente", p.getPresente(),
                        "professorNome", p.getProfessor().getNome(),
                        "instrumento", p.getTurma().getInstrumento() != null ? p.getTurma().getInstrumento().getNome() : ""
                ))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> relatorioAuditoria(Long usuarioId, String tabela, String acao, LocalDateTime dataInicio, LocalDateTime dataFim) {
        String tabelaTrim = tabela != null && !tabela.isBlank() ? tabela.trim() : null;
        String acaoTrim = acao != null && !acao.isBlank() ? acao.trim() : null;
        List<AuditLog> list = auditLogRepository.findWithFilters(usuarioId, tabelaTrim, acaoTrim, dataInicio, dataFim, PageRequest.of(0, 5000));
        return list.stream()
                .map(a -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", a.getId());
                    row.put("dataHora", a.getDataHora().format(DATETIME_FMT));
                    row.put("acao", a.getAcao());
                    row.put("descricao", nullToEmpty(a.getDescricao()));
                    row.put("conteudoAlteracao", nullToEmpty(a.getConteudoAlteracao()));
                    row.put("usuarioId", a.getUsuarioId());
                    row.put("usuarioEmail", nullToEmpty(a.getUsuarioEmail()));
                    row.put("tabela", nullToEmpty(a.getTabela()));
                    row.put("tabelaId", nullToEmpty(a.getTabelaId()));
                    return row;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> relatorioErros(LocalDateTime dataInicio, LocalDateTime dataFim) {
        List<ErrorLog> list;
        if (dataInicio != null && dataFim != null) {
            list = errorLogRepository.findByDataHoraBetweenOrderByIdAsc(dataInicio, dataFim, PageRequest.of(0, 5000));
        } else {
            list = errorLogRepository.findAllByOrderByIdAsc(PageRequest.of(0, 5000));
        }
        return list.stream()
                .map(e -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", e.getId());
                    row.put("dataHora", e.getDataHora().format(DATETIME_FMT));
                    row.put("acao", e.getAcao());
                    row.put("mensagemErro", nullToEmpty(e.getMensagemErro()));
                    row.put("tipoExcecao", nullToEmpty(e.getTipoExcecao()));
                    row.put("stackTrace", nullToEmpty(e.getStackTrace()));
                    return row;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> relatorioConsolidadoDashboard() {
        long alunos = alunoRepository.count();
        long professores = professorRepository.count();
        long turmas = turmaRepository.count();
        long alunosAtrasados = mensalidadeRepository.countDistinctAlunoByStatus(StatusMensalidade.ATRASADO);
        int diaHoje = LocalDate.now().getDayOfWeek().getValue();
        long aulasHoje = turmaRepository.findAllWithHorariosAndInstrumentoAndProfessor().stream()
                .filter(Turma::getAtivo)
                .filter(t -> {
                    if (t.getHorarios() != null && !t.getHorarios().isEmpty()) {
                        return t.getHorarios().stream().anyMatch(h -> h.getDiaSemana() != null && h.getDiaSemana() == diaHoje);
                    }
                    Integer d = t.getDiaSemana();
                    return d != null && d == diaHoje;
                })
                .count();
        long matriculasAtivas = matriculaRepository.findAll().stream().filter(Matricula::getAtivo).count();
        return Map.<String, Object>of(
                "alunos", alunos,
                "professores", professores,
                "turmas", turmas,
                "matriculasAtivas", matriculasAtivas,
                "alunosComPagamentoAtrasado", alunosAtrasados,
                "aulasHoje", aulasHoje
        );
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> relatorioAulasHojeDetalhado() {
        int diaHoje = LocalDate.now().getDayOfWeek().getValue();
        return turmaRepository.findAllWithHorariosAndInstrumentoAndProfessor().stream()
                .filter(Turma::getAtivo)
                .flatMap(t -> {
                    var horarios = t.getHorarios();
                    if (horarios != null && !horarios.isEmpty()) {
                        return horarios.stream()
                                .filter(h -> h.getDiaSemana() != null && h.getDiaSemana() == diaHoje)
                                .map(h -> {
                                    Map<String, Object> row = new LinkedHashMap<>();
                                    row.put("dia", formatDiaSemana(h.getDiaSemana()));
                                    row.put("instrumento", t.getInstrumento() != null ? t.getInstrumento().getNome() : "");
                                    row.put("professor", t.getProfessor() != null ? t.getProfessor().getNome() : "");
                                    row.put("horarioInicio", h.getHorarioInicio() != null ? h.getHorarioInicio().toString() : "");
                                    row.put("horarioFim", h.getHorarioFim() != null ? h.getHorarioFim().toString() : "");
                                    return row;
                                });
                    }
                    Integer d = t.getDiaSemana();
                    if (d != null && d == diaHoje) {
                        Map<String, Object> row = new LinkedHashMap<>();
                        row.put("dia", formatDiaSemana(d));
                        row.put("instrumento", t.getInstrumento() != null ? t.getInstrumento().getNome() : "");
                        row.put("professor", t.getProfessor() != null ? t.getProfessor().getNome() : "");
                        row.put("horarioInicio", t.getHorarioInicio() != null ? t.getHorarioInicio().toString() : "");
                        row.put("horarioFim", "");
                        return java.util.stream.Stream.of(row);
                    }
                    return java.util.stream.Stream.<Map<String, Object>>empty();
                })
                .sorted(Comparator.comparing(m -> (String) m.get("instrumento")))
                .collect(Collectors.toList());
    }

    private static String nullToEmpty(Object o) {
        return o == null ? "" : o.toString();
    }
}
