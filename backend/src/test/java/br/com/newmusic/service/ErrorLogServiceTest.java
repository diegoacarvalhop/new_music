package br.com.newmusic.service;

import br.com.newmusic.domain.ErrorLog;
import br.com.newmusic.repository.ErrorLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ErrorLogServiceTest {

    @Mock
    private ErrorLogRepository errorLogRepository;

    @Mock
    private HttpServletRequest request;

    @InjectMocks
    private ErrorLogService errorLogService;

    @Test
    void registrar_salvaLogComExcecaoERequest() {
        when(request.getMethod()).thenReturn("GET");
        when(request.getRequestURI()).thenReturn("/api/alunos");
        ArgumentCaptor<ErrorLog> captor = ArgumentCaptor.forClass(ErrorLog.class);
        when(errorLogRepository.save(any(ErrorLog.class))).thenAnswer(i -> i.getArgument(0));

        RuntimeException ex = new RuntimeException("Erro de teste");
        errorLogService.registrar(ex, request);

        verify(errorLogRepository).save(captor.capture());
        ErrorLog log = captor.getValue();
        assertThat(log.getAcao()).isEqualTo("GET /api/alunos");
        assertThat(log.getMensagemErro()).isEqualTo("Erro de teste");
        assertThat(log.getTipoExcecao()).isEqualTo(RuntimeException.class.getName());
        assertThat(log.getStackTrace()).contains("RuntimeException");
    }

    @Test
    void registrar_comRequestNull_usaNA() {
        ArgumentCaptor<ErrorLog> captor = ArgumentCaptor.forClass(ErrorLog.class);
        when(errorLogRepository.save(any(ErrorLog.class))).thenAnswer(i -> i.getArgument(0));

        errorLogService.registrar(new IllegalStateException("erro"), null);

        verify(errorLogRepository).save(captor.capture());
        assertThat(captor.getValue().getAcao()).isEqualTo("N/A");
    }
}
