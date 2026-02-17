package br.com.newmusic.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "error_log")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ErrorLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "data_hora", nullable = false)
    private LocalDateTime dataHora;

    @Column(name = "usuario_id")
    private Long usuarioId;

    @Column(name = "usuario_email")
    private String usuarioEmail;

    @Column(nullable = false, length = 500)
    private String acao;

    @Column(name = "mensagem_erro", nullable = false, length = 2000)
    private String mensagemErro;

    @Column(name = "tipo_excecao", nullable = false, length = 500)
    private String tipoExcecao;

    @Column(name = "stack_trace", length = 8000)
    private String stackTrace;

    @Column(name = "contexto", length = 1000)
    private String contexto;
}
