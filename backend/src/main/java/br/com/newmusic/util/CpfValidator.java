package br.com.newmusic.util;

public final class CpfValidator {

    private CpfValidator() {}

    public static String normalize(String cpf) {
        if (cpf == null || cpf.isBlank()) return "";
        return cpf.replaceAll("\\D", "");
    }

    public static boolean isValid(String cpf) {
        if (cpf == null || cpf.isBlank()) return true;
        String nums = normalize(cpf);
        if (nums.length() != 11) return false;
        if (nums.matches("(\\d)\\1{10}")) return false;
        int soma = 0;
        for (int i = 0; i < 9; i++) {
            soma += Character.digit(nums.charAt(i), 10) * (10 - i);
        }
        int resto = (soma * 10) % 11;
        if (resto == 10) resto = 0;
        if (resto != Character.digit(nums.charAt(9), 10)) return false;
        soma = 0;
        for (int i = 0; i < 10; i++) {
            soma += Character.digit(nums.charAt(i), 10) * (11 - i);
        }
        resto = (soma * 10) % 11;
        if (resto == 10) resto = 0;
        return resto == Character.digit(nums.charAt(10), 10);
    }
}
