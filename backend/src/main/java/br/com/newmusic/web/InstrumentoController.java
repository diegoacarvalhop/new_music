package br.com.newmusic.web;

import br.com.newmusic.service.InstrumentoService;
import br.com.newmusic.web.dto.InstrumentoDTO;
import br.com.newmusic.web.dto.InstrumentoInput;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Instrumentos", description = "Cadastro e listagem de instrumentos")
@RestController
@RequestMapping("/api/instrumentos")
@RequiredArgsConstructor
public class InstrumentoController {

    private final InstrumentoService instrumentoService;

    @Operation(summary = "Listar instrumentos", description = "Lista paginada, opcionalmente filtrada por grupo")
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'PROFESSOR', 'FUNCIONARIO')")
    public ResponseEntity<Page<InstrumentoDTO>> listar(
            @RequestParam(required = false) Long grupoId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        if (size != 10 && size != 20 && size != 30) size = 10;
        Pageable pageable = grupoId != null
                ? PageRequest.of(page, size)
                : PageRequest.of(page, size, Sort.by("nome"));
        return ResponseEntity.ok(instrumentoService.listarPaginado(pageable, grupoId));
    }

    @Operation(summary = "Listar instrumentos ativos")
    @GetMapping("/ativos")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'PROFESSOR', 'FUNCIONARIO')")
    public ResponseEntity<List<InstrumentoDTO>> listarAtivos(@RequestParam(required = false) Long grupoId) {
        return ResponseEntity.ok(instrumentoService.listarAtivos(grupoId));
    }

    @Operation(summary = "Buscar instrumento por ID")
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'PROFESSOR', 'FUNCIONARIO')")
    public ResponseEntity<InstrumentoDTO> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(instrumentoService.buscarPorId(id));
    }

    @Operation(summary = "Criar instrumento")
    @PostMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<InstrumentoDTO> criar(@Valid @RequestBody InstrumentoInput input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(instrumentoService.criar(input));
    }

    @Operation(summary = "Atualizar instrumento")
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<InstrumentoDTO> atualizar(@PathVariable Long id, @Valid @RequestBody InstrumentoInput input) {
        return ResponseEntity.ok(instrumentoService.atualizar(id, input));
    }

    @Operation(summary = "Excluir instrumento")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        instrumentoService.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
