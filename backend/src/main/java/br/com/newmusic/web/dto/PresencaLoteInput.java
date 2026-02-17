package br.com.newmusic.web.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class PresencaLoteInput {

    @NotNull(message = "Data da aula é obrigatória")
    private LocalDate dataAula;

    @NotNull(message = "Registros de presença são obrigatórios")
    private List<PresencaRegistroInput> registros;

    @Data
    public static class PresencaRegistroInput {
        @NotNull(message = "Matrícula é obrigatória")
        private Long matriculaId;
        private Boolean presente;
        private String conteudoAula;
    }
}
