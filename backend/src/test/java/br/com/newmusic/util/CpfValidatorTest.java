package br.com.newmusic.util;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class CpfValidatorTest {

    @Test
    void normalize_removeNaoDigitos() {
        assertThat(CpfValidator.normalize("123.456.789-00")).isEqualTo("12345678900");
        assertThat(CpfValidator.normalize("123 456 789 00")).isEqualTo("12345678900");
        assertThat(CpfValidator.normalize(null)).isEqualTo("");
        assertThat(CpfValidator.normalize("")).isEqualTo("");
        assertThat(CpfValidator.normalize("   ")).isEqualTo("");
    }

    @Test
    void isValid_retornaTrueParaCpfValido() {
        assertThat(CpfValidator.isValid("529.982.247-25")).isTrue();
        assertThat(CpfValidator.isValid("52998224725")).isTrue();
        assertThat(CpfValidator.isValid(null)).isTrue();
        assertThat(CpfValidator.isValid("")).isTrue();
    }

    @Test
    void isValid_retornaFalseParaCpfInvalido() {
        assertThat(CpfValidator.isValid("111.111.111-11")).isFalse();
        assertThat(CpfValidator.isValid("123")).isFalse();
        assertThat(CpfValidator.isValid("12345678901")).isFalse();
        assertThat(CpfValidator.isValid("529.982.247-26")).isFalse();
    }
}
