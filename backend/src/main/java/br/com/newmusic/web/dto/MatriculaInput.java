package br.com.newmusic.web.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class MatriculaInput {

    @NotNull(message = "Data de início é obrigatória")
    private LocalDate dataInicio;

    private LocalDate dataFim;
    private Boolean ativo;

    private BigDecimal valorCurso;
    private LocalDate dataVencimento;
    private Integer aulasPorSemana;

    @NotNull(message = "Aluno é obrigatório")
    private Long alunoId;

    @NotNull(message = "Turma é obrigatória")
    private Long turmaId;
}
