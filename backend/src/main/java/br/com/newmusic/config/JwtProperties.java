package br.com.newmusic.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "jwt")
@lombok.Getter
@lombok.Setter
public class JwtProperties {

    private String secret;
    private int accessTokenValidityMinutes = 30;
    private int refreshTokenValidityDays = 7;
}
