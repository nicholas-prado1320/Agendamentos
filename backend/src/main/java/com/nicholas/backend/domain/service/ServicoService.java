package com.nicholas.backend.domain.service;

import com.nicholas.backend.domain.entity.Servico;
import com.nicholas.backend.domain.repository.ServicoRepository;
import com.nicholas.backend.domain.repository.AgendamentoRepository;
import com.nicholas.backend.dto.request.ServicoRequest;
import com.nicholas.backend.dto.response.ServicoResponse;
import com.nicholas.backend.domain.entity.StatusAgendamento;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ServicoService {

    private static final int INTERVALO_GRADE_MINUTOS = 15;

    private final ServicoRepository servicoRepository;
    private final AgendamentoRepository agendamentoRepository;
    private final UsuarioAutenticadoService usuarioAutenticadoService;

    public List<ServicoResponse> listar() {
        if (usuarioAutenticadoService.isCliente()) {
            return servicoRepository.findByAtivoTrue()
                    .stream()
                    .map(this::toResponse)
                    .toList();
        }

        return servicoRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<ServicoResponse> listarAtivos() {
        return servicoRepository.findByAtivoTrue()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public ServicoResponse buscarPorId(Long id) {
        Servico servico = buscarEntidadePorId(id);

        return toResponse(servico);
    }

    @Transactional
    public ServicoResponse criar(ServicoRequest request) {
        validarManicure();
        validarDuracao(request.duracao());

        Servico servico = Servico.builder()
                .nome(request.nome())
                .descricao(request.descricao())
                .duracao(request.duracao())
                .preco(request.preco())
                .build();

        Servico servicoSalvo = servicoRepository.save(servico);

        return toResponse(servicoSalvo);
    }

    @Transactional
    public ServicoResponse atualizar(Long id, ServicoRequest request) {
        validarManicure();
        validarDuracao(request.duracao());

        Servico servico = buscarEntidadePorId(id);

        servico.setNome(request.nome());
        servico.setDescricao(request.descricao());
        servico.setDuracao(request.duracao());
        servico.setPreco(request.preco());

        Servico servicoAtualizado = servicoRepository.save(servico);

        return toResponse(servicoAtualizado);
    }

    @Transactional
    public ServicoResponse ativar(Long id) {
        validarManicure();

        Servico servico = buscarEntidadePorId(id);

        servico.setAtivo(true);

        return toResponse(servicoRepository.save(servico));
    }

    @Transactional
    public ServicoResponse inativar(Long id) {
        validarManicure();

        Servico servico = buscarEntidadePorId(id);

        validarServicoSemAgendamentosAtivos(id);

        servico.setAtivo(false);

        return toResponse(servicoRepository.save(servico));
    }

    @Transactional
    public void excluir(Long id) {
        validarManicure();

        Servico servico = buscarEntidadePorId(id);

        if (Boolean.TRUE.equals(servico.getAtivo())) {
            throw new RuntimeException("Para excluir um serviço, primeiro ele precisa estar inativo.");
        }

        validarServicoSemNenhumAgendamento(id);

        servicoRepository.delete(servico);
    }

    public Servico buscarEntidadePorId(Long id) {
        return servicoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Serviço não encontrado."));
    }

    private void validarManicure() {
        if (!usuarioAutenticadoService.isManicure()) {
            throw new RuntimeException("Você não tem permissão para realizar esta ação.");
        }
    }

    private void validarDuracao(String duracao) {
        int duracaoEmMinutos = converterDuracaoParaMinutos(duracao);

        if (duracaoEmMinutos <= 0) {
            throw new RuntimeException("A duração do serviço deve ser maior que zero.");
        }

        if (duracaoEmMinutos % INTERVALO_GRADE_MINUTOS != 0) {
            throw new RuntimeException("A duração do serviço deve ser múltipla de 15 minutos.");
        }
    }

    private void validarServicoSemAgendamentosAtivos(Long servicoId) {
        boolean possuiAgendamentosAtivos = agendamentoRepository.existsByServicoIdAndStatusIn(
                servicoId,
                List.of(
                        StatusAgendamento.AGENDADO,
                        StatusAgendamento.EM_ATENDIMENTO
                )
        );

        if (possuiAgendamentosAtivos) {
            throw new RuntimeException("Não é possível inativar este serviço, pois ele possui agendamentos em aberto.");
        }
    }

    private void validarServicoSemNenhumAgendamento(Long servicoId) {
        boolean possuiAgendamentos = agendamentoRepository.existsByServicoId(servicoId);

        if (possuiAgendamentos) {
            throw new RuntimeException("Não é possível excluir este serviço, pois ele possui histórico de agendamentos.");
        }
    }

    private int converterDuracaoParaMinutos(String duracao) {
        if (duracao == null || duracao.isBlank()) {
            throw new RuntimeException("A duração do serviço é inválida.");
        }

        String valor = duracao.toLowerCase().trim();

        int minutos = 0;

        if (valor.contains("h")) {
            String[] partesHora = valor.split("h");

            String horaTexto = partesHora[0].replaceAll("[^0-9]", "");

            if (!horaTexto.isBlank()) {
                minutos += Integer.parseInt(horaTexto) * 60;
            }

            if (partesHora.length > 1) {
                String minutoTexto = partesHora[1].replaceAll("[^0-9]", "");

                if (!minutoTexto.isBlank()) {
                    minutos += Integer.parseInt(minutoTexto);
                }
            }

            return minutos;
        }

        String minutoTexto = valor.replaceAll("[^0-9]", "");

        if (!minutoTexto.isBlank()) {
            return Integer.parseInt(minutoTexto);
        }

        throw new RuntimeException("A duração do serviço é inválida.");
    }

    private ServicoResponse toResponse(Servico servico) {
        return new ServicoResponse(
                servico.getId(),
                servico.getNome(),
                servico.getDescricao(),
                servico.getDuracao(),
                servico.getPreco(),
                servico.getAtivo()
        );
    }
}