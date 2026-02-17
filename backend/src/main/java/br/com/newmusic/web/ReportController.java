package br.com.newmusic.web;

import br.com.newmusic.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Tag(name = "Relatórios", description = "Relatórios cadastrais, financeiros e de presença")
@RestController
@RequestMapping("/api/relatorios")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ROLE_ADMINISTRADOR') or hasAuthority('ROLE_FUNCIONARIO')")
public class ReportController {

    private final ReportService reportService;

    @Operation(summary = "Relatório de grupos")
    @GetMapping("/cadastrais/grupos")
    public ResponseEntity<List<Map<String, Object>>> grupos() {
        return ResponseEntity.ok(reportService.relatorioGrupos());
    }

    @Operation(summary = "Relatório de instrumentos")
    @GetMapping("/cadastrais/instrumentos")
    public ResponseEntity<List<Map<String, Object>>> instrumentos(@RequestParam(required = false) Long grupoId) {
        return ResponseEntity.ok(reportService.relatorioInstrumentos(grupoId));
    }

    @Operation(summary = "Instrumentos usados em turmas (para filtros)")
    @GetMapping("/cadastrais/instrumentos-turmas")
    public ResponseEntity<List<Map<String, Object>>> instrumentosTurmas() {
        return ResponseEntity.ok(reportService.instrumentosDasTurmas());
    }

    @Operation(summary = "Relatório de alunos")
    @GetMapping("/cadastrais/alunos")
    public ResponseEntity<List<Map<String, Object>>> alunos(
            @RequestParam(required = false) Boolean ativo,
            @RequestParam(required = false) Long instrumentoId) {
        return ResponseEntity.ok(reportService.relatorioAlunos(ativo, instrumentoId));
    }

    @Operation(summary = "Relatório de professores")
    @GetMapping("/cadastrais/professores")
    public ResponseEntity<List<Map<String, Object>>> professores(@RequestParam(required = false) Boolean ativo) {
        return ResponseEntity.ok(reportService.relatorioProfessores(ativo));
    }

    @Operation(summary = "Relatório de usuários")
    @GetMapping("/cadastrais/usuarios")
    public ResponseEntity<List<Map<String, Object>>> usuarios(@RequestParam(required = false) String perfil) {
        return ResponseEntity.ok(reportService.relatorioUsuarios(perfil));
    }

    @Operation(summary = "Relatório de turmas")
    @GetMapping("/cadastrais/turmas")
    public ResponseEntity<List<Map<String, Object>>> turmas(
            @RequestParam(required = false) Boolean ativo,
            @RequestParam(required = false) Long instrumentoId,
            @RequestParam(required = false) Long professorId) {
        return ResponseEntity.ok(reportService.relatorioTurmas(ativo, instrumentoId, professorId));
    }

    @Operation(summary = "Relatório de matrículas")
    @GetMapping("/matriculas")
    public ResponseEntity<List<Map<String, Object>>> matriculas(
            @RequestParam(required = false) Boolean ativo,
            @RequestParam(required = false) Long alunoId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim) {
        return ResponseEntity.ok(reportService.relatorioMatriculas(ativo, alunoId, dataInicio, dataFim));
    }

    @Operation(summary = "Relatório de mensalidades")
    @GetMapping("/mensalidades")
    public ResponseEntity<List<Map<String, Object>>> mensalidades(
            @RequestParam(required = false) Integer ano,
            @RequestParam(required = false) Integer mes,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long alunoId) {
        return ResponseEntity.ok(reportService.relatorioMensalidades(ano, mes, status, alunoId));
    }

    @Operation(summary = "Relatório de inadimplência")
    @GetMapping("/inadimplencia")
    public ResponseEntity<List<Map<String, Object>>> inadimplencia(
            @RequestParam(required = false) Integer ano,
            @RequestParam(required = false) Integer mes) {
        return ResponseEntity.ok(reportService.relatorioInadimplencia(ano, mes));
    }

    @Operation(summary = "Relatório de receita")
    @GetMapping("/receita")
    public ResponseEntity<List<Map<String, Object>>> receita(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim,
            @RequestParam(required = false) String formaPagamento) {
        return ResponseEntity.ok(reportService.relatorioReceita(dataInicio, dataFim, formaPagamento));
    }

    @Operation(summary = "Relatório de presença de alunos")
    @GetMapping("/presenca-alunos")
    public ResponseEntity<List<Map<String, Object>>> presencaAlunos(
            @RequestParam(required = false) Long alunoId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim) {
        return ResponseEntity.ok(reportService.relatorioPresencaAlunos(alunoId, dataInicio, dataFim));
    }

    @Operation(summary = "Relatório de presença de professores")
    @GetMapping("/presenca-professores")
    public ResponseEntity<List<Map<String, Object>>> presencaProfessores(
            @RequestParam(required = false) Long professorId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim) {
        return ResponseEntity.ok(reportService.relatorioPresencaProfessores(professorId, dataInicio, dataFim));
    }

    @Operation(summary = "Relatório de auditoria")
    @GetMapping("/auditoria")
    public ResponseEntity<List<Map<String, Object>>> auditoria(
            @RequestParam(required = false) Long usuarioId,
            @RequestParam(required = false) String tabela,
            @RequestParam(required = false) String acao,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dataFim) {
        return ResponseEntity.ok(reportService.relatorioAuditoria(usuarioId, tabela, acao, dataInicio, dataFim));
    }

    @Operation(summary = "Relatório de erros")
    @GetMapping("/erros")
    public ResponseEntity<List<Map<String, Object>>> erros(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dataFim) {
        return ResponseEntity.ok(reportService.relatorioErros(dataInicio, dataFim));
    }

    @Operation(summary = "Dados consolidados para dashboard")
    @GetMapping("/consolidado/dashboard")
    public ResponseEntity<Map<String, Object>> consolidadoDashboard() {
        return ResponseEntity.ok(reportService.relatorioConsolidadoDashboard());
    }

    @Operation(summary = "Aulas de hoje (detalhado para dashboard)")
    @GetMapping("/consolidado/aulas-hoje")
    public ResponseEntity<List<Map<String, Object>>> aulasHojeDashboard() {
        return ResponseEntity.ok(reportService.relatorioAulasHojeDetalhado());
    }
}
