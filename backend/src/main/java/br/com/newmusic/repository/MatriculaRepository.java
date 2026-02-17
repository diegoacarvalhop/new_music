package br.com.newmusic.repository;

import br.com.newmusic.domain.Matricula;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface MatriculaRepository extends JpaRepository<Matricula, Long> {

    @Query("SELECT DISTINCT mat FROM Matricula mat JOIN FETCH mat.turma t JOIN FETCH t.instrumento JOIN FETCH t.professor LEFT JOIN FETCH t.horarios WHERE mat.id IN :ids")
    List<Matricula> findByIdInWithTurma(@Param("ids") List<Long> ids);

    @Query("SELECT DISTINCT m.aluno.id FROM Matricula m WHERE m.ativo = true")
    List<Long> findDistinctAlunoIdsByAtivoTrue();

    List<Matricula> findByAlunoId(Long alunoId);

    List<Matricula> findByAlunoIdAndAtivoTrue(Long alunoId);

    List<Matricula> findByTurmaId(Long turmaId);

    long countByTurmaIdAndAtivoTrue(Long turmaId);

    Optional<Matricula> findByAlunoIdAndTurmaIdAndAtivoTrue(Long alunoId, Long turmaId);

    boolean existsByAlunoIdAndTurmaIdAndAtivoTrue(Long alunoId, Long turmaId);

    Page<Matricula> findByAlunoNomeContainingIgnoreCaseOrAlunoCpfContainingOrderByAlunoNomeAscDataInicioDesc(String nome, String cpf, Pageable pageable);

    List<Matricula> findByDataInicioBetweenOrderByDataInicioDesc(LocalDate start, LocalDate end);
}
