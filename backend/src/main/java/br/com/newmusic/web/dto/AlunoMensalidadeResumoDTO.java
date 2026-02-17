package br.com.newmusic.web.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlunoMensalidadeResumoDTO {
    private Long alunoId;
    private String alunoNome;
    private Long matriculaId;
    private String turmaDescricao;
    private String turmaDiasHorarios;
    private Long totalMensalidades;
}
