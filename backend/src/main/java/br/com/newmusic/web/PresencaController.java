package br.com.newmusic.web;

import br.com.newmusic.security.UsuarioPrincipal;
import br.com.newmusic.service.PresencaService;
import br.com.newmusic.service.TurmaService;
import br.com.newmusic.web.dto.PresencaDTO;
import br.com.newmusic.web.dto.PresencaLoteInput;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@Tag(name = "Presença (turma)", description = "Chamada e presenças por turma")
@RestController
@RequestMapping("/api/turmas/{turmaId}/presencas")
@RequiredArgsConstructor
public class PresencaController {

    private final PresencaService presencaService;
    private final TurmaService turmaService;

    private boolean professorNaoPertenceTurma(Long turmaId, UsuarioPrincipal principal) {
        return principal != null && principal.getProfessorId() != null
                && !turmaService.turmaPertenceAoProfessor(turmaId, principal.getProfessorId());
    }

    @Operation(summary = "Listar presenças do aluno na turma no mês")
    @GetMapping("/aluno/{matriculaId}")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'PROFESSOR', 'FUNCIONARIO')")
    public ResponseEntity<List<PresencaDTO>> listarPresencasAlunoNoMes(
            @PathVariable Long turmaId,
            @PathVariable Long matriculaId,
            @RequestParam int ano,
            @RequestParam int mes,
            @AuthenticationPrincipal UsuarioPrincipal principal) {
        if (professorNaoPertenceTurma(turmaId, principal)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(presencaService.listarPorTurmaMatriculaEMes(turmaId, matriculaId, ano, mes));
    }

    @Operation(summary = "Listar chamada da turma na data")
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'PROFESSOR', 'FUNCIONARIO')")
    public ResponseEntity<List<PresencaDTO>> listarChamada(
            @PathVariable Long turmaId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data,
            @AuthenticationPrincipal UsuarioPrincipal principal) {
        if (professorNaoPertenceTurma(turmaId, principal)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(presencaService.listarChamadaPorTurmaEData(turmaId, data));
    }

    @Operation(summary = "Salvar lote de presenças (chamada)")
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'PROFESSOR', 'FUNCIONARIO')")
    public ResponseEntity<List<PresencaDTO>> salvarLote(
            @PathVariable Long turmaId,
            @Valid @RequestBody PresencaLoteInput input,
            @AuthenticationPrincipal UsuarioPrincipal principal) {
        if (professorNaoPertenceTurma(turmaId, principal)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(presencaService.salvarLote(turmaId, input));
    }
}
