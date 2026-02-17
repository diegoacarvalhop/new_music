package br.com.newmusic.repository;

import br.com.newmusic.domain.Instrumento;
import br.com.newmusic.domain.Turma;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TurmaRepository extends JpaRepository<Turma, Long> {

    @Query("SELECT DISTINCT t.instrumento FROM Turma t ORDER BY t.instrumento.nome")
    List<Instrumento> findDistinctInstrumentosFromTurmas();

    @Query("SELECT t FROM Turma t LEFT JOIN FETCH t.horarios WHERE t.id = :id")
    Optional<Turma> findByIdWithHorarios(@Param("id") Long id);

    @Query("SELECT DISTINCT t FROM Turma t LEFT JOIN FETCH t.horarios LEFT JOIN FETCH t.instrumento LEFT JOIN FETCH t.professor")
    List<Turma> findAllWithHorariosAndInstrumentoAndProfessor();

    List<Turma> findByProfessor_IdOrderById(Long professorId);

    @Query("SELECT DISTINCT t FROM Turma t LEFT JOIN FETCH t.horarios WHERE t.professor.id = :professorId ORDER BY t.id")
    List<Turma> findByProfessorIdWithHorarios(@Param("professorId") Long professorId);

    Page<Turma> findByInstrumentoNomeContainingIgnoreCaseAndProfessorNomeContainingIgnoreCase(String instrumentoNome, String professorNome, Pageable pageable);

    @Query("SELECT t FROM Turma t WHERE LOWER(t.instrumento.nome) LIKE LOWER(CONCAT('%', :busca, '%')) OR LOWER(t.professor.nome) LIKE LOWER(CONCAT('%', :busca, '%'))")
    Page<Turma> findByInstrumentoOuProfessor(@Param("busca") String busca, Pageable pageable);

    Page<Turma> findByProfessor_IdAndInstrumentoNomeContainingIgnoreCase(Long professorId, String instrumentoNome, Pageable pageable);

    boolean existsByInstrumentoId(Long instrumentoId);

    long countByInstrumentoId(Long instrumentoId);
}
