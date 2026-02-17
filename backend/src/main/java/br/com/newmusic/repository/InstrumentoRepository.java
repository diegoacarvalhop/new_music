package br.com.newmusic.repository;

import br.com.newmusic.domain.Instrumento;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InstrumentoRepository extends JpaRepository<Instrumento, Long> {

    Optional<Instrumento> findFirstByNomeIgnoreCase(String nome);

    Optional<Instrumento> findFirstByNomeIgnoreCaseAndIdNot(String nome, Long id);

    List<Instrumento> findAllByOrderByNomeAsc();

    List<Instrumento> findByAtivoTrueOrderByNomeAsc();

    List<Instrumento> findByGrupoIdOrderByNomeAsc(Long grupoId);

    List<Instrumento> findByAtivoTrueAndGrupoIdOrderByNomeAsc(Long grupoId);

    Page<Instrumento> findByGrupoIdOrderByNomeAsc(Long grupoId, Pageable pageable);
}
