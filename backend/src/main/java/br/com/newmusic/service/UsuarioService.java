package br.com.newmusic.service;

import br.com.newmusic.domain.Perfil;
import br.com.newmusic.domain.Usuario;
import br.com.newmusic.repository.UsuarioRepository;
import br.com.newmusic.web.dto.UsuarioDTO;
import br.com.newmusic.web.dto.UsuarioInput;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<UsuarioDTO> listar(Pageable pageable, String busca) {
        if (busca == null || busca.isBlank()) {
            return usuarioRepository.findAll(pageable).map(this::toDTO);
        }
        String b = busca.trim();
        return usuarioRepository.findByEmailContainingIgnoreCaseOrNomeContainingIgnoreCase(b, b, pageable).map(this::toDTO);
    }

    @Transactional(readOnly = true)
    public UsuarioDTO buscarPorId(Long id) {
        Usuario usuario = usuarioRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado"));
        return toDTO(usuario);
    }

    @Transactional
    public UsuarioDTO criar(UsuarioInput input) {
        if (usuarioRepository.existsByEmail(input.getEmail())) {
            throw new IllegalArgumentException("Já existe usuário com este e-mail");
        }
        if (input.getSenha() == null || input.getSenha().isBlank()) {
            throw new IllegalArgumentException("Senha é obrigatória");
        }
        if (input.getPerfil() == Perfil.PROFESSOR) {
            throw new IllegalArgumentException("Perfil Professor é criado pelo cadastro de professores.");
        }
        Usuario usuario = Usuario.builder()
                .nome(input.getNome())
                .email(input.getEmail())
                .senha(passwordEncoder.encode(input.getSenha()))
                .perfil(input.getPerfil())
                .ativo(input.getAtivo() != null ? input.getAtivo() : true)
                .build();
        usuario = usuarioRepository.save(usuario);
        String conteudo = "Nome: " + usuario.getNome() + ", Email: " + usuario.getEmail() + ", Perfil: " + usuario.getPerfil() + ", Ativo: " + usuario.getAtivo();
        auditService.registrar("CRIAR", "usuarios", String.valueOf(usuario.getId()), "Criou o usuário " + usuario.getNome() + " (id " + usuario.getId() + ")", conteudo);
        return toDTO(usuario);
    }

    @Transactional
    public UsuarioDTO atualizar(Long id, UsuarioInput input) {
        Usuario usuario = usuarioRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado"));
        if (usuarioRepository.existsByEmailAndIdNot(input.getEmail(), id)) {
            throw new IllegalArgumentException("Já existe usuário com este e-mail");
        }
        if (input.getPerfil() == Perfil.PROFESSOR && usuario.getPerfil() != Perfil.PROFESSOR) {
            throw new IllegalArgumentException("Perfil Professor é criado pelo cadastro de professores.");
        }
        String nomeAntes = usuario.getNome(), emailAntes = usuario.getEmail();
        Perfil perfilAntes = usuario.getPerfil();
        Boolean ativoAntes = usuario.getAtivo();
        usuario.setNome(input.getNome());
        usuario.setEmail(input.getEmail());
        usuario.setPerfil(input.getPerfil());
        usuario.setAtivo(input.getAtivo() != null ? input.getAtivo() : true);
        if (input.getSenha() != null && !input.getSenha().isBlank()) {
            usuario.setSenha(passwordEncoder.encode(input.getSenha()));
        }
        usuario = usuarioRepository.save(usuario);
        StringBuilder sb = new StringBuilder();
        if (!Objects.equals(nomeAntes, input.getNome())) sb.append("Nome: ").append(nomeAntes).append(" -> ").append(input.getNome()).append("; ");
        if (!Objects.equals(emailAntes, input.getEmail())) sb.append("Email: ").append(emailAntes).append(" -> ").append(input.getEmail()).append("; ");
        if (!Objects.equals(perfilAntes, input.getPerfil())) sb.append("Perfil: ").append(perfilAntes).append(" -> ").append(input.getPerfil()).append("; ");
        if (!Objects.equals(ativoAntes, input.getAtivo())) sb.append("Ativo: ").append(ativoAntes).append(" -> ").append(input.getAtivo());
        if (input.getSenha() != null && !input.getSenha().isBlank()) sb.append(sb.length() > 0 ? "; " : "").append("Senha alterada");
        auditService.registrar("ATUALIZAR", "usuarios", String.valueOf(id), "Editou o usuário " + input.getNome() + " (id " + id + ")", sb.length() > 0 ? sb.toString() : null);
        return toDTO(usuario);
    }

    @Transactional
    public void excluir(Long id) {
        Usuario usuario = usuarioRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado"));
        if (usuario.getPerfil() == Perfil.ADMINISTRADOR && usuarioRepository.countByPerfil(Perfil.ADMINISTRADOR) <= 1) {
            throw new IllegalArgumentException("Não é possível excluir o único administrador");
        }
        if (usuario.getAluno() != null || usuario.getProfessor() != null) {
            throw new IllegalArgumentException("Usuário vinculado a aluno ou professor. Desvincule antes de excluir.");
        }
        String nomeUsu = usuario.getNome();
        String emailUsu = usuario.getEmail();
        Long idUsu = usuario.getId();
        usuarioRepository.delete(usuario);
        auditService.registrar("EXCLUIR", "usuarios", String.valueOf(idUsu), "Excluiu o usuário " + nomeUsu + " (id " + idUsu + ")", "Usuário: " + nomeUsu + ", Email: " + emailUsu);
    }

    private UsuarioDTO toDTO(Usuario u) {
        var builder = UsuarioDTO.builder()
                .id(u.getId())
                .email(u.getEmail())
                .nome(u.getNome())
                .perfil(u.getPerfil())
                .ativo(u.getAtivo());
        if (u.getPerfil() == Perfil.PROFESSOR && u.getProfessor() != null) {
            builder.professorCpf(u.getProfessor().getCpf())
                    .professorTelefone(u.getProfessor().getTelefone());
        }
        return builder.build();
    }
}
