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
public class AuthResponse {

    private String accessToken;
    private String refreshToken;
    private Long id;
    private String email;
    private String nome;
    private Perfil perfil;
    private Long professorId;
}
