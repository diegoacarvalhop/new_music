package br.com.newmusic.repository;

import br.com.newmusic.domain.PresencaProfessor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface PresencaProfessorRepository extends JpaRepository<PresencaProfessor, Long> {

    Optional<PresencaProfessor> findByProfessorIdAndTurmaIdAndDataAula(Long professorId, Long turmaId, LocalDate dataAula);

    List<PresencaProfessor> findByProfessorIdAndDataAulaOrderByTurma_Id(Long professorId, LocalDate dataAula);

    List<PresencaProfessor> findByProfessorIdAndDataAulaBetweenOrderByDataAulaAscTurma_Id(Long professorId, LocalDate start, LocalDate end);

    List<PresencaProfessor> findByProfessorId(Long professorId);

    List<PresencaProfessor> findByTurmaId(Long turmaId);

    List<PresencaProfessor> findByTurmaIdAndDataAulaBetweenOrderByDataAulaAsc(Long turmaId, LocalDate start, LocalDate end);
}
