package br.com.newmusic.service;

import br.com.newmusic.domain.*;
import br.com.newmusic.repository.AlunoRepository;
import br.com.newmusic.repository.MatriculaRepository;
import br.com.newmusic.repository.MensalidadeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MensalidadeServiceTest {

    @Mock
    private MensalidadeRepository mensalidadeRepository;

    @Mock
    private AlunoRepository alunoRepository;

    @Mock
    private MatriculaRepository matriculaRepository;

    @InjectMocks
    private MensalidadeService mensalidadeService;

    private Aluno aluno;
    private Mensalidade mensalidadePaga;
    private Mensalidade mensalidadePendente;

    @BeforeEach
    void setUp() {
        aluno = new Aluno();
        aluno.setId(1L);
        aluno.setNome("Aluno Teste");

        mensalidadePaga = new Mensalidade();
        mensalidadePaga.setId(1L);
        mensalidadePaga.setAluno(aluno);
        mensalidadePaga.setAno(LocalDate.now().getYear());
        mensalidadePaga.setMes(LocalDate.now().getMonthValue());
        mensalidadePaga.setStatus(StatusMensalidade.PAGO);

        mensalidadePendente = new Mensalidade();
        mensalidadePendente.setId(2L);
        mensalidadePendente.setAluno(aluno);
        mensalidadePendente.setAno(LocalDate.now().getYear());
        mensalidadePendente.setMes(LocalDate.now().getMonthValue());
        mensalidadePendente.setStatus(StatusMensalidade.PENDENTE);
    }

    @Test
    void alunoPagamentoEmDia_quandoExisteMensalidadePagaNoMesCorrente_retornaTrue() {
        when(mensalidadeRepository.findByAlunoIdAndMatricula_AtivoTrueAndAnoAndMes(
                eq(1L),
                eq(LocalDate.now().getYear()),
                eq(LocalDate.now().getMonthValue())))
                .thenReturn(Optional.of(mensalidadePaga));

        boolean resultado = mensalidadeService.alunoPagamentoEmDia(1L);

        assertThat(resultado).isTrue();
    }

    @Test
    void alunoPagamentoEmDia_quandoNaoExisteMensalidadeOuEstaPendente_retornaFalse() {
        when(mensalidadeRepository.findByAlunoIdAndMatricula_AtivoTrueAndAnoAndMes(
                eq(1L),
                eq(LocalDate.now().getYear()),
                eq(LocalDate.now().getMonthValue())))
                .thenReturn(Optional.of(mensalidadePendente));

        boolean resultado = mensalidadeService.alunoPagamentoEmDia(1L);

        assertThat(resultado).isFalse();
    }

    @Test
    void alunoPagamentoEmDia_quandoNaoExisteMensalidade_retornaFalse() {
        when(mensalidadeRepository.findByAlunoIdAndMatricula_AtivoTrueAndAnoAndMes(
                eq(1L),
                eq(LocalDate.now().getYear()),
                eq(LocalDate.now().getMonthValue())))
                .thenReturn(Optional.empty());

        boolean resultado = mensalidadeService.alunoPagamentoEmDia(1L);

        assertThat(resultado).isFalse();
    }

    @Test
    void atualizarPendentesParaAtrasado_atualizaMensalidadesVencidas() {
        LocalDate ontem = LocalDate.now().minusDays(1);
        mensalidadePendente.setVencimento(ontem);
        mensalidadePendente.setValor(new BigDecimal("100.00"));
        when(mensalidadeRepository.findByStatusAndVencimentoBefore(
                eq(StatusMensalidade.PENDENTE),
                eq(LocalDate.now())))
                .thenReturn(List.of(mensalidadePendente));
        when(mensalidadeRepository.saveAll(any())).thenAnswer(i -> i.getArgument(0));

        int atualizadas = mensalidadeService.atualizarPendentesParaAtrasado();

        assertThat(atualizadas).isEqualTo(1);
        assertThat(mensalidadePendente.getStatus()).isEqualTo(StatusMensalidade.ATRASADO);
        assertThat(mensalidadePendente.getValorMulta()).isEqualByComparingTo(new BigDecimal("10.00"));
        // Juros: 0 ou 1 dia conforme horário (só conta novo dia após 9h)
        assertThat(mensalidadePendente.getValorJuros()).isIn(new BigDecimal("0.00"), new BigDecimal("1.00"));
        verify(mensalidadeRepository).saveAll(any());
    }
}
