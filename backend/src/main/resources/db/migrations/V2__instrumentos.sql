-- Pré-cadastro dos instrumentos existentes no mundo (grupo_id via subquery)
INSERT INTO instrumento (nome, grupo_id, descricao, ativo)
SELECT 'Violão', id, 'Instrumento de cordas dedilhadas', true FROM grupo WHERE nome = 'Cordas' LIMIT 1;
INSERT INTO instrumento (nome, grupo_id, descricao, ativo)
SELECT 'Violino', id, 'Instrumento de cordas friccionadas, agudo', true FROM grupo WHERE nome = 'Cordas' LIMIT 1;
INSERT INTO instrumento (nome, grupo_id, descricao, ativo)
SELECT 'Viola', id, 'Instrumento de cordas friccionadas, médio', true FROM grupo WHERE nome = 'Cordas' LIMIT 1;
INSERT INTO instrumento (nome, grupo_id, descricao, ativo)
SELECT 'Violoncelo', id, 'Instrumento de cordas friccionadas, grave', true FROM grupo WHERE nome = 'Cordas' LIMIT 1;
INSERT INTO instrumento (nome, grupo_id, descricao, ativo)
SELECT 'Contrabaixo', id, 'Instrumento de cordas, registro grave', true FROM grupo WHERE nome = 'Cordas' LIMIT 1;
INSERT INTO instrumento (nome, grupo_id, descricao, ativo)
SELECT 'Harpa', id, 'Instrumento de cordas pinçadas', true FROM grupo WHERE nome = 'Cordas' LIMIT 1;
INSERT INTO instrumento (nome, grupo_id, descricao, ativo)
SELECT 'Cavaquinho', id, 'Instrumento de cordas dedilhadas, típico da música brasileira', true FROM grupo WHERE nome = 'Cordas' LIMIT 1;
INSERT INTO instrumento (nome, grupo_id, descricao, ativo)
SELECT 'Bandolim', id, 'Instrumento de cordas dedilhadas', true FROM grupo WHERE nome = 'Cordas' LIMIT 1;
INSERT INTO instrumento (nome, grupo_id, descricao, ativo)
SELECT 'Guitarra', id, 'Instrumento de cordas dedilhadas ou palhetadas', true FROM grupo WHERE nome = 'Cordas' LIMIT 1;
INSERT INTO instrumento (nome, grupo_id, descricao, ativo)
SELECT 'Guitarra Elétrica', id, 'Guitarra com captação elétrica', true FROM grupo WHERE nome = 'Cordas' LIMIT 1;
INSERT INTO instrumento (nome, grupo_id, descricao, ativo)
SELECT 'Baixo Elétrico', id, 'Instrumento de cordas para registro grave', true FROM grupo WHERE nome = 'Cordas' LIMIT 1;
INSERT INTO instrumento (nome, grupo_id, descricao, ativo)
SELECT 'Piano', id, 'Instrumento de teclas e cordas percutidas', true FROM grupo WHERE nome = 'Teclas' LIMIT 1;
INSERT INTO instrumento (nome, grupo_id, descricao, ativo)
SELECT 'Teclado', id, 'Instrumento eletrônico de teclas', true FROM grupo WHERE nome = 'Teclas' LIMIT 1;
INSERT INTO instrumento (nome, grupo_id, descricao, ativo)
SELECT 'Órgão', id, 'Instrumento de teclas e tubos ou eletrônico', true FROM grupo WHERE nome = 'Teclas' LIMIT 1;
INSERT INTO instrumento (nome, grupo_id, descricao, ativo)
SELECT 'Acordeom', id, 'Instrumento de teclas e fole', true FROM grupo WHERE nome = 'Teclas' LIMIT 1;
INSERT INTO instrumento (nome, grupo_id, descricao, ativo)
SELECT 'Flauta Transversal', id, 'Instrumento de sopro, madeira ou metal', true FROM grupo WHERE nome = 'Sopros - Madeiras' LIMIT 1;
INSERT INTO instrumento (nome, grupo_id, descricao, ativo)
SELECT 'Flauta Doce', id, 'Instrumento de sopro, educação musical', true FROM grupo WHERE nome = 'Sopros - Madeiras' LIMIT 1;
INSERT INTO instrumento (nome, grupo_id, descricao, ativo)
SELECT 'Clarinete', id, 'Instrumento de sopro de palheta simples', true FROM grupo WHERE nome = 'Sopros - Madeiras' LIMIT 1;
INSERT INTO instrumento (nome, grupo_id, descricao, ativo)
SELECT 'Oboé', id, 'Instrumento de sopro de palheta dupla', true FROM grupo WHERE nome = 'Sopros - Madeiras' LIMIT 1;
INSERT INTO instrumento (nome, grupo_id, descricao, ativo)
SELECT 'Fagote', id, 'Instrumento de sopro grave, palheta dupla', true FROM grupo WHERE nome = 'Sopros - Madeiras' LIMIT 1;
INSERT INTO instrumento (nome, grupo_id, descricao, ativo)
SELECT 'Saxofone', id, 'Instrumento de sopro de palheta simples', true FROM grupo WHERE nome = 'Sopros - Madeiras' LIMIT 1;
INSERT INTO instrumento (nome, grupo_id, descricao, ativo)
SELECT 'Trompete', id, 'Instrumento de metal, registro agudo', true FROM grupo WHERE nome = 'Sopros - Metais' LIMIT 1;
INSERT INTO instrumento (nome, grupo_id, descricao, ativo)
SELECT 'Trombone', id, 'Instrumento de metal com vara', true FROM grupo WHERE nome = 'Sopros - Metais' LIMIT 1;
INSERT INTO instrumento (nome, grupo_id, descricao, ativo)
SELECT 'Trompa', id, 'Instrumento de metal, registro médio', true FROM grupo WHERE nome = 'Sopros - Metais' LIMIT 1;
INSERT INTO instrumento (nome, grupo_id, descricao, ativo)
SELECT 'Tuba', id, 'Instrumento de metal, registro grave', true FROM grupo WHERE nome = 'Sopros - Metais' LIMIT 1;
INSERT INTO instrumento (nome, grupo_id, descricao, ativo)
SELECT 'Eufônio', id, 'Instrumento de metal, registro médio-grave', true FROM grupo WHERE nome = 'Sopros - Metais' LIMIT 1;
INSERT INTO instrumento (nome, grupo_id, descricao, ativo)
SELECT 'Bateria', id, 'Conjunto de instrumentos de percussão', true FROM grupo WHERE nome = 'Percussão' LIMIT 1;
INSERT INTO instrumento (nome, grupo_id, descricao, ativo)
SELECT 'Percussão', id, 'Instrumentos de percussão em geral', true FROM grupo WHERE nome = 'Percussão' LIMIT 1;
INSERT INTO instrumento (nome, grupo_id, descricao, ativo)
SELECT 'Xilofone', id, 'Instrumento de percussão de lâminas', true FROM grupo WHERE nome = 'Percussão' LIMIT 1;
INSERT INTO instrumento (nome, grupo_id, descricao, ativo)
SELECT 'Marimba', id, 'Instrumento de percussão de lâminas', true FROM grupo WHERE nome = 'Percussão' LIMIT 1;
INSERT INTO instrumento (nome, grupo_id, descricao, ativo)
SELECT 'Vibrafone', id, 'Instrumento de percussão com motor', true FROM grupo WHERE nome = 'Percussão' LIMIT 1;
INSERT INTO instrumento (nome, grupo_id, descricao, ativo)
SELECT 'Congas', id, 'Tumbadoras, percussão de mão', true FROM grupo WHERE nome = 'Percussão' LIMIT 1;
INSERT INTO instrumento (nome, grupo_id, descricao, ativo)
SELECT 'Bongô', id, 'Percussão de mão, dois tambores', true FROM grupo WHERE nome = 'Percussão' LIMIT 1;
INSERT INTO instrumento (nome, grupo_id, descricao, ativo)
SELECT 'Pandeiro', id, 'Percussão de mão com platinelas', true FROM grupo WHERE nome = 'Percussão' LIMIT 1;
INSERT INTO instrumento (nome, grupo_id, descricao, ativo)
SELECT 'Cajón', id, 'Caixa de percussão sentada', true FROM grupo WHERE nome = 'Percussão' LIMIT 1;
INSERT INTO instrumento (nome, grupo_id, descricao, ativo)
SELECT 'Asalato', id, 'Instrumento de percussão de mão, duas cabaças com sementes', true FROM grupo WHERE nome = 'Percussão' LIMIT 1;
INSERT INTO instrumento (nome, grupo_id, descricao, ativo)
SELECT 'Canto Lírico', id, 'Canto erudito/operístico', true FROM grupo WHERE nome = 'Canto' LIMIT 1;
INSERT INTO instrumento (nome, grupo_id, descricao, ativo)
SELECT 'Canto Popular', id, 'Canto popular e contemporâneo', true FROM grupo WHERE nome = 'Canto' LIMIT 1;
