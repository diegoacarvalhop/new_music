package br.com.newmusic.repository;

import br.com.newmusic.domain.ErrorLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface ErrorLogRepository extends JpaRepository<ErrorLog, Long> {

    List<ErrorLog> findAllByOrderByIdAsc(Pageable pageable);

    List<ErrorLog> findByDataHoraBetweenOrderByIdAsc(LocalDateTime dataInicio, LocalDateTime dataFim, Pageable pageable);
}
