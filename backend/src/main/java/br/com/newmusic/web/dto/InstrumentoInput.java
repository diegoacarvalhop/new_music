package br.com.newmusic.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class InstrumentoInput {

    @NotBlank(message = "Nome é obrigatório")
    private String nome;

    @NotNull(message = "Grupo é obrigatório")
    private Long grupoId;

    private String descricao;
    private Boolean ativo;
}
