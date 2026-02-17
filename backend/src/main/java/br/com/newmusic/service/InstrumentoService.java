package br.com.newmusic.service;

import br.com.newmusic.domain.Grupo;
import br.com.newmusic.domain.Instrumento;
import br.com.newmusic.repository.GrupoRepository;
import br.com.newmusic.repository.InstrumentoRepository;
import br.com.newmusic.repository.TurmaRepository;
import br.com.newmusic.util.StringUtil;
import br.com.newmusic.web.dto.InstrumentoDTO;
import br.com.newmusic.web.dto.InstrumentoInput;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InstrumentoService {

    private final InstrumentoRepository instrumentoRepository;
    private final GrupoRepository grupoRepository;
    private final TurmaRepository turmaRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<InstrumentoDTO> listarPaginado(Pageable pageable, Long grupoId) {
        if (grupoId != null) {
            return instrumentoRepository.findByGrupoIdOrderByNomeAsc(grupoId, pageable).map(this::toDTO);
        }
        return instrumentoRepository.findAll(pageable).map(this::toDTO);
    }

    @Transactional(readOnly = true)
    public List<InstrumentoDTO> listar(Long grupoId) {
        List<Instrumento> lista = grupoId != null
                ? instrumentoRepository.findByGrupoIdOrderByNomeAsc(grupoId)
                : instrumentoRepository.findAllByOrderByNomeAsc();
        return lista.stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<InstrumentoDTO> listarAtivos(Long grupoId) {
        List<Instrumento> lista = grupoId != null
                ? instrumentoRepository.findByAtivoTrueAndGrupoIdOrderByNomeAsc(grupoId)
                : instrumentoRepository.findByAtivoTrueOrderByNomeAsc();
        return lista.stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public InstrumentoDTO buscarPorId(Long id) {
        Instrumento instrumento = instrumentoRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Instrumento não encontrado"));
        return toDTO(instrumento);
    }

    @Transactional
    public InstrumentoDTO criar(InstrumentoInput input) {
        String nomeTrim = input.getNome() != null ? input.getNome().trim() : null;
        if (nomeTrim != null && !nomeTrim.isEmpty()) {
            instrumentoRepository.findFirstByNomeIgnoreCase(nomeTrim).ifPresent(ex -> {
                String grupoNome = ex.getGrupo() != null ? ex.getGrupo().getNome() : "outro";
                throw new IllegalArgumentException("Já existe um instrumento chamado \"" + nomeTrim + "\" no grupo " + grupoNome + ".");
            });
        }
        Grupo grupo = grupoRepository.findById(input.getGrupoId())
                .orElseThrow(() -> new IllegalArgumentException("Grupo não encontrado"));
        Instrumento instrumento = Instrumento.builder()
                .nome(input.getNome())
                .descricao(input.getDescricao())
                .grupo(grupo)
                .ativo(input.getAtivo() != null ? input.getAtivo() : true)
                .build();
        instrumento = instrumentoRepository.save(instrumento);
        String conteudo = "Nome: " + instrumento.getNome() + ", Grupo: " + instrumento.getGrupo().getNome() + ", Ativo: " + StringUtil.nvl(instrumento.getAtivo());
        auditService.registrar("CRIAR", "instrumentos", String.valueOf(instrumento.getId()), "Criou o instrumento " + instrumento.getNome() + " (id " + instrumento.getId() + ")", conteudo);
        return toDTO(instrumento);
    }

    @Transactional
    public InstrumentoDTO atualizar(Long id, InstrumentoInput input) {
        Instrumento instrumento = instrumentoRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Instrumento não encontrado"));
        String nomeTrim = input.getNome() != null ? input.getNome().trim() : null;
        if (nomeTrim != null && !nomeTrim.isEmpty()) {
            instrumentoRepository.findFirstByNomeIgnoreCaseAndIdNot(nomeTrim, id).ifPresent(ex -> {
                String grupoNome = ex.getGrupo() != null ? ex.getGrupo().getNome() : "outro";
                throw new IllegalArgumentException("Já existe um instrumento chamado \"" + nomeTrim + "\" no grupo " + grupoNome + ".");
            });
        }
        Grupo grupo = grupoRepository.findById(input.getGrupoId())
                .orElseThrow(() -> new IllegalArgumentException("Grupo não encontrado"));
        if (Boolean.FALSE.equals(input.getAtivo()) && turmaRepository.existsByInstrumentoId(id)) {
            throw new IllegalArgumentException("Instrumento não pode ser inativado pois está associado a turma(s).");
        }
        String nomeAntes = instrumento.getNome(), descAntes = instrumento.getDescricao();
        String grupoAntes = instrumento.getGrupo() != null ? instrumento.getGrupo().getNome() : null;
        Boolean ativoAntes = instrumento.getAtivo();
        instrumento.setNome(input.getNome());
        instrumento.setDescricao(input.getDescricao());
        instrumento.setGrupo(grupo);
        if (input.getAtivo() != null) {
            instrumento.setAtivo(input.getAtivo());
        }
        instrumento = instrumentoRepository.save(instrumento);
        StringBuilder sb = new StringBuilder();
        if (!java.util.Objects.equals(nomeAntes, input.getNome())) sb.append("Nome: ").append(StringUtil.nvl(nomeAntes)).append(" -> ").append(StringUtil.nvl(input.getNome())).append("; ");
        if (!java.util.Objects.equals(descAntes, input.getDescricao())) sb.append("Descrição: ").append(StringUtil.nvl(descAntes)).append(" -> ").append(StringUtil.nvl(input.getDescricao())).append("; ");
        if (!java.util.Objects.equals(grupoAntes, grupo.getNome())) sb.append("Grupo: ").append(StringUtil.nvl(grupoAntes)).append(" -> ").append(grupo.getNome()).append("; ");
        if (!java.util.Objects.equals(ativoAntes, input.getAtivo())) sb.append("Ativo: ").append(ativoAntes).append(" -> ").append(input.getAtivo());
        auditService.registrar("ATUALIZAR", "instrumentos", String.valueOf(id), "Editou o instrumento " + input.getNome() + " (id " + id + ")", sb.length() > 0 ? sb.toString() : null);
        return toDTO(instrumento);
    }

    @Transactional
    public void excluir(Long id) {
        Instrumento instrumento = instrumentoRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Instrumento não encontrado"));
        if (turmaRepository.existsByInstrumentoId(id)) {
            throw new IllegalArgumentException("Instrumento não pode ser excluído pois está associado a turma(s).");
        }
        String nomeInst = instrumento.getNome();
        Long idInst = instrumento.getId();
        instrumentoRepository.delete(instrumento);
        auditService.registrar("EXCLUIR", "instrumentos", String.valueOf(idInst), "Excluiu o instrumento " + nomeInst + " (id " + idInst + ")", "Instrumento: " + nomeInst);
    }

    private InstrumentoDTO toDTO(Instrumento instrumento) {
        Grupo grupo = instrumento.getGrupo();
        return InstrumentoDTO.builder()
                .id(instrumento.getId())
                .nome(instrumento.getNome())
                .descricao(instrumento.getDescricao())
                .grupoId(grupo != null ? grupo.getId() : null)
                .grupoNome(grupo != null ? grupo.getNome() : null)
                .ativo(instrumento.getAtivo())
                .build();
    }
}
