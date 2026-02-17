package br.com.newmusic.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;

@Data
public class AlunoInput {

    @NotBlank(message = "Nome é obrigatório")
    private String nome;

    @NotBlank(message = "E-mail é obrigatório")
    @Email
    private String email;

    private String telefone;
    private String cpf;
    private LocalDate dataNascimento;
    private String responsavelNome;
    private String responsavelCpf;
    private String endereco;
    private String observacoes;
    private Boolean ativo;
}
