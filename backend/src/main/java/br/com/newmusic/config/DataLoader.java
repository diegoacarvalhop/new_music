package br.com.newmusic.config;

import br.com.newmusic.domain.Perfil;
import br.com.newmusic.domain.Usuario;
import br.com.newmusic.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataLoader implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (usuarioRepository.findByEmail("admin@newmusic.com").isEmpty()) {
            Usuario admin = Usuario.builder()
                    .email("admin@newmusic.com")
                    .nome("Administrador")
                    .senha(passwordEncoder.encode("admin123"))
                    .perfil(Perfil.ADMINISTRADOR)
                    .ativo(true)
                    .build();
            usuarioRepository.save(admin);
        }
    }
}
