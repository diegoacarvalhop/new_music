package br.com.newmusic.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalTime;
import java.util.List;

@Data
public class TurmaInput {

    @NotEmpty(message = "Informe ao menos um dia e horário")
    @Valid
    private List<HorarioSlotInput> horarios;

    private Integer capacidade;

    @NotNull(message = "Instrumento é obrigatório")
    private Long instrumentoId;

    @NotNull(message = "Professor é obrigatório")
    private Long professorId;

    private Boolean ativo;

    @Data
    public static class HorarioSlotInput {
        @NotNull(message = "Dia da semana é obrigatório (1=segunda a 5=sexta)")
        private Integer diaSemana;

        @NotNull(message = "Horário de início é obrigatório")
        private LocalTime horarioInicio;

        private LocalTime horarioFim;
    }
}
