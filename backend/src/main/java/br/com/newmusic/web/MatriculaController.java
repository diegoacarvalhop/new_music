package br.com.newmusic.web;

import br.com.newmusic.service.MatriculaService;
import br.com.newmusic.web.dto.MatriculaDTO;
import br.com.newmusic.web.dto.MatriculaInput;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Matrículas", description = "Matrículas de alunos em turmas")
@RestController
@RequestMapping("/api/matriculas")
@RequiredArgsConstructor
public class MatriculaController {

    private final MatriculaService matriculaService;

    @Operation(summary = "Listar matrículas")
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'PROFESSOR', 'FUNCIONARIO')")
    public ResponseEntity<Page<MatriculaDTO>> listar(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String busca) {
        if (size != 10 && size != 20 && size != 30) size = 10;
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(matriculaService.listar(pageable, busca));
    }

    @Operation(summary = "Listar IDs de alunos com matrícula ativa")
    @GetMapping("/alunos-ativos")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'PROFESSOR', 'FUNCIONARIO')")
    public ResponseEntity<List<Long>> listarAlunoIdsComMatriculaAtiva() {
        return ResponseEntity.ok(matriculaService.listarAlunoIdsComMatriculaAtiva());
    }

    @Operation(summary = "Listar matrículas do aluno")
    @GetMapping("/aluno/{alunoId}")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'PROFESSOR', 'FUNCIONARIO')")
    public ResponseEntity<List<MatriculaDTO>> listarPorAluno(@PathVariable Long alunoId) {
        return ResponseEntity.ok(matriculaService.listarPorAluno(alunoId));
    }

    @Operation(summary = "Listar matrículas da turma")
    @GetMapping("/turma/{turmaId}")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'PROFESSOR', 'FUNCIONARIO')")
    public ResponseEntity<List<MatriculaDTO>> listarPorTurma(@PathVariable Long turmaId) {
        return ResponseEntity.ok(matriculaService.listarPorTurma(turmaId));
    }

    @Operation(summary = "Buscar matrícula por ID")
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'PROFESSOR', 'FUNCIONARIO')")
    public ResponseEntity<MatriculaDTO> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(matriculaService.buscarPorId(id));
    }

    @Operation(summary = "Criar matrícula")
    @PostMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<MatriculaDTO> criar(@Valid @RequestBody MatriculaInput input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(matriculaService.criar(input));
    }

    @Operation(summary = "Atualizar matrícula")
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<MatriculaDTO> atualizar(@PathVariable Long id, @Valid @RequestBody MatriculaInput input) {
        return ResponseEntity.ok(matriculaService.atualizar(id, input));
    }

    @Operation(summary = "Excluir matrícula")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        matriculaService.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
