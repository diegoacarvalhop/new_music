package br.com.newmusic.repository;

import br.com.newmusic.domain.Professor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProfessorRepository extends JpaRepository<Professor, Long> {

    Optional<Professor> findByUsuario_Id(Long usuarioId);

    Optional<Professor> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByEmailAndIdNot(String email, Long id);

    List<Professor> findByAtivoTrue();

    Page<Professor> findByNomeContainingIgnoreCaseOrCpfContainingOrInstrumentosContainingIgnoreCase(String nome, String cpf, String instrumentos, Pageable pageable);

    @Query("SELECT p FROM Professor p WHERE LOWER(TRIM(p.nome)) = LOWER(TRIM(:nome))")
    List<Professor> findByNomeTrimEqualsIgnoreCase(@Param("nome") String nome);
}
