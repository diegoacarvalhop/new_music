package br.com.newmusic.service;

import br.com.newmusic.domain.TokenRedefinicaoSenha;
import br.com.newmusic.domain.Usuario;
import br.com.newmusic.repository.TokenRedefinicaoSenhaRepository;
import br.com.newmusic.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RedefinicaoSenhaService {

    private static final int EXPIRACAO_HORAS = 1;

    private final UsuarioRepository usuarioRepository;
    private final TokenRedefinicaoSenhaRepository tokenRepository;
    private final EmailService emailService;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @Value("${newmusic.redefinicao-senha.link-base:http://localhost:5173}")
    private String linkBase;

    @Transactional
    public void solicitarRedefinicaoSenha(String email) {
        usuarioRepository.findByEmail(email.trim()).ifPresent(usuario -> {
            tokenRepository.deleteByUsuario_Id(usuario.getId());
            String token = UUID.randomUUID().toString().replace("-", "");
            TokenRedefinicaoSenha entidade = TokenRedefinicaoSenha.builder()
                    .token(token)
                    .usuario(usuario)
                    .expiraEm(Instant.now().plusSeconds(EXPIRACAO_HORAS * 3600L))
                    .build();
            tokenRepository.save(entidade);
            String link = linkBase.replaceAll("/$", "") + "/redefinir-senha?token=" + token;
            emailService.enviarEmailRedefinicaoSenha(usuario.getEmail(), link);
        });
    }

    @Transactional
    public void redefinirSenha(String token, String novaSenha) {
        TokenRedefinicaoSenha t = tokenRepository.findByToken(token.trim())
                .orElseThrow(() -> new IllegalArgumentException("Token inválido ou expirado."));
        if (t.isExpirado()) {
            tokenRepository.delete(t);
            throw new IllegalArgumentException("Token inválido ou expirado.");
        }
        Usuario usuario = t.getUsuario();
        usuario.setSenha(passwordEncoder.encode(novaSenha));
        usuarioRepository.save(usuario);
        tokenRepository.delete(t);
    }
}
