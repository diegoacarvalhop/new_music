package br.com.newmusic.domain;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "professor")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Professor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nome;

    @Column(nullable = false, unique = true)
    private String email;

    private String telefone;
    private String cpf;
    private String instrumentos;
    private String disponibilidade;

    @Column(nullable = false)
    @Builder.Default
    private Boolean ativo = true;

    @OneToOne
    @JoinColumn(name = "usuario_id", unique = true)
    private Usuario usuario;

    @OneToMany(mappedBy = "professor", cascade = CascadeType.ALL)
    @Builder.Default
    private List<Turma> turmas = new ArrayList<>();
}
