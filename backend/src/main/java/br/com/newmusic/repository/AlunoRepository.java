package br.com.newmusic.repository;

import br.com.newmusic.domain.Aluno;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AlunoRepository extends JpaRepository<Aluno, Long> {

    Optional<Aluno> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByEmailAndIdNot(String email, Long id);

    Page<Aluno> findByNomeContainingIgnoreCaseOrCpfContaining(String nome, String cpf, Pageable pageable);

    @Query("SELECT a FROM Aluno a WHERE LOWER(TRIM(a.nome)) = LOWER(TRIM(:nome))")
    List<Aluno> findByNomeTrimEqualsIgnoreCase(@Param("nome") String nome);
}
