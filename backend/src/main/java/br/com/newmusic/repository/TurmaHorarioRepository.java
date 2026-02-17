package br.com.newmusic.repository;

import br.com.newmusic.domain.TurmaHorario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TurmaHorarioRepository extends JpaRepository<TurmaHorario, Long> {

    List<TurmaHorario> findByTurmaIdOrderByDiaSemanaAscHorarioInicioAsc(Long turmaId);

    @Modifying
    @Query("DELETE FROM TurmaHorario h WHERE h.turma.id = :turmaId")
    void deleteByTurmaId(@Param("turmaId") Long turmaId);
}
