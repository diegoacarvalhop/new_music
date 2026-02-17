package br.com.newmusic.service;

import br.com.newmusic.domain.Aluno;
import br.com.newmusic.domain.Matricula;
import br.com.newmusic.domain.Mensalidade;
import br.com.newmusic.domain.StatusMensalidade;
import br.com.newmusic.domain.Turma;
import br.com.newmusic.domain.TurmaHorario;
import br.com.newmusic.repository.AlunoRepository;
import br.com.newmusic.repository.MatriculaRepository;
import br.com.newmusic.repository.MensalidadeRepository;
import br.com.newmusic.security.UsuarioPrincipal;
import br.com.newmusic.web.dto.AlunoMensalidadeResumoDTO;
import br.com.newmusic.web.dto.BaixaPagamentoInput;
import br.com.newmusic.web.dto.MensalidadeDTO;
import br.com.newmusic.web.dto.MensalidadeInput;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.newmusic.util.FeriadosNacionais;
import br.com.newmusic.util.StringUtil;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import static br.com.newmusic.domain.StatusMensalidade.ATRASADO;
import static br.com.newmusic.domain.StatusMensalidade.PENDENTE;

@Service
@RequiredArgsConstructor
public class MensalidadeService {

    private static final BigDecimal MULTA_PERCENTUAL = new BigDecimal("0.10");
    private static final BigDecimal JUROS_PERCENTUAL_DIA = new BigDecimal("0.01");
    private static final int ESCALA_MONETARIA = 2;
    /** Timezone para "hoje" em operações de atraso/multa/juros (Recife/PE). */
    private static final ZoneId ZONE_RECIFE = ZoneId.of("America/Recife");
    /** Horário em que o job roda: só contamos um novo dia de juros a partir das 9h. */
    private static final int HORA_JOB_RECIFE = 9;

    private final MensalidadeRepository mensalidadeRepository;
    private final AlunoRepository alunoRepository;
    private final MatriculaRepository matriculaRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<MensalidadeDTO> listar(Pageable pageable, String busca) {
        if (busca == null || busca.isBlank()) {
            return mensalidadeRepository.findAll(pageable).map(this::toDTO);
        }
        String b = busca.trim();
        return mensalidadeRepository.findByAlunoNomeContainingIgnoreCaseOrAlunoCpfContainingOrderByAlunoNomeAscAnoAscMesAsc(b, b, pageable).map(this::toDTO);
    }

    @Transactional(readOnly = true)
    public List<MensalidadeDTO> listarPorAluno(Long alunoId) {
        return mensalidadeRepository.findByAlunoIdAndMatricula_AtivoTrueOrderByAnoDescMesDesc(alunoId).stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<MensalidadeDTO> listarPorAluno(Long alunoId, Pageable pageable) {
        return mensalidadeRepository.findByAlunoIdAndMatricula_AtivoTrueOrderByAnoAscMesAsc(alunoId, pageable).map(this::toDTO);
    }

    @Transactional(readOnly = true)
    public Page<AlunoMensalidadeResumoDTO> listarAlunosPaginado(Pageable pageable, String busca) {
        String b = (busca != null && !busca.isBlank()) ? busca.trim() : null;
        Page<Object[]> page = mensalidadeRepository.findDistinctMatriculaAlunoIdNomeECount(pageable, b);
        List<Object[]> content = page.getContent();
        List<Long> matriculaIds = content.stream()
                .map(row -> row[0])
                .filter(Objects::nonNull)
                .map(r -> ((Number) r).longValue())
                .distinct()
                .toList();
        List<Matricula> matriculasComTurma = matriculaIds.isEmpty() ? List.of() : matriculaRepository.findByIdInWithTurma(matriculaIds);
        Map<Long, String> turmaDescricaoPorMatricula = matriculasComTurma.stream()
                .collect(Collectors.toMap(Matricula::getId, m -> m.getTurma().getInstrumento().getNome() + " - " + m.getTurma().getProfessor().getNome()));
        Map<Long, String> turmaDiasHorariosPorMatricula = matriculasComTurma.stream()
                .collect(Collectors.toMap(Matricula::getId, m -> formatarDiasHorariosTurma(m.getTurma())));
        List<AlunoMensalidadeResumoDTO> dtos = content.stream()
                .map(row -> {
                    Long matriculaId = row[0] != null ? ((Number) row[0]).longValue() : null;
                    return AlunoMensalidadeResumoDTO.builder()
                            .alunoId(((Number) row[1]).longValue())
                            .alunoNome((String) row[2])
                            .matriculaId(matriculaId)
                            .turmaDescricao(matriculaId != null ? turmaDescricaoPorMatricula.getOrDefault(matriculaId, "Sem matrícula") : "Sem matrícula")
                            .turmaDiasHorarios(matriculaId != null ? turmaDiasHorariosPorMatricula.getOrDefault(matriculaId, "") : null)
                            .totalMensalidades(((Number) row[3]).longValue())
                            .build();
                })
                .toList();
        return new PageImpl<>(dtos, page.getPageable(), page.getTotalElements());
    }

    @Transactional(readOnly = true)
    public Page<MensalidadeDTO> listarPorMatricula(Long matriculaId, Pageable pageable) {
        return mensalidadeRepository.findByMatriculaIdOrderByAnoAscMesAsc(matriculaId, pageable).map(this::toDTO);
    }

    @Transactional(readOnly = true)
    public List<MensalidadeDTO> listarPorMesAno(int ano, Integer mes) {
        if (mes != null && mes > 0) {
            return mensalidadeRepository.findByAnoAndMesOrderByAluno_NomeAsc(ano, mes).stream().map(this::toDTO).collect(Collectors.toList());
        }
        return mensalidadeRepository.findByAnoOrderByAluno_NomeAscMesAsc(ano).stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public MensalidadeDTO buscarPorId(Long id) {
        Mensalidade mensalidade = mensalidadeRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Mensalidade não encontrada"));
        return toDTO(mensalidade);
    }

    @Transactional(readOnly = true)
    public long contagemPendentes() {
        return mensalidadeRepository.countByStatusIn(List.of(PENDENTE, ATRASADO));
    }

    @Transactional(readOnly = true)
    public long contagemAlunos(String busca) {
        if (busca == null || busca.isBlank()) {
            return mensalidadeRepository.countDistinctAluno();
        }
        return mensalidadeRepository.countDistinctAlunoByBusca(busca.trim());
    }

    @Transactional(readOnly = true)
    public long contagemAlunosComPagamentoAtrasado() {
        return mensalidadeRepository.countDistinctAlunoByStatus(ATRASADO);
    }

    @Transactional(readOnly = true)
    public boolean alunoPagamentoEmDia(Long alunoId) {
        int ano = LocalDate.now().getYear();
        int mes = LocalDate.now().getMonthValue();
        return mensalidadeRepository.findByAlunoIdAndMatricula_AtivoTrueAndAnoAndMes(alunoId, ano, mes)
                .map(m -> m.getStatus() == StatusMensalidade.PAGO)
                .orElse(false);
    }

    @Transactional
    public MensalidadeDTO criar(MensalidadeInput input) {
        Aluno aluno = alunoRepository.findById(input.getAlunoId()).orElseThrow(() -> new IllegalArgumentException("Aluno não encontrado"));
        if (mensalidadeRepository.findByAlunoIdAndAnoAndMes(input.getAlunoId(), input.getAno(), input.getMes()).isPresent()) {
            throw new IllegalArgumentException("Já existe mensalidade para este aluno no mês/ano informado");
        }
        LocalDate vencimento = proximoDiaUtil(input.getVencimento());
        StatusMensalidade status = vencimento.isBefore(LocalDate.now()) ? StatusMensalidade.ATRASADO : StatusMensalidade.PENDENTE;
        Mensalidade mensalidade = Mensalidade.builder()
                .ano(input.getAno())
                .mes(input.getMes())
                .valor(input.getValor())
                .vencimento(vencimento)
                .status(status)
                .aluno(aluno)
                .build();
        mensalidade = mensalidadeRepository.save(mensalidade);
        auditService.registrar("CRIAR", "mensalidades", String.valueOf(mensalidade.getId()), "Criou mensalidade " + mensalidade.getMes() + "/" + mensalidade.getAno() + " para aluno " + aluno.getNome() + " (id " + mensalidade.getId() + ")", "Aluno: " + aluno.getNome() + ", " + mensalidade.getMes() + "/" + mensalidade.getAno() + ", Valor: " + mensalidade.getValor());
        return toDTO(mensalidade);
    }

    @Transactional
    public MensalidadeDTO darBaixa(Long id, BaixaPagamentoInput input, UsuarioPrincipal principal) {
        Mensalidade mensalidade = mensalidadeRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Mensalidade não encontrada"));
        if (mensalidade.getStatus() == StatusMensalidade.PAGO) {
            throw new IllegalArgumentException("Mensalidade já está paga");
        }
        mensalidade.setStatus(StatusMensalidade.PAGO);
        mensalidade.setDataPagamento(input.getDataPagamento() != null ? input.getDataPagamento() : LocalDate.now());
        mensalidade.setFormaPagamento(input.getFormaPagamento());
        mensalidade = mensalidadeRepository.save(mensalidade);
        auditService.registrar("ATUALIZAR", "mensalidades", String.valueOf(id), "Deu baixa na mensalidade " + mensalidade.getMes() + "/" + mensalidade.getAno() + " do aluno " + mensalidade.getAluno().getNome() + " (id " + id + ")", "Data pagamento: " + mensalidade.getDataPagamento() + ", Forma: " + StringUtil.nvl(input.getFormaPagamento()));
        return toDTO(mensalidade);
    }

    @Transactional
    public void excluir(Long id) {
        Mensalidade mensalidade = mensalidadeRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Mensalidade não encontrada"));
        if (mensalidade.getStatus() == StatusMensalidade.PAGO) {
            throw new IllegalArgumentException("Mensalidade não pode ser excluída pois está com status PAGO.");
        }
        String ref = mensalidade.getMes() + "/" + mensalidade.getAno() + " - " + mensalidade.getAluno().getNome();
        Long idMen = mensalidade.getId();
        mensalidadeRepository.delete(mensalidade);
        auditService.registrar("EXCLUIR", "mensalidades", String.valueOf(idMen), "Excluiu a mensalidade " + ref + " (id " + idMen + ")", "Mensalidade: " + ref);
    }

    @Transactional
    public void excluirPorMatriculaId(Long matriculaId) {
        mensalidadeRepository.deleteByMatriculaId(matriculaId);
    }

    @Transactional
    public void excluirPorMatriculaId(Long matriculaId, Long alunoId, LocalDate dataInicio, LocalDate dataFim) {
        if (mensalidadeRepository.existsByMatriculaIdAndStatus(matriculaId, StatusMensalidade.PAGO)) {
            throw new IllegalArgumentException("Matrícula não pode ser excluída pois possui mensalidade(s) com status PAGO.");
        }
        int startYm = dataInicio != null && dataFim != null ? dataInicio.getYear() * 100 + dataInicio.getMonthValue() : 0;
        int endYm = dataInicio != null && dataFim != null ? dataFim.getYear() * 100 + dataFim.getMonthValue() : 0;
        if (alunoId != null && startYm > 0 && endYm > 0 && mensalidadeRepository.countByAlunoIdAndMatriculaNullAndPeriodoAndStatus(alunoId, startYm, endYm, StatusMensalidade.PAGO) > 0) {
            throw new IllegalArgumentException("Matrícula não pode ser excluída pois possui mensalidade(s) com status PAGO.");
        }
        mensalidadeRepository.deleteByMatriculaId(matriculaId);
        if (alunoId != null && startYm > 0 && endYm > 0) {
            mensalidadeRepository.deleteByAlunoIdAndMatriculaNullAndPeriodo(alunoId, startYm, endYm);
        }
    }

    @Transactional
    public void excluirPorAlunoEPeriodo(Long alunoId, LocalDate dataInicio, LocalDate dataFim) {
        LocalDate fim = dataFim != null ? dataFim : dataInicio.plusMonths(12);
        YearMonth startYm = YearMonth.from(dataInicio);
        YearMonth endYm = YearMonth.from(fim);
        List<Mensalidade> list = mensalidadeRepository.findByAlunoIdOrderByAnoDescMesDesc(alunoId);
        for (Mensalidade m : list) {
            YearMonth ym = YearMonth.of(m.getAno(), m.getMes());
            if (!ym.isBefore(startYm) && !ym.isAfter(endYm)) {
                if (m.getStatus() == StatusMensalidade.PAGO) {
                    throw new IllegalArgumentException("Não é possível excluir mensalidades do período pois existe mensalidade com status PAGO.");
                }
                mensalidadeRepository.delete(m);
            }
        }
    }

    @Transactional
    public void criarMensalidadesParaMatricula(Long alunoId, LocalDate dataInicio, LocalDate dataFim, BigDecimal valor, LocalDate dataVencimento) {
        criarMensalidadesParaMatricula(null, alunoId, dataInicio, dataFim, valor, dataVencimento, null);
    }

    @Transactional
    public void criarMensalidadesParaMatricula(Long alunoId, LocalDate dataInicio, LocalDate dataFim, BigDecimal valor, LocalDate dataVencimento, Integer aulasPorSemana) {
        criarMensalidadesParaMatricula(null, alunoId, dataInicio, dataFim, valor, dataVencimento, aulasPorSemana);
    }

    @Transactional
    public void criarMensalidadesParaMatricula(Long matriculaId, Long alunoId, LocalDate dataInicio, LocalDate dataFim, BigDecimal valor, LocalDate dataVencimento, Integer aulasPorSemana) {
        if (valor == null || dataVencimento == null) return;
        Aluno aluno = alunoRepository.findById(alunoId).orElseThrow(() -> new IllegalArgumentException("Aluno não encontrado"));
        Matricula matricula = matriculaId != null ? matriculaRepository.findById(matriculaId).orElse(null) : null;
        int diaVencimento = dataVencimento.getDayOfMonth();
        YearMonth mesInicio = YearMonth.from(dataInicio);
        YearMonth ultimoMesCobranca;
        if (dataFim != null) {
            ultimoMesCobranca = YearMonth.from(dataFim).minusMonths(1);
        } else if (aulasPorSemana != null) {
            int numMeses = (aulasPorSemana == 2) ? 12 : 24;
            ultimoMesCobranca = mesInicio.plusMonths(numMeses - 1);
        } else {
            ultimoMesCobranca = mesInicio.plusMonths(11);
        }
        for (YearMonth ym = YearMonth.from(dataInicio); !ym.isAfter(ultimoMesCobranca); ym = ym.plusMonths(1)) {
            int ano = ym.getYear();
            int mes = ym.getMonthValue();
            int dia = Math.min(diaVencimento, ym.lengthOfMonth());
            LocalDate vencimento = proximoDiaUtil(LocalDate.of(ano, mes, dia));
            StatusMensalidade status = vencimento.isBefore(LocalDate.now()) ? StatusMensalidade.ATRASADO : StatusMensalidade.PENDENTE;
            Mensalidade m = Mensalidade.builder()
                    .ano(ano)
                    .mes(mes)
                    .valor(valor)
                    .vencimento(vencimento)
                    .status(status)
                    .rematricula(false)
                    .aluno(aluno)
                    .matricula(matricula)
                    .build();
            mensalidadeRepository.save(m);
        }
    }

    /** Data de referência para contar dias em atraso: só conta um novo dia após as 9h (quando o job roda). */
    private static LocalDate dataReferenciaParaJuros() {
        ZonedDateTime agora = ZonedDateTime.now(ZONE_RECIFE);
        LocalDate hoje = agora.toLocalDate();
        if (agora.getHour() < HORA_JOB_RECIFE) {
            return hoje.minusDays(1);
        }
        return hoje;
    }

    @Transactional
    public int atualizarPendentesParaAtrasado() {
        LocalDate hoje = LocalDate.now(ZONE_RECIFE);
        List<Mensalidade> pendentesVencidas = mensalidadeRepository.findByStatusAndVencimentoBefore(PENDENTE, hoje);
        LocalDate dataRefJuros = dataReferenciaParaJuros();
        for (Mensalidade m : pendentesVencidas) {
            m.setStatus(StatusMensalidade.ATRASADO);
            aplicarMultaEJuros(m, dataRefJuros);
        }
        if (!pendentesVencidas.isEmpty()) {
            mensalidadeRepository.saveAll(pendentesVencidas);
        }
        return pendentesVencidas.size();
    }

    /** Recalcula juros (1% ao dia) em todas as parcelas ATRASADO e persiste. Multa (10%) permanece. Novo dia só conta após 9h. */
    @Transactional
    public int atualizarMultaJurosAtrasados() {
        LocalDate dataRefJuros = dataReferenciaParaJuros();
        List<Mensalidade> atrasadas = mensalidadeRepository.findByStatusOrderByAluno_NomeAsc(ATRASADO);
        for (Mensalidade m : atrasadas) {
            aplicarMultaEJuros(m, dataRefJuros);
        }
        if (!atrasadas.isEmpty()) {
            mensalidadeRepository.saveAll(atrasadas);
        }
        return atrasadas.size();
    }

    private void aplicarMultaEJuros(Mensalidade m, LocalDate dataReferencia) {
        BigDecimal valor = m.getValor() != null ? m.getValor() : BigDecimal.ZERO;
        long dias = ChronoUnit.DAYS.between(m.getVencimento(), dataReferencia);
        if (dias < 0) dias = 0;
        BigDecimal multa = valor.multiply(MULTA_PERCENTUAL).setScale(ESCALA_MONETARIA, RoundingMode.HALF_UP);
        BigDecimal jurosPorDia = valor.multiply(JUROS_PERCENTUAL_DIA).setScale(ESCALA_MONETARIA, RoundingMode.HALF_UP);
        BigDecimal juros = jurosPorDia.multiply(BigDecimal.valueOf(dias)).setScale(ESCALA_MONETARIA, RoundingMode.HALF_UP);
        m.setValorMulta(multa);
        m.setValorJuros(juros);
    }

    private static LocalDate proximoDiaUtil(LocalDate data) {
        LocalDate d = data;
        while (isFimDeSemana(d) || FeriadosNacionais.isFeriadoNacional(d)) {
            d = d.plusDays(1);
        }
        return d;
    }

    private static boolean isFimDeSemana(LocalDate data) {
        DayOfWeek d = data.getDayOfWeek();
        return d == DayOfWeek.SATURDAY || d == DayOfWeek.SUNDAY;
    }

    private static final String[] DIAS_SEMANA = { "", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo" };

    private static String formatarDiasHorariosTurma(Turma turma) {
        if (turma == null) return "";
        List<TurmaHorario> horarios = turma.getHorarios();
        if (horarios != null && !horarios.isEmpty()) {
            return horarios.stream()
                    .map(h -> {
                        String dia = (h.getDiaSemana() != null && h.getDiaSemana() >= 1 && h.getDiaSemana() <= 7)
                                ? DIAS_SEMANA[h.getDiaSemana()] : "";
                        String inicio = h.getHorarioInicio() != null ? h.getHorarioInicio().format(DateTimeFormatter.ofPattern("H'h'mm")) : "";
                        String fim = h.getHorarioFim() != null ? "-" + h.getHorarioFim().format(DateTimeFormatter.ofPattern("H'h'mm")) : "";
                        return (dia + " " + inicio + fim).trim();
                    })
                    .filter(s -> !s.isBlank())
                    .collect(Collectors.joining(", "));
        }
        if (turma.getDiaSemana() != null && turma.getHorarioInicio() != null) {
            String dia = (turma.getDiaSemana() >= 1 && turma.getDiaSemana() <= 7) ? DIAS_SEMANA[turma.getDiaSemana()] : "";
            return dia + " " + turma.getHorarioInicio().format(DateTimeFormatter.ofPattern("H'h'mm"));
        }
        return "";
    }

    private MensalidadeDTO toDTO(Mensalidade mensalidade) {
        return MensalidadeDTO.builder()
                .id(mensalidade.getId())
                .ano(mensalidade.getAno())
                .mes(mensalidade.getMes())
                .valor(mensalidade.getValor())
                .valorMulta(mensalidade.getValorMulta())
                .valorJuros(mensalidade.getValorJuros())
                .vencimento(mensalidade.getVencimento())
                .dataPagamento(mensalidade.getDataPagamento())
                .formaPagamento(mensalidade.getFormaPagamento())
                .status(mensalidade.getStatus())
                .alunoId(mensalidade.getAluno().getId())
                .alunoNome(mensalidade.getAluno().getNome())
                .alunoCpf(mensalidade.getAluno().getCpf())
                .build();
    }
}
