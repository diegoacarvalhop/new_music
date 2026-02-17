package br.com.newmusic.web.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TurmaDTO {

    private Long id;
    private Integer diaSemana;
    private LocalTime horarioInicio;
    private Integer capacidade;
    private Integer capacidadePreenchida;
    private Integer aulasPorSemana;
    private Long instrumentoId;
    private String instrumentoNome;
    private Long instrumentoGrupoId;
    private String instrumentoGrupoNome;
    private Long professorId;
    private String professorNome;
    private Boolean ativo;
    @Builder.Default
    private List<HorarioSlotDTO> horarios = new ArrayList<>();
    @Builder.Default
    private List<String> alunos = new ArrayList<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HorarioSlotDTO {
        private Integer diaSemana;
        private LocalTime horarioInicio;
        private LocalTime horarioFim;
    }
}
