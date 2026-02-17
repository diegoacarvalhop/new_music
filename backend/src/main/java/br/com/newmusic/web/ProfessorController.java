package br.com.newmusic.web;

import br.com.newmusic.service.ProfessorService;
import br.com.newmusic.web.dto.ProfessorDTO;
import br.com.newmusic.web.dto.ProfessorInput;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Professores", description = "Cadastro e listagem de professores")
@RestController
@RequestMapping("/api/professores")
@RequiredArgsConstructor
public class ProfessorController {

    private final ProfessorService professorService;

    @Operation(summary = "Listar professores")
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'PROFESSOR', 'FUNCIONARIO')")
    public ResponseEntity<Page<ProfessorDTO>> listar(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String busca) {
        if (size != 10 && size != 20 && size != 30) size = 10;
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(professorService.listar(pageable, busca));
    }

    @Operation(summary = "Listar professores ativos")
    @GetMapping("/ativos")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'PROFESSOR', 'FUNCIONARIO')")
    public ResponseEntity<List<ProfessorDTO>> listarAtivos() {
        return ResponseEntity.ok(professorService.listarAtivos());
    }

    @Operation(summary = "Buscar professor por ID")
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'PROFESSOR', 'FUNCIONARIO')")
    public ResponseEntity<ProfessorDTO> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(professorService.buscarPorId(id));
    }

    @Operation(summary = "Criar professor")
    @PostMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<ProfessorDTO> criar(@Valid @RequestBody ProfessorInput input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(professorService.criar(input));
    }

    @Operation(summary = "Atualizar professor")
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<ProfessorDTO> atualizar(@PathVariable Long id, @Valid @RequestBody ProfessorInput input) {
        return ResponseEntity.ok(professorService.atualizar(id, input));
    }

    @Operation(summary = "Excluir professor")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        professorService.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
