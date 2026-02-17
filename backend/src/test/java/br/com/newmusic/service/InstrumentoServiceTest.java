package br.com.newmusic.service;

import br.com.newmusic.domain.Grupo;
import br.com.newmusic.domain.Instrumento;
import br.com.newmusic.repository.GrupoRepository;
import br.com.newmusic.repository.InstrumentoRepository;
import br.com.newmusic.repository.TurmaRepository;
import br.com.newmusic.web.dto.InstrumentoInput;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InstrumentoServiceTest {

    @Mock
    private InstrumentoRepository instrumentoRepository;
    @Mock
    private GrupoRepository grupoRepository;
    @Mock
    private TurmaRepository turmaRepository;
    @Mock
    private AuditService auditService;

    @InjectMocks
    private InstrumentoService instrumentoService;

    @Test
    void buscarPorId_quandoNaoExiste_lancaExcecao() {
        when(instrumentoRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> instrumentoService.buscarPorId(999L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Instrumento não encontrado");
    }

    @Test
    void listar_retornaListaPorGrupo() {
        Grupo grupo = new Grupo();
        grupo.setId(1L);
        Instrumento inst = new Instrumento();
        inst.setId(1L);
        inst.setNome("Violão");
        inst.setGrupo(grupo);
        when(instrumentoRepository.findByGrupoIdOrderByNomeAsc(1L)).thenReturn(List.of(inst));

        var result = instrumentoService.listar(1L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getNome()).isEqualTo("Violão");
        assertThat(result.get(0).getGrupoId()).isEqualTo(1L);
    }

    @Test
    void criar_quandoGrupoNaoExiste_lancaExcecao() {
        InstrumentoInput input = new InstrumentoInput();
        input.setNome("Violão");
        input.setGrupoId(999L);
        when(instrumentoRepository.findFirstByNomeIgnoreCase("Violão")).thenReturn(Optional.empty());
        when(grupoRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> instrumentoService.criar(input))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Grupo não encontrado");
    }

    @Test
    void criar_quandoNomeDuplicadoNoGrupo_lancaExcecao() {
        InstrumentoInput input = new InstrumentoInput();
        input.setNome("Violão");
        input.setGrupoId(1L);
        Grupo grupo = new Grupo();
        grupo.setId(1L);
        Instrumento existente = new Instrumento();
        existente.setGrupo(grupo);
        when(instrumentoRepository.findFirstByNomeIgnoreCase("Violão")).thenReturn(Optional.of(existente));

        assertThatThrownBy(() -> instrumentoService.criar(input))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Já existe um instrumento");
    }

    @Test
    void criar_sucesso_retornaDTO() {
        InstrumentoInput input = new InstrumentoInput();
        input.setNome("Violão");
        input.setGrupoId(1L);
        Grupo grupo = new Grupo();
        grupo.setId(1L);
        grupo.setNome("Cordas");
        when(instrumentoRepository.findFirstByNomeIgnoreCase("Violão")).thenReturn(Optional.empty());
        when(grupoRepository.findById(1L)).thenReturn(Optional.of(grupo));
        Instrumento salvo = new Instrumento();
        salvo.setId(1L);
        salvo.setNome("Violão");
        salvo.setGrupo(grupo);
        when(instrumentoRepository.save(any(Instrumento.class))).thenReturn(salvo);

        var dto = instrumentoService.criar(input);

        assertThat(dto.getId()).isEqualTo(1L);
        assertThat(dto.getNome()).isEqualTo("Violão");
        verify(auditService).registrar(eq("CRIAR"), eq("instrumentos"), eq("1"), any(), any());
    }

    @Test
    void excluir_quandoPossuiTurma_lancaExcecao() {
        Instrumento inst = new Instrumento();
        inst.setId(1L);
        when(instrumentoRepository.findById(1L)).thenReturn(Optional.of(inst));
        when(turmaRepository.existsByInstrumentoId(1L)).thenReturn(true);

        assertThatThrownBy(() -> instrumentoService.excluir(1L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("turma");
    }

    @Test
    void excluir_sucesso() {
        Instrumento inst = new Instrumento();
        inst.setId(1L);
        inst.setNome("Violão");
        when(instrumentoRepository.findById(1L)).thenReturn(Optional.of(inst));
        when(turmaRepository.existsByInstrumentoId(1L)).thenReturn(false);

        instrumentoService.excluir(1L);

        verify(instrumentoRepository).delete(inst);
        verify(auditService).registrar(eq("EXCLUIR"), eq("instrumentos"), eq("1"), any(), any());
    }
}
