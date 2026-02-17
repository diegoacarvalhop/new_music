package br.com.newmusic.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ProfessorInput {

    @NotBlank(message = "Nome é obrigatório")
    private String nome;

    @NotBlank(message = "E-mail é obrigatório")
    @Email
    private String email;

    private String telefone;
    private String cpf;
    private String instrumentos;
    private String disponibilidade;
    private Boolean ativo;
    private String senha;
}
