package br.com.newmusic.service;

import br.com.newmusic.domain.Usuario;
import br.com.newmusic.repository.ProfessorRepository;
import br.com.newmusic.repository.UsuarioRepository;
import br.com.newmusic.security.JwtService;
import br.com.newmusic.security.UsuarioPrincipal;
import br.com.newmusic.web.dto.AuthResponse;
import br.com.newmusic.web.dto.LoginRequest;
import br.com.newmusic.web.dto.RefreshRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final ProfessorRepository professorRepository;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getSenha()));
        UsuarioPrincipal principal = (UsuarioPrincipal) authentication.getPrincipal();
        Usuario usuario = usuarioRepository.findByEmail(principal.getEmail()).orElseThrow();
        return buildAuthResponse(usuario);
    }

    public AuthResponse refresh(RefreshRequest request) {
        if (!jwtService.validateToken(request.getRefreshToken()) || !jwtService.isRefreshToken(request.getRefreshToken())) {
            throw new IllegalArgumentException("Refresh token inválido");
        }
        String email = jwtService.extractEmail(request.getRefreshToken());
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado"));
        if (!Boolean.TRUE.equals(usuario.getAtivo())) {
            throw new IllegalArgumentException("Usuário inativo");
        }
        return buildAuthResponse(usuario);
    }

    private AuthResponse buildAuthResponse(Usuario usuario) {
        String nome = usuario.getNome() != null ? usuario.getNome() : usuario.getEmail();
        Long professorId = professorRepository.findByUsuario_Id(usuario.getId()).map(p -> p.getId()).orElse(null);
        return AuthResponse.builder()
                .accessToken(jwtService.generateAccessToken(usuario))
                .refreshToken(jwtService.generateRefreshToken(usuario))
                .id(usuario.getId())
                .email(usuario.getEmail())
                .nome(nome)
                .perfil(usuario.getPerfil())
                .professorId(professorId)
                .build();
    }
}
