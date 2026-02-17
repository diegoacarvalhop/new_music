package br.com.newmusic.web.dto;

import br.com.newmusic.domain.Perfil;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioDTO {
    private Long id;
    private String email;
    private String nome;
    private Perfil perfil;
    private Boolean ativo;
    private String professorCpf;
    private String professorTelefone;
}
