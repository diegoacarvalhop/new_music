package br.com.newmusic.service;

import br.com.newmusic.domain.Aluno;
import br.com.newmusic.domain.StatusMensalidade;
import br.com.newmusic.util.CpfValidator;
import br.com.newmusic.util.StringUtil;
import br.com.newmusic.domain.Usuario;
import br.com.newmusic.repository.AlunoRepository;
import br.com.newmusic.repository.MatriculaRepository;
import br.com.newmusic.repository.MensalidadeRepository;
import br.com.newmusic.repository.UsuarioRepository;
import br.com.newmusic.web.dto.AlunoDTO;
import br.com.newmusic.web.dto.AlunoInput;
import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AlunoService {

    private final AlunoRepository alunoRepository;
    private final UsuarioRepository usuarioRepository;
    private final MatriculaRepository matriculaRepository;
    private final MensalidadeRepository mensalidadeRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<AlunoDTO> listar(Pageable pageable, String busca) {
        if (busca == null || busca.isBlank()) {
            return alunoRepository.findAll(pageable).map(this::toDTO);
        }
        return alunoRepository.findByNomeContainingIgnoreCaseOrCpfContaining(busca.trim(), busca.trim(), pageable).map(this::toDTO);
    }

    @Transactional(readOnly = true)
    public AlunoDTO buscarPorId(Long id) {
        Aluno aluno = alunoRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Aluno não encontrado"));
        return toDTO(aluno);
    }

    @Transactional
    public AlunoDTO criar(AlunoInput input) {
        if (alunoRepository.existsByEmail(input.getEmail()) || usuarioRepository.existsByEmail(input.getEmail())) {
            throw new IllegalArgumentException("Já existe aluno com este e-mail");
        }
        if (input.getCpf() != null && !input.getCpf().isBlank() && !CpfValidator.isValid(input.getCpf())) {
            throw new IllegalArgumentException("CPF inválido");
        }
        if (input.getResponsavelCpf() != null && !input.getResponsavelCpf().isBlank() && !CpfValidator.isValid(input.getResponsavelCpf())) {
            throw new IllegalArgumentException("CPF do responsável inválido");
        }
        validarNomeECpfUnicos(null, input.getNome(), input.getCpf());
        Aluno aluno = toEntity(input);
        aluno = alunoRepository.save(aluno);
        String conteudo = "Nome: " + aluno.getNome() + ", Email: " + aluno.getEmail() + ", Telefone: " + StringUtil.nvl(aluno.getTelefone()) + ", CPF: " + StringUtil.nvl(aluno.getCpf()) + ", Data nascimento: " + StringUtil.nvl(aluno.getDataNascimento()) + ", Ativo: " + aluno.getAtivo();
        auditService.registrar("CRIAR", "alunos", String.valueOf(aluno.getId()), "Criou o aluno " + aluno.getNome() + " (id " + aluno.getId() + ")", conteudo);
        return toDTO(aluno);
    }

    @Transactional
    public AlunoDTO atualizar(Long id, AlunoInput input) {
        Aluno aluno = alunoRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Aluno não encontrado"));
        if (alunoRepository.existsByEmailAndIdNot(input.getEmail(), id)) {
            throw new IllegalArgumentException("Já existe aluno com este e-mail");
        }
        if (aluno.getUsuario() != null && usuarioRepository.existsByEmailAndIdNot(input.getEmail(), aluno.getUsuario().getId())) {
            throw new IllegalArgumentException("Já existe aluno com este e-mail");
        }
        if (input.getCpf() != null && !input.getCpf().isBlank() && !CpfValidator.isValid(input.getCpf())) {
            throw new IllegalArgumentException("CPF inválido");
        }
        if (input.getResponsavelCpf() != null && !input.getResponsavelCpf().isBlank() && !CpfValidator.isValid(input.getResponsavelCpf())) {
            throw new IllegalArgumentException("CPF do responsável inválido");
        }
        validarNomeECpfUnicos(id, input.getNome(), input.getCpf());
        String nomeAntes = aluno.getNome(), emailAntes = aluno.getEmail(), telAntes = aluno.getTelefone(), cpfAntes = aluno.getCpf();
        String respNomeAntes = aluno.getResponsavelNome(), respCpfAntes = aluno.getResponsavelCpf(), endAntes = aluno.getEndereco(), obsAntes = aluno.getObservacoes();
        Boolean ativoAntes = aluno.getAtivo();
        aluno.setNome(input.getNome());
        aluno.setEmail(input.getEmail());
        aluno.setTelefone(input.getTelefone());
        aluno.setCpf(input.getCpf());
        aluno.setDataNascimento(input.getDataNascimento());
        aluno.setResponsavelNome(input.getResponsavelNome());
        aluno.setResponsavelCpf(input.getResponsavelCpf());
        aluno.setEndereco(input.getEndereco());
        aluno.setObservacoes(input.getObservacoes());
        aluno.setAtivo(input.getAtivo() != null ? input.getAtivo() : true);
        aluno = alunoRepository.save(aluno);
        StringBuilder sb = new StringBuilder();
        StringUtil.diff(sb, "Nome", nomeAntes, input.getNome());
        StringUtil.diff(sb, "Email", emailAntes, input.getEmail());
        StringUtil.diff(sb, "Telefone", telAntes, input.getTelefone());
        StringUtil.diff(sb, "CPF", cpfAntes, input.getCpf());
        StringUtil.diff(sb, "Responsável", respNomeAntes, input.getResponsavelNome());
        StringUtil.diff(sb, "CPF responsável", respCpfAntes, input.getResponsavelCpf());
        StringUtil.diff(sb, "Endereço", endAntes, input.getEndereco());
        StringUtil.diff(sb, "Observações", obsAntes, input.getObservacoes());
        StringUtil.diff(sb, "Ativo", ativoAntes, input.getAtivo() != null ? input.getAtivo() : true);
        auditService.registrar("ATUALIZAR", "alunos", String.valueOf(id), "Editou o aluno " + input.getNome() + " (id " + id + ")", sb.length() > 0 ? sb.toString() : null);
        return toDTO(aluno);
    }

    @Transactional
    public void excluir(Long id) {
        Aluno aluno = alunoRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Aluno não encontrado"));
        if (!matriculaRepository.findByAlunoId(id).isEmpty()) {
            throw new IllegalArgumentException("Aluno não pode ser excluído pois possui matrícula(s). Inative o aluno.");
        }
        if (mensalidadeRepository.existsByAlunoIdAndStatus(id, StatusMensalidade.PAGO)) {
            throw new IllegalArgumentException("Aluno não pode ser excluído pois possui mensalidade(s) paga(s). Inative o aluno.");
        }
        String nomeAluno = aluno.getNome();
        String emailAluno = aluno.getEmail();
        Long idAluno = aluno.getId();
        if (aluno.getUsuario() != null) {
            aluno.getUsuario().setAluno(null);
            usuarioRepository.save(aluno.getUsuario());
            aluno.setUsuario(null);
        }
        alunoRepository.delete(aluno);
        auditService.registrar("EXCLUIR", "alunos", String.valueOf(idAluno), "Excluiu o aluno " + nomeAluno + " (id " + idAluno + ")", "Aluno: " + nomeAluno + ", Email: " + emailAluno);
    }

    private void validarNomeECpfUnicos(Long idExcluir, String nome, String cpf) {
        if (nome == null || nome.isBlank()) return;
        String cpfNorm = CpfValidator.normalize(cpf);
        List<Aluno> comMesmoNome = alunoRepository.findByNomeTrimEqualsIgnoreCase(nome);
        for (Aluno a : comMesmoNome) {
            if (idExcluir != null && a.getId().equals(idExcluir)) continue;
            String cpfExistente = CpfValidator.normalize(a.getCpf());
            if (cpfNorm.equals(cpfExistente)) {
                throw new IllegalArgumentException("Já existe um aluno com o mesmo nome e CPF.");
            }
        }
    }

    private Aluno toEntity(AlunoInput input) {
        return Aluno.builder()
                .nome(input.getNome())
                .email(input.getEmail())
                .telefone(input.getTelefone())
                .cpf(input.getCpf())
                .dataNascimento(input.getDataNascimento())
                .responsavelNome(input.getResponsavelNome())
                .responsavelCpf(input.getResponsavelCpf())
                .endereco(input.getEndereco())
                .observacoes(input.getObservacoes())
                .ativo(input.getAtivo() != null ? input.getAtivo() : true)
                .build();
    }

    private AlunoDTO toDTO(Aluno aluno) {
        return AlunoDTO.builder()
                .id(aluno.getId())
                .nome(aluno.getNome())
                .email(aluno.getEmail())
                .telefone(aluno.getTelefone())
                .cpf(aluno.getCpf())
                .dataNascimento(aluno.getDataNascimento())
                .responsavelNome(aluno.getResponsavelNome())
                .responsavelCpf(aluno.getResponsavelCpf())
                .endereco(aluno.getEndereco())
                .observacoes(aluno.getObservacoes())
                .ativo(aluno.getAtivo())
                .usuarioId(aluno.getUsuario() != null ? aluno.getUsuario().getId() : null)
                .build();
    }
}
