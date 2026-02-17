package br.com.newmusic.domain;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "mensalidade")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Mensalidade {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "matricula_id")
    private Matricula matricula;

    @Column(nullable = false)
    private Integer ano;

    @Column(nullable = false)
    private Integer mes;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal valor;

    @Column(name = "valor_multa", precision = 10, scale = 2)
    private BigDecimal valorMulta;

    @Column(name = "valor_juros", precision = 10, scale = 2)
    private BigDecimal valorJuros;

    @Column(nullable = false)
    private LocalDate vencimento;

    @Column(name = "data_pagamento")
    private LocalDate dataPagamento;

    private String formaPagamento;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StatusMensalidade status = StatusMensalidade.PENDENTE;

    @Column(nullable = true)
    @Builder.Default
    private Boolean rematricula = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "aluno_id", nullable = false)
    private Aluno aluno;
}
