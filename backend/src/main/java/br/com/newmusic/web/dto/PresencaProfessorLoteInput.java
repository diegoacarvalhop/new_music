package br.com.newmusic.web.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class PresencaProfessorLoteInput {

    @NotNull(message = "Data da aula é obrigatória")
    private LocalDate dataAula;

    @NotNull(message = "Registros de presença são obrigatórios")
    private List<RegistroInput> registros;

    @Data
    public static class RegistroInput {
        @NotNull(message = "Turma é obrigatória")
        private Long turmaId;
        private Boolean presente;
    }
}
