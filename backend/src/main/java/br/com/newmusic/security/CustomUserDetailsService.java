package br.com.newmusic.security;

import br.com.newmusic.domain.Usuario;
import br.com.newmusic.repository.ProfessorRepository;
import br.com.newmusic.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;
    private final ProfessorRepository professorRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado: " + email));
        if (!Boolean.TRUE.equals(usuario.getAtivo())) {
            throw new UsernameNotFoundException("Usuário inativo: " + email);
        }
        Long professorId = professorRepository.findByUsuario_Id(usuario.getId())
                .map(p -> p.getId())
                .orElse(null);
        return new UsuarioPrincipal(usuario, professorId);
    }
}
