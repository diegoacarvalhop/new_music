package br.com.newmusic.util;

import java.util.Objects;

public final class StringUtil {

    private StringUtil() {}

    public static String nvl(Object o) {
        return o == null ? "" : o.toString();
    }

    public static void diff(StringBuilder sb, String campo, Object antigo, Object novo) {
        if (!Objects.equals(antigo, novo)) {
            if (sb.length() > 0) sb.append("; ");
            sb.append(campo).append(": ").append(nvl(antigo)).append(" -> ").append(nvl(novo));
        }
    }
}
