package br.com.newmusic.repository;

import br.com.newmusic.domain.Perfil;
import br.com.newmusic.domain.Usuario;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    long countByPerfil(Perfil perfil);

    Optional<Usuario> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByEmailAndIdNot(String email, Long id);

    Page<Usuario> findByEmailContainingIgnoreCaseOrNomeContainingIgnoreCase(String email, String nome, Pageable pageable);
}
