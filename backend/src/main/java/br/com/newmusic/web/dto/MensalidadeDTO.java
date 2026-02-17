package br.com.newmusic.web.dto;

import br.com.newmusic.domain.StatusMensalidade;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MensalidadeDTO {

    private Long id;
    private Integer ano;
    private Integer mes;
    private BigDecimal valor;
    private BigDecimal valorMulta;
    private BigDecimal valorJuros;
    private LocalDate vencimento;
    private LocalDate dataPagamento;
    private String formaPagamento;
    private StatusMensalidade status;
    private Long alunoId;
    private String alunoNome;
    private String alunoCpf;
}
