package br.com.newmusic.web;

import br.com.newmusic.security.UsuarioPrincipal;
import br.com.newmusic.service.PresencaProfessorService;
import br.com.newmusic.web.dto.PresencaProfessorDTO;
import br.com.newmusic.web.dto.PresencaProfessorLoteInput;
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

@Tag(name = "Presença professor", description = "Chamada e presenças de professores")
@RestController
@RequestMapping("/api/professores/{professorId}/presencas")
@RequiredArgsConstructor
public class PresencaProfessorController {

    private final PresencaProfessorService presencaProfessorService;

    @Operation(summary = "Listar chamada do professor na data")
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'PROFESSOR', 'FUNCIONARIO')")
    public ResponseEntity<List<PresencaProfessorDTO>> listarChamada(
            @PathVariable Long professorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data,
            @AuthenticationPrincipal UsuarioPrincipal principal) {
        if (principal != null && principal.getProfessorId() != null && !principal.getProfessorId().equals(professorId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(presencaProfessorService.listarChamadaPorProfessorEData(professorId, data));
    }

    @Operation(summary = "Listar presenças do professor no mês")
    @GetMapping("/mes")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'PROFESSOR', 'FUNCIONARIO')")
    public ResponseEntity<List<PresencaProfessorDTO>> listarPorMes(
            @PathVariable Long professorId,
            @RequestParam int ano,
            @RequestParam int mes,
            @AuthenticationPrincipal UsuarioPrincipal principal) {
        if (principal != null && principal.getProfessorId() != null && !principal.getProfessorId().equals(professorId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(presencaProfessorService.listarPorProfessorEMes(professorId, ano, mes));
    }

    @Operation(summary = "Salvar lote de presenças do professor")
    @PostMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<List<PresencaProfessorDTO>> salvarLote(
            @PathVariable Long professorId,
            @Valid @RequestBody PresencaProfessorLoteInput input) {
        return ResponseEntity.ok(presencaProfessorService.salvarLote(professorId, input));
    }
}
