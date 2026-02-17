package br.com.newmusic.web.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfessorDTO {

    private Long id;
    private String nome;
    private String email;
    private String telefone;
    private String cpf;
    private String instrumentos;
    private String disponibilidade;
    private Boolean ativo;
    private Long usuarioId;
}
