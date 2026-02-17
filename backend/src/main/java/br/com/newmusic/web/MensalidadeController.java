package br.com.newmusic.web;

import br.com.newmusic.security.UsuarioPrincipal;
import br.com.newmusic.service.MensalidadeService;
import br.com.newmusic.web.dto.AlunoMensalidadeResumoDTO;
import br.com.newmusic.web.dto.BaixaPagamentoInput;
import br.com.newmusic.web.dto.MensalidadeDTO;
import br.com.newmusic.web.dto.MensalidadeInput;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Mensalidades", description = "Financeiro: parcelas, baixa de pagamento e resumo por aluno")
@RestController
@RequestMapping("/api/mensalidades")
@RequiredArgsConstructor
public class MensalidadeController {

    private final MensalidadeService mensalidadeService;

    @Operation(summary = "Listar mensalidades")
    @GetMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<Page<MensalidadeDTO>> listar(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String busca) {
        if (size != 10 && size != 20 && size != 30) size = 10;
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(mensalidadeService.listar(pageable, busca));
    }

    @Operation(summary = "Contagem de mensalidades pendentes")
    @GetMapping("/contagem-pendentes")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<Long> contagemPendentes() {
        return ResponseEntity.ok(mensalidadeService.contagemPendentes());
    }

    @Operation(summary = "Contagem de alunos (com mensalidades)")
    @GetMapping("/contagem-alunos")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<Long> contagemAlunos(@RequestParam(required = false) String busca) {
        return ResponseEntity.ok(mensalidadeService.contagemAlunos(busca));
    }

    @Operation(summary = "Contagem de alunos com pagamento atrasado")
    @GetMapping("/contagem-alunos-atrasados")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<Long> contagemAlunosAtrasados() {
        return ResponseEntity.ok(mensalidadeService.contagemAlunosComPagamentoAtrasado());
    }

    @Operation(summary = "Listar mensalidades por mês/ano")
    @GetMapping("/por-mes")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<List<MensalidadeDTO>> listarPorMesAno(
            @RequestParam int ano,
            @RequestParam(required = false) Integer mes) {
        return ResponseEntity.ok(mensalidadeService.listarPorMesAno(ano, mes));
    }

    @Operation(summary = "Listar parcelas do aluno")
    @GetMapping("/aluno/{alunoId}")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'PROFESSOR', 'FUNCIONARIO')")
    public ResponseEntity<List<MensalidadeDTO>> listarPorAluno(@PathVariable Long alunoId) {
        return ResponseEntity.ok(mensalidadeService.listarPorAluno(alunoId));
    }

    @Operation(summary = "Listar alunos com resumo de mensalidades (financeiro)")
    @GetMapping("/alunos")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<Page<AlunoMensalidadeResumoDTO>> listarAlunosPaginado(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String busca) {
        if (size != 10 && size != 20 && size != 30) size = 10;
        return ResponseEntity.ok(mensalidadeService.listarAlunosPaginado(PageRequest.of(page, size), busca));
    }

    @Operation(summary = "Listar parcelas do aluno (paginado)")
    @GetMapping("/aluno/{alunoId}/parcelas")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<Page<MensalidadeDTO>> listarParcelasPorAluno(
            @PathVariable Long alunoId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        if (size != 10 && size != 20 && size != 30) size = 10;
        return ResponseEntity.ok(mensalidadeService.listarPorAluno(alunoId, PageRequest.of(page, size)));
    }

    @Operation(summary = "Listar parcelas da matrícula")
    @GetMapping("/matricula/{matriculaId}/parcelas")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<Page<MensalidadeDTO>> listarParcelasPorMatricula(
            @PathVariable Long matriculaId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        if (size != 10 && size != 20 && size != 30) size = 10;
        return ResponseEntity.ok(mensalidadeService.listarPorMatricula(matriculaId, PageRequest.of(page, size)));
    }

    @Operation(summary = "Verificar se aluno está em dia com pagamentos")
    @GetMapping("/aluno/{alunoId}/em-dia")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'PROFESSOR', 'FUNCIONARIO')")
    public ResponseEntity<Boolean> alunoPagamentoEmDia(@PathVariable Long alunoId) {
        return ResponseEntity.ok(mensalidadeService.alunoPagamentoEmDia(alunoId));
    }

    @Operation(summary = "Buscar mensalidade por ID")
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<MensalidadeDTO> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(mensalidadeService.buscarPorId(id));
    }

    @Operation(summary = "Criar mensalidade")
    @PostMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<MensalidadeDTO> criar(@Valid @RequestBody MensalidadeInput input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(mensalidadeService.criar(input));
    }

    @Operation(summary = "Dar baixa no pagamento da parcela")
    @PatchMapping("/{id}/baixa")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<MensalidadeDTO> darBaixa(
            @PathVariable Long id,
            @RequestBody BaixaPagamentoInput input,
            @AuthenticationPrincipal UsuarioPrincipal principal) {
        return ResponseEntity.ok(mensalidadeService.darBaixa(id, input != null ? input : new BaixaPagamentoInput(), principal));
    }

    @Operation(summary = "Excluir mensalidade")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        mensalidadeService.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
