package br.com.newmusic.web.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PresencaProfessorDTO {

    private Long id;
    private Long professorId;
    private Long turmaId;
    private String turmaDescricao;
    private LocalDate dataAula;
    private Boolean presente;
}
