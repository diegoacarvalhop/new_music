package br.com.newmusic.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {

    @NotBlank(message = "E-mail é obrigatório")
    @Email
    private String email;

    @NotBlank(message = "Senha é obrigatória")
    private String senha;
}
