package br.com.newmusic.service;

import br.com.newmusic.domain.Grupo;
import br.com.newmusic.repository.GrupoRepository;
import br.com.newmusic.web.dto.GrupoDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GrupoService {

    private final GrupoRepository grupoRepository;

    @Transactional(readOnly = true)
    public List<GrupoDTO> listar() {
        return grupoRepository.findAllByOrderByNomeAsc().stream().map(this::toDTO).collect(Collectors.toList());
    }

    private GrupoDTO toDTO(Grupo grupo) {
        return GrupoDTO.builder()
                .id(grupo.getId())
                .nome(grupo.getNome())
                .build();
    }
}
