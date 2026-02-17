package br.com.newmusic.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_log")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "usuario_id")
    private Long usuarioId;

    @Column(name = "usuario_email")
    private String usuarioEmail;

    @Column(nullable = false)
    private String acao;

    @Column(nullable = false)
    private String tabela;

    @Column(name = "tabela_id")
    private String tabelaId;

    @Column(name = "data_hora", nullable = false)
    private LocalDateTime dataHora;

    @Column(name = "descricao", length = 2000)
    private String descricao;

    @Column(name = "conteudo_alteracao", length = 4000)
    private String conteudoAlteracao;
}
