package br.com.newmusic.web.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PresencaDTO {

    private Long id;
    private Long turmaId;
    private Long matriculaId;
    private String alunoNome;
    private LocalDate dataAula;
    private Boolean presente;
    private String conteudoAula;
    private Boolean pagamentoEmDia;
}
