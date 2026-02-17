package br.com.newmusic.web.dto;

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
public class MatriculaDTO {

    private Long id;
    private LocalDate dataInicio;
    private LocalDate dataFim;
    private Boolean ativo;
    private BigDecimal valorCurso;
    private LocalDate dataVencimento;
    private Integer aulasPorSemana;
    private Long alunoId;
    private String alunoNome;
    private Long turmaId;
    private String turmaDescricao;
}
