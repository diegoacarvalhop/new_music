-- Pré-cadastro dos grupos de instrumentos existentes no mundo
INSERT INTO grupo (nome) VALUES
    ('Cordas'),
    ('Teclas'),
    ('Sopros - Madeiras'),
    ('Sopros - Metais'),
    ('Percussão'),
    ('Canto')
ON CONFLICT (nome) DO NOTHING;
