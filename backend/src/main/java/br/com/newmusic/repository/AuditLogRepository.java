package br.com.newmusic.repository;

import br.com.newmusic.domain.AuditLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    @Query(value = "SELECT a.* FROM audit_log a WHERE " +
            "(CAST(?1 AS BIGINT) IS NULL OR a.usuario_id = ?1) AND " +
            "(CAST(?2 AS VARCHAR) IS NULL OR CAST(?2 AS VARCHAR) = '' OR a.tabela LIKE CAST(?2 AS VARCHAR) || '%') AND " +
            "(CAST(?3 AS VARCHAR) IS NULL OR CAST(?3 AS VARCHAR) = '' OR a.acao = ?3) AND " +
            "(CAST(?4 AS TIMESTAMP) IS NULL OR a.data_hora >= ?4) AND " +
            "(CAST(?5 AS TIMESTAMP) IS NULL OR a.data_hora <= ?5) ORDER BY a.id ASC",
            countQuery = "SELECT COUNT(*) FROM audit_log a WHERE " +
            "(CAST(?1 AS BIGINT) IS NULL OR a.usuario_id = ?1) AND " +
            "(CAST(?2 AS VARCHAR) IS NULL OR CAST(?2 AS VARCHAR) = '' OR a.tabela LIKE CAST(?2 AS VARCHAR) || '%') AND " +
            "(CAST(?3 AS VARCHAR) IS NULL OR CAST(?3 AS VARCHAR) = '' OR a.acao = ?3) AND " +
            "(CAST(?4 AS TIMESTAMP) IS NULL OR a.data_hora >= ?4) AND " +
            "(CAST(?5 AS TIMESTAMP) IS NULL OR a.data_hora <= ?5)",
            nativeQuery = true)
    List<AuditLog> findWithFilters(Long usuarioId, String tabela, String acao, LocalDateTime dataInicio,
                                   LocalDateTime dataFim, Pageable pageable);
}
