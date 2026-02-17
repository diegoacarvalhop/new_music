package br.com.newmusic.service;

import br.com.newmusic.domain.Grupo;
import br.com.newmusic.repository.GrupoRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GrupoServiceTest {

    @Mock
    private GrupoRepository grupoRepository;

    @InjectMocks
    private GrupoService grupoService;

    @Test
    void listar_retornaTodosOrdenadosPorNome() {
        Grupo g1 = new Grupo();
        g1.setId(1L);
        g1.setNome("Cordas");
        Grupo g2 = new Grupo();
        g2.setId(2L);
        g2.setNome("Canto");
        when(grupoRepository.findAllByOrderByNomeAsc()).thenReturn(List.of(g2, g1));

        var result = grupoService.listar();

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getNome()).isEqualTo("Canto");
        assertThat(result.get(0).getId()).isEqualTo(2L);
        assertThat(result.get(1).getNome()).isEqualTo("Cordas");
        assertThat(result.get(1).getId()).isEqualTo(1L);
    }

    @Test
    void listar_retornaListaVaziaQuandoNenhumGrupo() {
        when(grupoRepository.findAllByOrderByNomeAsc()).thenReturn(List.of());

        var result = grupoService.listar();

        assertThat(result).isEmpty();
    }
}
