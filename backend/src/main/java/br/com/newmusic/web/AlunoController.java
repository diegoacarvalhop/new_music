package br.com.newmusic.web;

import br.com.newmusic.service.AlunoService;
import br.com.newmusic.web.dto.AlunoDTO;
import br.com.newmusic.web.dto.AlunoInput;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Alunos", description = "Cadastro e listagem de alunos")
@RestController
@RequestMapping("/api/alunos")
@RequiredArgsConstructor
public class AlunoController {

    private final AlunoService alunoService;

    @Operation(summary = "Listar alunos", description = "Lista paginada com filtro opcional por nome ou CPF")
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'PROFESSOR', 'FUNCIONARIO')")
    public ResponseEntity<Page<AlunoDTO>> listar(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String busca) {
        if (size != 10 && size != 20 && size != 30) size = 10;
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(alunoService.listar(pageable, busca));
    }

    @Operation(summary = "Buscar aluno por ID")
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'PROFESSOR', 'FUNCIONARIO')")
    public ResponseEntity<AlunoDTO> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(alunoService.buscarPorId(id));
    }

    @Operation(summary = "Criar aluno")
    @PostMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<AlunoDTO> criar(@Valid @RequestBody AlunoInput input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(alunoService.criar(input));
    }

    @Operation(summary = "Atualizar aluno")
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<AlunoDTO> atualizar(@PathVariable Long id, @Valid @RequestBody AlunoInput input) {
        return ResponseEntity.ok(alunoService.atualizar(id, input));
    }

    @Operation(summary = "Excluir aluno")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        alunoService.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
