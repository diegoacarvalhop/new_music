package br.com.newmusic.config;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.exception.FlywayValidateException;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(Integer.MIN_VALUE)
public class FlywayMigrationRunner implements CommandLineRunner {

    private final Flyway flyway;

    public FlywayMigrationRunner(Flyway flyway) {
        this.flyway = flyway;
    }

    @Override
    public void run(String... args) {
        try {
            flyway.migrate();
        } catch (FlywayValidateException e) {
            flyway.repair();
            flyway.migrate();
        }
    }
}
