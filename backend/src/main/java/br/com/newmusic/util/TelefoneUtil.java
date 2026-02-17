package br.com.newmusic.util;

import java.util.regex.Pattern;

public final class TelefoneUtil {

    private static final Pattern APENAS_DIGITOS = Pattern.compile("[^0-9]");

    private TelefoneUtil() {
    }

    public static String normalizarParaE164(String telefone) {
        if (telefone == null || telefone.isBlank()) return "";
        String digits = APENAS_DIGITOS.matcher(telefone).replaceAll("");
        if (digits.length() == 0) return "";
        if (digits.startsWith("55") && (digits.length() == 12 || digits.length() == 13)) {
            return digits;
        }
        if (digits.length() == 10 || digits.length() == 11) {
            return "55" + digits;
        }
        return digits;
    }

    public static boolean saoIguais(String a, String b) {
        return normalizarParaE164(a).equals(normalizarParaE164(b));
    }
}
