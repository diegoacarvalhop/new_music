package br.com.newmusic.web.dto;

import br.com.newmusic.domain.Perfil;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UsuarioInput {

    @NotBlank(message = "Nome é obrigatório")
    private String nome;

    @NotBlank(message = "E-mail é obrigatório")
    @Email
    private String email;

    private String senha;

    @NotNull(message = "Perfil é obrigatório")
    private Perfil perfil;

    private Boolean ativo;
}
