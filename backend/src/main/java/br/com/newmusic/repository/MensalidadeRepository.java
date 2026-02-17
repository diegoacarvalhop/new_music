package br.com.newmusic.repository;

import br.com.newmusic.domain.Mensalidade;
import br.com.newmusic.domain.StatusMensalidade;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface MensalidadeRepository extends JpaRepository<Mensalidade, Long> {

    List<Mensalidade> findByAlunoIdOrderByAnoDescMesDesc(Long alunoId);

    List<Mensalidade> findByAlunoIdAndMatricula_AtivoTrueOrderByAnoDescMesDesc(Long alunoId);

    Page<Mensalidade> findByAlunoIdOrderByAnoDescMesDesc(Long alunoId, Pageable pageable);

    Page<Mensalidade> findByAlunoIdOrderByAnoAscMesAsc(Long alunoId, Pageable pageable);

    Page<Mensalidade> findByAlunoIdAndMatricula_AtivoTrueOrderByAnoAscMesAsc(Long alunoId, Pageable pageable);

    @Query(value = "SELECT m.aluno.id, m.aluno.nome, COUNT(m) FROM Mensalidade m WHERE (:busca IS NULL OR :busca = '' OR LOWER(m.aluno.nome) LIKE LOWER(CONCAT('%', :busca, '%')) OR m.aluno.cpf LIKE CONCAT('%', :busca, '%')) GROUP BY m.aluno.id, m.aluno.nome ORDER BY m.aluno.nome",
            countQuery = "SELECT COUNT(DISTINCT m.aluno.id) FROM Mensalidade m WHERE (:busca IS NULL OR :busca = '' OR LOWER(m.aluno.nome) LIKE LOWER(CONCAT('%', :busca, '%')) OR m.aluno.cpf LIKE CONCAT('%', :busca, '%'))")
    Page<Object[]> findDistinctAlunoIdNomeECount(Pageable pageable, @Param("busca") String busca);

    @Query(value = "SELECT m.matricula.id, m.aluno.id, m.aluno.nome, COUNT(m) " +
            "FROM Mensalidade m " +
            "WHERE m.matricula IS NOT NULL AND m.matricula.ativo = true " +
            "AND (:busca IS NULL OR :busca = '' OR LOWER(m.aluno.nome) LIKE LOWER(CONCAT('%', :busca, '%')) OR m.aluno.cpf LIKE CONCAT('%', :busca, '%')) " +
            "GROUP BY m.matricula.id, m.aluno.id, m.aluno.nome ORDER BY m.aluno.nome, m.matricula.id",
            countQuery = "SELECT COUNT(DISTINCT m.matricula.id) FROM Mensalidade m WHERE m.matricula IS NOT NULL AND m.matricula.ativo = true " +
            "AND (:busca IS NULL OR :busca = '' OR LOWER(m.aluno.nome) LIKE LOWER(CONCAT('%', :busca, '%')) OR m.aluno.cpf LIKE CONCAT('%', :busca, '%'))")
    Page<Object[]> findDistinctMatriculaAlunoIdNomeECount(Pageable pageable, @Param("busca") String busca);

    List<Mensalidade> findByAnoAndMesOrderByAluno_NomeAsc(Integer ano, Integer mes);

    List<Mensalidade> findByAnoOrderByAluno_NomeAscMesAsc(Integer ano);

    List<Mensalidade> findByStatusOrderByAluno_NomeAsc(StatusMensalidade status);

    List<Mensalidade> findByStatusAndAnoAndMesOrderByAluno_NomeAsc(StatusMensalidade status, Integer ano, Integer mes);

    List<Mensalidade> findByStatusAndAnoOrderByAluno_NomeAsc(StatusMensalidade status, Integer ano);

    Optional<Mensalidade> findByAlunoIdAndAnoAndMes(Long alunoId, Integer ano, Integer mes);

    Optional<Mensalidade> findByAlunoIdAndMatricula_AtivoTrueAndAnoAndMes(Long alunoId, Integer ano, Integer mes);

    boolean existsByMatriculaIdAndStatus(Long matriculaId, StatusMensalidade status);

    @Query("SELECT COUNT(m) FROM Mensalidade m WHERE m.aluno.id = :alunoId AND m.matricula IS NULL AND (m.ano * 100 + m.mes) >= :startYm AND (m.ano * 100 + m.mes) <= :endYm AND m.status = :status")
    long countByAlunoIdAndMatriculaNullAndPeriodoAndStatus(@Param("alunoId") Long alunoId, @Param("startYm") int startYm, @Param("endYm") int endYm, @Param("status") StatusMensalidade status);

    @Modifying
    @Query("DELETE FROM Mensalidade m WHERE m.matricula.id = :matriculaId")
    void deleteByMatriculaId(@Param("matriculaId") Long matriculaId);

    @Modifying
    @Query("DELETE FROM Mensalidade m WHERE m.aluno.id = :alunoId AND m.matricula IS NULL AND (m.ano * 100 + m.mes) >= :startYm AND (m.ano * 100 + m.mes) <= :endYm")
    void deleteByAlunoIdAndMatriculaNullAndPeriodo(@Param("alunoId") Long alunoId, @Param("startYm") int startYm, @Param("endYm") int endYm);

    Page<Mensalidade> findByMatriculaIdOrderByAnoAscMesAsc(Long matriculaId, Pageable pageable);

    boolean existsByAlunoIdAndStatus(Long alunoId, StatusMensalidade status);

    List<Mensalidade> findByAlunoIdAndStatus(Long alunoId, StatusMensalidade status);

    Page<Mensalidade> findByAlunoNomeContainingIgnoreCaseOrAlunoCpfContainingOrderByAlunoNomeAscAnoAscMesAsc(String nome, String cpf, Pageable pageable);

    long countByStatusIn(List<StatusMensalidade> statuses);

    @Query("SELECT COUNT(DISTINCT m.aluno.id) FROM Mensalidade m")
    long countDistinctAluno();

    @Query("SELECT COUNT(DISTINCT m.aluno.id) FROM Mensalidade m WHERE LOWER(m.aluno.nome) LIKE LOWER(CONCAT('%', :busca, '%')) OR m.aluno.cpf LIKE CONCAT('%', :busca, '%')")
    long countDistinctAlunoByBusca(@Param("busca") String busca);

    @Query("SELECT COUNT(DISTINCT m.aluno.id) FROM Mensalidade m WHERE m.status = :status")
    long countDistinctAlunoByStatus(@Param("status") StatusMensalidade status);

    @Query("SELECT COUNT(DISTINCT m.aluno.id) FROM Mensalidade m WHERE m.status = :status AND m.ano = :ano AND m.mes = :mes")
    long countDistinctAlunoByStatusAndAnoAndMes(@Param("status") StatusMensalidade status, @Param("ano") Integer ano, @Param("mes") Integer mes);

    @Query("SELECT COUNT(DISTINCT m.aluno.id) FROM Mensalidade m WHERE m.status = :status AND m.ano = :ano")
    long countDistinctAlunoByStatusAndAno(@Param("status") StatusMensalidade status, @Param("ano") Integer ano);

    List<Mensalidade> findByStatusAndVencimentoBefore(StatusMensalidade status, LocalDate vencimento);
}
