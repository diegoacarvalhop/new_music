package br.com.newmusic.web;

import br.com.newmusic.security.UsuarioPrincipal;
import br.com.newmusic.service.TurmaService;
import br.com.newmusic.web.dto.TurmaDTO;
import br.com.newmusic.web.dto.TurmaInput;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Turmas", description = "Cadastro e listagem de turmas")
@RestController
@RequestMapping("/api/turmas")
@RequiredArgsConstructor
public class TurmaController {

    private final TurmaService turmaService;

    @Operation(summary = "Listar turmas do professor")
    @GetMapping("/by-professor/{professorId}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<List<TurmaDTO>> listarPorProfessor(@PathVariable Long professorId) {
        return ResponseEntity.ok(turmaService.listarPorProfessor(professorId));
    }

    @Operation(summary = "Listar turmas")
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'PROFESSOR', 'FUNCIONARIO')")
    public ResponseEntity<Page<TurmaDTO>> listar(
            @AuthenticationPrincipal UsuarioPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String busca) {
        if (size != 10 && size != 20 && size != 30) size = 10;
        Pageable pageable = PageRequest.of(page, size);
        Long professorIdFiltro = (principal != null && principal.getProfessorId() != null) ? principal.getProfessorId() : null;
        return ResponseEntity.ok(turmaService.listar(pageable, busca, professorIdFiltro));
    }

    @Operation(summary = "Buscar turma por ID")
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'PROFESSOR', 'FUNCIONARIO')")
    public ResponseEntity<TurmaDTO> buscarPorId(@PathVariable Long id, @AuthenticationPrincipal UsuarioPrincipal principal) {
        if (principal != null && principal.getProfessorId() != null) {
            if (!turmaService.turmaPertenceAoProfessor(id, principal.getProfessorId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
        }
        return ResponseEntity.ok(turmaService.buscarPorId(id));
    }

    @Operation(summary = "Criar turma")
    @PostMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<TurmaDTO> criar(@Valid @RequestBody TurmaInput input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(turmaService.criar(input));
    }

    @Operation(summary = "Atualizar turma")
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<TurmaDTO> atualizar(@PathVariable Long id, @Valid @RequestBody TurmaInput input) {
        return ResponseEntity.ok(turmaService.atualizar(id, input));
    }

    @Operation(summary = "Excluir turma")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        turmaService.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
