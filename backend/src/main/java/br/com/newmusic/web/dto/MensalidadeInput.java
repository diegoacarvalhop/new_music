package br.com.newmusic.web.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class MensalidadeInput {

    @NotNull(message = "Ano é obrigatório")
    private Integer ano;

    @NotNull(message = "Mês é obrigatório")
    private Integer mes;

    @NotNull(message = "Valor é obrigatório")
    private BigDecimal valor;

    @NotNull(message = "Data de vencimento é obrigatória")
    private LocalDate vencimento;

    @NotNull(message = "Aluno é obrigatório")
    private Long alunoId;
}
