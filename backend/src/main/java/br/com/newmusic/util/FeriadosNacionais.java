package br.com.newmusic.util;

import java.time.LocalDate;
import java.time.Month;
import java.util.HashSet;
import java.util.Set;

public final class FeriadosNacionais {

    private FeriadosNacionais() {}

    public static boolean isFeriadoNacional(LocalDate data) {
        Set<LocalDate> feriados = feriadosDoAno(data.getYear());
        return feriados.contains(data);
    }

    private static Set<LocalDate> feriadosDoAno(int ano) {
        Set<LocalDate> set = new HashSet<>();
        set.add(LocalDate.of(ano, Month.JANUARY, 1));
        set.add(LocalDate.of(ano, Month.APRIL, 21));
        set.add(LocalDate.of(ano, Month.MAY, 1));
        set.add(LocalDate.of(ano, Month.SEPTEMBER, 7));
        set.add(LocalDate.of(ano, Month.OCTOBER, 12));
        set.add(LocalDate.of(ano, Month.NOVEMBER, 2));
        set.add(LocalDate.of(ano, Month.NOVEMBER, 15));
        set.add(LocalDate.of(ano, Month.NOVEMBER, 20));
        set.add(LocalDate.of(ano, Month.DECEMBER, 25));

        LocalDate pascoa = calcularPascoa(ano);
        set.add(pascoa.minusDays(2));
        set.add(pascoa.plusDays(60));
        set.add(pascoa.minusDays(47));

        return set;
    }

    private static LocalDate calcularPascoa(int ano) {
        int a = ano % 19;
        int b = ano / 100;
        int c = ano % 100;
        int d = b / 4;
        int e = b % 4;
        int f = (b + 8) / 25;
        int g = (b - f + 1) / 3;
        int h = (19 * a + b - d - g + 15) % 30;
        int i = c / 4;
        int k = c % 4;
        int l = (32 + 2 * e + 2 * i - h - k) % 7;
        int m = (a + 11 * h + 22 * l) / 451;
        int mes = (h + l - 7 * m + 114) / 31;
        int dia = ((h + l - 7 * m + 114) % 31) + 1;
        return LocalDate.of(ano, mes, dia);
    }
}
