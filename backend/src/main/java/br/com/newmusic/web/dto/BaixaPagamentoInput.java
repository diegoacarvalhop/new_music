package br.com.newmusic.web.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class BaixaPagamentoInput {

    private LocalDate dataPagamento;
    private String formaPagamento;
}
