package br.com.newmusic.web;

import br.com.newmusic.service.AuthService;
import br.com.newmusic.service.RedefinicaoSenhaService;
import br.com.newmusic.web.dto.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "Autenticação", description = "Login, refresh de token e redefinição de senha")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final RedefinicaoSenhaService redefinicaoSenhaService;

    @Operation(summary = "Login", description = "Autentica com e-mail e senha, retorna access e refresh token")
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @Operation(summary = "Refresh token", description = "Renova o access token usando o refresh token")
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshRequest request) {
        return ResponseEntity.ok(authService.refresh(request));
    }

    @Operation(summary = "Esqueci a senha", description = "Envia e-mail com link para redefinir a senha (se o e-mail existir)")
    @PostMapping("/esqueci-senha")
    public ResponseEntity<Map<String, String>> esqueciSenha(@Valid @RequestBody EsqueciSenhaRequest request) {
        redefinicaoSenhaService.solicitarRedefinicaoSenha(request.getEmail());
        return ResponseEntity.ok(Map.of("mensagem", "Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha."));
    }

    @Operation(summary = "Redefinir senha", description = "Altera a senha usando o token recebido por e-mail")
    @PostMapping("/redefinir-senha")
    public ResponseEntity<Map<String, String>> redefinirSenha(@Valid @RequestBody RedefinirSenhaRequest request) {
        redefinicaoSenhaService.redefinirSenha(request.getToken(), request.getNovaSenha());
        return ResponseEntity.ok(Map.of("mensagem", "Senha alterada com sucesso. Faça login com a nova senha."));
    }
}
