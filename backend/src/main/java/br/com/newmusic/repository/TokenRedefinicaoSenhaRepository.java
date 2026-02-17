package br.com.newmusic.repository;

import br.com.newmusic.domain.TokenRedefinicaoSenha;

import java.util.Optional;

public interface TokenRedefinicaoSenhaRepository extends org.springframework.data.jpa.repository.JpaRepository<TokenRedefinicaoSenha, Long> {

    Optional<TokenRedefinicaoSenha> findByToken(String token);

    void deleteByUsuario_Id(Long usuarioId);
}
