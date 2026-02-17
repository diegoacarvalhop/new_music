package br.com.newmusic.web.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InstrumentoDTO {

    private Long id;
    private String nome;
    private String descricao;
    private Long grupoId;
    private String grupoNome;
    private Boolean ativo;
}
