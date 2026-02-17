package br.com.newmusic.repository;

import br.com.newmusic.domain.Presenca;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface PresencaRepository extends JpaRepository<Presenca, Long> {

    List<Presenca> findByTurmaId(Long turmaId);

    @Query("SELECT p FROM Presenca p JOIN FETCH p.turma JOIN FETCH p.matricula m JOIN FETCH m.aluno WHERE p.turma.id = :turmaId ORDER BY p.dataAula ASC, m.aluno.nome")
    List<Presenca> findByTurmaIdWithAlunoOrderByDataAulaAscAlunoNome(@Param("turmaId") Long turmaId);

    List<Presenca> findByTurmaIdAndDataAulaOrderByMatricula_Aluno_Nome(Long turmaId, LocalDate dataAula);

    Optional<Presenca> findByTurmaIdAndMatriculaIdAndDataAula(Long turmaId, Long matriculaId, LocalDate dataAula);

    List<Presenca> findByMatriculaIdOrderByDataAulaDesc(Long matriculaId);

    List<Presenca> findByTurmaIdAndMatriculaIdAndDataAulaBetweenOrderByDataAulaAsc(
            Long turmaId, Long matriculaId, LocalDate start, LocalDate end);

    @Query("SELECT p FROM Presenca p JOIN FETCH p.turma JOIN FETCH p.matricula m JOIN FETCH m.aluno WHERE p.turma.id = :turmaId AND p.dataAula BETWEEN :start AND :end ORDER BY p.dataAula, m.aluno.nome")
    List<Presenca> findByTurmaIdAndDataAulaBetweenWithAluno(@Param("turmaId") Long turmaId, @Param("start") LocalDate start, @Param("end") LocalDate end);

    List<Presenca> findByMatriculaIdAndDataAulaBetweenOrderByDataAulaAsc(Long matriculaId, LocalDate start, LocalDate end);

    @Query("SELECT DISTINCT p FROM Presenca p JOIN FETCH p.turma JOIN FETCH p.matricula m JOIN FETCH m.aluno ORDER BY p.dataAula ASC, m.aluno.nome")
    List<Presenca> findAllWithAlunoOrderByDataAulaAscAlunoNome();
}
