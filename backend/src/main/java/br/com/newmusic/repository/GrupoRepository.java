package br.com.newmusic.repository;

import br.com.newmusic.domain.Grupo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GrupoRepository extends JpaRepository<Grupo, Long> {

    List<Grupo> findAllByOrderByNomeAsc();
}
