package br.com.newmusic;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class NewMusicApplication {

    public static void main(String[] args) {
        SpringApplication.run(NewMusicApplication.class, args);
    }
}
