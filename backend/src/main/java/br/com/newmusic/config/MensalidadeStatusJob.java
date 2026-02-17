package br.com.newmusic.config;

import br.com.newmusic.service.MensalidadeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class MensalidadeStatusJob {

    private final MensalidadeService mensalidadeService;

    /** Todos os dias às 9h (Recife/PE): marca pendentes vencidas como atrasado (multa 10% e juros 1%/dia) e recalcula juros das atrasadas. */
    @Scheduled(cron = "${newmusic.job.mensalidade-atrasado.cron:0 0 9 * * ?}", zone = "${newmusic.job.mensalidade-atrasado.zone:America/Recife}")
    public void executar() {
        try {
            int novasAtrasadas = mensalidadeService.atualizarPendentesParaAtrasado();
            if (novasAtrasadas > 0) {
                log.info("MensalidadeStatusJob: {} mensalidade(s) marcada(s) de PENDENTE para ATRASADO (multa e juros aplicados).", novasAtrasadas);
            }
            int atrasadasRecalc = mensalidadeService.atualizarMultaJurosAtrasados();
            if (atrasadasRecalc > 0) {
                log.info("MensalidadeStatusJob: {} parcela(s) em atraso com multa/juros recalculados.", atrasadasRecalc);
            }
        } catch (Exception e) {
            log.error("MensalidadeStatusJob: erro ao atualizar status e multa/juros das mensalidades.", e);
        }
    }
}
