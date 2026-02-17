package br.com.newmusic.service;

import br.com.newmusic.domain.Perfil;
import br.com.newmusic.domain.Professor;
import br.com.newmusic.domain.Turma;
import br.com.newmusic.domain.TurmaHorario;
import br.com.newmusic.util.CpfValidator;
import br.com.newmusic.util.StringUtil;
import br.com.newmusic.domain.Usuario;
import br.com.newmusic.repository.PresencaProfessorRepository;
import br.com.newmusic.repository.PresencaRepository;
import br.com.newmusic.repository.ProfessorRepository;
import br.com.newmusic.repository.TurmaRepository;
import br.com.newmusic.repository.UsuarioRepository;
import br.com.newmusic.repository.MatriculaRepository;
import br.com.newmusic.web.dto.ProfessorDTO;
import br.com.newmusic.web.dto.ProfessorInput;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProfessorService {

    private static final String[] DIAS_NOME = { "", "Segunda", "Terça", "Quarta", "Quinta", "Sexta" };

    private final ProfessorRepository professorRepository;
    private final UsuarioRepository usuarioRepository;
    private final TurmaRepository turmaRepository;
    private final MatriculaRepository matriculaRepository;
    private final PresencaProfessorRepository presencaProfessorRepository;
    private final PresencaRepository presencaRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<ProfessorDTO> listar(Pageable pageable, String busca) {
        if (busca == null || busca.isBlank()) {
            return professorRepository.findAll(pageable).map(this::toDTO);
        }
        String b = busca.trim();
        return professorRepository.findByNomeContainingIgnoreCaseOrCpfContainingOrInstrumentosContainingIgnoreCase(b, b, b, pageable).map(this::toDTO);
    }

    @Transactional(readOnly = true)
    public List<ProfessorDTO> listarAtivos() {
        return professorRepository.findByAtivoTrue().stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProfessorDTO buscarPorId(Long id) {
        Professor professor = professorRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Professor não encontrado"));
        return toDTO(professor);
    }

    @Transactional
    public ProfessorDTO criar(ProfessorInput input) {
        if (professorRepository.existsByEmail(input.getEmail()) || usuarioRepository.existsByEmail(input.getEmail())) {
            throw new IllegalArgumentException("Já existe professor com este e-mail");
        }
        if (input.getCpf() != null && !input.getCpf().isBlank() && !CpfValidator.isValid(input.getCpf())) {
            throw new IllegalArgumentException("CPF inválido");
        }
        validarNomeECpfUnicos(null, input.getNome(), input.getCpf());
        Professor professor = toEntity(input);
        if (input.getSenha() != null && !input.getSenha().isBlank()) {
            Usuario usuario = Usuario.builder()
                    .email(input.getEmail())
                    .senha(passwordEncoder.encode(input.getSenha()))
                    .nome(input.getNome())
                    .perfil(Perfil.PROFESSOR)
                    .ativo(true)
                    .build();
            usuario = usuarioRepository.save(usuario);
            professor.setUsuario(usuario);
        }
        professor = professorRepository.save(professor);
        if (professor.getUsuario() != null) {
            professor.getUsuario().setProfessor(professor);
            usuarioRepository.save(professor.getUsuario());
        }
        String conteudo = "Nome: " + professor.getNome() + ", Email: " + professor.getEmail() + ", Instrumentos: " + StringUtil.nvl(professor.getInstrumentos()) + ", Ativo: " + professor.getAtivo();
        auditService.registrar("CRIAR", "professores", String.valueOf(professor.getId()), "Criou o professor " + professor.getNome() + " (id " + professor.getId() + ")", conteudo);
        return toDTO(professor);
    }

    @Transactional
    public ProfessorDTO atualizar(Long id, ProfessorInput input) {
        Professor professor = professorRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Professor não encontrado"));
        if (professorRepository.existsByEmailAndIdNot(input.getEmail(), id)) {
            throw new IllegalArgumentException("Já existe professor com este e-mail");
        }
        if (professor.getUsuario() != null) {
            if (usuarioRepository.existsByEmailAndIdNot(input.getEmail(), professor.getUsuario().getId())) {
                throw new IllegalArgumentException("Já existe professor com este e-mail");
            }
        } else if (input.getSenha() != null && !input.getSenha().isBlank()) {
            if (usuarioRepository.existsByEmail(input.getEmail())) {
                throw new IllegalArgumentException("Já existe professor com este e-mail");
            }
        }
        if (input.getCpf() != null && !input.getCpf().isBlank() && !CpfValidator.isValid(input.getCpf())) {
            throw new IllegalArgumentException("CPF inválido");
        }
        validarNomeECpfUnicos(id, input.getNome(), input.getCpf());
        String nomeAntes = professor.getNome(), emailAntes = professor.getEmail(), telAntes = professor.getTelefone(), cpfAntes = professor.getCpf();
        String instAntes = professor.getInstrumentos(), dispAntes = professor.getDisponibilidade();
        Boolean ativoAntes = professor.getAtivo();
        if (Boolean.FALSE.equals(input.getAtivo())) {
            List<Turma> turmas = turmaRepository.findByProfessor_IdOrderById(id);
            for (Turma t : turmas) {
                if (matriculaRepository.countByTurmaIdAndAtivoTrue(t.getId()) > 0) {
                    throw new IllegalArgumentException("Professor não pode ser inativado pois possui turmas com alunos.");
                }
            }
            if (!presencaProfessorRepository.findByProfessorId(id).isEmpty()) {
                throw new IllegalArgumentException("Professor não pode ser inativado pois possui registro(s) de presença.");
            }
        }
        professor.setNome(input.getNome());
        professor.setEmail(input.getEmail());
        professor.setTelefone(input.getTelefone());
        professor.setCpf(input.getCpf());
        professor.setInstrumentos(input.getInstrumentos());
        validarDisponibilidadeIncluiTurmasDoProfessor(id, input.getDisponibilidade());
        professor.setDisponibilidade(input.getDisponibilidade());
        professor.setAtivo(input.getAtivo() != null ? input.getAtivo() : true);
        if (input.getSenha() != null && !input.getSenha().isBlank()) {
            if (professor.getUsuario() == null) {
                Usuario usuario = Usuario.builder()
                        .email(input.getEmail())
                        .senha(passwordEncoder.encode(input.getSenha()))
                        .nome(input.getNome())
                        .perfil(Perfil.PROFESSOR)
                        .ativo(true)
                        .build();
                usuario = usuarioRepository.save(usuario);
                professor.setUsuario(usuario);
                usuario.setProfessor(professor);
                usuarioRepository.save(usuario);
            } else {
                professor.getUsuario().setSenha(passwordEncoder.encode(input.getSenha()));
                professor.getUsuario().setNome(input.getNome());
                professor.getUsuario().setEmail(input.getEmail());
                usuarioRepository.save(professor.getUsuario());
            }
        }
        professor = professorRepository.save(professor);
        StringBuilder sb = new StringBuilder();
        StringUtil.diff(sb, "Nome", nomeAntes, input.getNome());
        StringUtil.diff(sb, "Email", emailAntes, input.getEmail());
        StringUtil.diff(sb, "Telefone", telAntes, input.getTelefone());
        StringUtil.diff(sb, "CPF", cpfAntes, input.getCpf());
        StringUtil.diff(sb, "Instrumentos", instAntes, input.getInstrumentos());
        StringUtil.diff(sb, "Disponibilidade", dispAntes, input.getDisponibilidade());
        StringUtil.diff(sb, "Ativo", ativoAntes, input.getAtivo() != null ? input.getAtivo() : true);
        if (input.getSenha() != null && !input.getSenha().isBlank()) sb.append(sb.length() > 0 ? "; " : "").append("Senha alterada");
        auditService.registrar("ATUALIZAR", "professores", String.valueOf(id), "Editou o professor " + input.getNome() + " (id " + id + ")", sb.length() > 0 ? sb.toString() : null);
        return toDTO(professor);
    }

    @Transactional
    public void excluir(Long id) {
        Professor professor = professorRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Professor não encontrado"));
        List<Turma> turmas = turmaRepository.findByProfessor_IdOrderById(id);
        for (Turma t : turmas) {
            if (matriculaRepository.countByTurmaIdAndAtivoTrue(t.getId()) > 0) {
                throw new IllegalArgumentException("Professor não pode ser excluído pois possui turmas com alunos. Inative o professor ou desvincule os alunos.");
            }
        }
        if (!presencaProfessorRepository.findByProfessorId(id).isEmpty()) {
            throw new IllegalArgumentException("Professor não pode ser excluído pois possui registro(s) de presença. Inative o professor.");
        }
        for (Turma t : turmas) {
            presencaRepository.findByTurmaId(t.getId()).forEach(presencaRepository::delete);
            turmaRepository.delete(t);
        }
        String nomeProf = professor.getNome();
        Long idProf = professor.getId();
        if (professor.getUsuario() != null) {
            professor.getUsuario().setProfessor(null);
            usuarioRepository.save(professor.getUsuario());
            professor.setUsuario(null);
        }
        professorRepository.delete(professor);
        auditService.registrar("EXCLUIR", "professores", String.valueOf(idProf), "Excluiu o professor " + nomeProf + " (id " + idProf + ")", "Professor: " + nomeProf);
    }

    private void validarNomeECpfUnicos(Long idExcluir, String nome, String cpf) {
        if (nome == null || nome.isBlank()) return;
        String cpfNorm = CpfValidator.normalize(cpf);
        List<Professor> comMesmoNome = professorRepository.findByNomeTrimEqualsIgnoreCase(nome);
        for (Professor p : comMesmoNome) {
            if (idExcluir != null && p.getId().equals(idExcluir)) continue;
            String cpfExistente = CpfValidator.normalize(p.getCpf());
            if (cpfNorm.equals(cpfExistente)) {
                throw new IllegalArgumentException("Já existe um professor com o mesmo nome e CPF.");
            }
        }
    }

    private void validarDisponibilidadeIncluiTurmasDoProfessor(Long professorId, String novaDisponibilidade) {
        List<Turma> turmas = turmaRepository.findByProfessorIdWithHorarios(professorId);
        if (turmas == null || turmas.isEmpty()) return;
        Set<String> slotsDisponibilidade = parseDisponibilidadeSlots(novaDisponibilidade);
        List<String> conflitos = new ArrayList<>();
        for (Turma t : turmas) {
            if (t.getHorarios() == null) continue;
            for (TurmaHorario h : t.getHorarios()) {
                String key = h.getDiaSemana() + "|" + formatLocalTime(h.getHorarioInicio());
                if (!slotsDisponibilidade.contains(key)) {
                    String diaNome = h.getDiaSemana() >= 1 && h.getDiaSemana() <= 5 ? DIAS_NOME[h.getDiaSemana()] : String.valueOf(h.getDiaSemana());
                    var fim = h.getHorarioFim() != null ? h.getHorarioFim() : h.getHorarioInicio().plusHours(1);
                    conflitos.add(diaNome + " das " + h.getHorarioInicio() + " às " + fim);
                }
            }
        }
        if (!conflitos.isEmpty()) {
            String lista = String.join(", ", conflitos);
            String msg = conflitos.size() == 1
                ? "O professor possui turma no seguinte dia e horário: " + lista + ". Inclua esse horário na disponibilidade."
                : "O professor possui turmas nos seguintes dias e horários: " + lista + ". Inclua esses horários na disponibilidade.";
            throw new IllegalArgumentException(msg);
        }
    }

    private Set<String> parseDisponibilidadeSlots(String disponibilidade) {
        Set<String> slots = new HashSet<>();
        if (disponibilidade == null || disponibilidade.isBlank()) return slots;
        for (String part : disponibilidade.split(",")) {
            String trim = part.trim();
            if (trim.isEmpty()) continue;
            String[] partes = trim.split("-");
            if (partes.length >= 2) {
                String dia = partes[0].trim();
                String horaInicio = partes[1].trim();
                if (horaInicio.length() > 5) horaInicio = horaInicio.substring(0, 5);
                slots.add(dia + "|" + horaInicio);
            }
        }
        return slots;
    }

    private static String formatLocalTime(java.time.LocalTime t) {
        return (t.getHour() < 10 ? "0" : "") + t.getHour() + ":" + (t.getMinute() < 10 ? "0" : "") + t.getMinute();
    }

    private Professor toEntity(ProfessorInput input) {
        return Professor.builder()
                .nome(input.getNome())
                .email(input.getEmail())
                .telefone(input.getTelefone())
                .cpf(input.getCpf())
                .instrumentos(input.getInstrumentos())
                .disponibilidade(input.getDisponibilidade())
                .ativo(input.getAtivo() != null ? input.getAtivo() : true)
                .build();
    }

    private ProfessorDTO toDTO(Professor professor) {
        return ProfessorDTO.builder()
                .id(professor.getId())
                .nome(professor.getNome())
                .email(professor.getEmail())
                .telefone(professor.getTelefone())
                .cpf(professor.getCpf())
                .instrumentos(professor.getInstrumentos())
                .disponibilidade(professor.getDisponibilidade())
                .ativo(professor.getAtivo())
                .usuarioId(professor.getUsuario() != null ? professor.getUsuario().getId() : null)
                .build();
    }
}
