import { describe, it, expect } from 'vitest'
import {
  menorDeIdade,
  preencher,
  getTextoDeclaracao,
  getTituloDeclaracao,
  montarDadosDeclaracao,
  computeDeclaracaoState,
  type TipoDeclaracao,
  type DadosDeclaracao,
} from './declaracoes'
import type { Aluno } from '../types'

describe('declaracoes', () => {
  describe('menorDeIdade', () => {
    it('retorna false para data vazia', () => {
      expect(menorDeIdade(undefined)).toBe(false)
    })
    it('retorna true para nascimento há menos de 18 anos', () => {
      const ano = new Date().getFullYear() - 10
      expect(menorDeIdade(`${ano}-06-15`)).toBe(true)
    })
    it('retorna false para nascimento há mais de 18 anos', () => {
      const ano = new Date().getFullYear() - 25
      expect(menorDeIdade(`${ano}-01-01`)).toBe(false)
    })
  })

  describe('preencher', () => {
    it('substitui placeholders pelos dados', () => {
      const dados: DadosDeclaracao = {
        alunoNome: 'João',
        alunoCpf: '123.456.789-00',
        dataExtenso: '17 de fevereiro de 2025',
        dataDDMMAAAA: '17/02/2025',
        nomeAssinatura: 'João',
      }
      const texto = '[ALUNO_NOME] [ALUNO_CPF] [DATA]'
      expect(preencher(texto, dados)).toContain('João')
      expect(preencher(texto, dados)).toContain('123.456.789-00')
      expect(preencher(texto, dados)).toContain('17 de fevereiro de 2025')
    })
  })

  describe('getTextoDeclaracao', () => {
    it('retorna texto para LGPD', () => {
      const t = getTextoDeclaracao('LGPD' as TipoDeclaracao)
      expect(t).toContain('LGPD')
      expect(t).toContain('[ALUNO_NOME]')
    })
    it('retorna texto para DIRETO_IMAGEM', () => {
      const t = getTextoDeclaracao('DIRETO_IMAGEM' as TipoDeclaracao)
      expect(t).toContain('IMAGEM')
    })
    it('retorna texto para DECLARACAO_RESPONSAVEL com responsável', () => {
      const dados: DadosDeclaracao = {
        alunoNome: 'X',
        responsavelNome: 'Responsável',
        dataExtenso: '',
        dataDDMMAAAA: '',
        nomeAssinatura: '',
      }
      const t = getTextoDeclaracao('DECLARACAO_RESPONSAVEL' as TipoDeclaracao, dados)
      expect(t).toContain('[RESPONSAVEL_NOME]')
      expect(t).toContain('responsável legal')
    })
  })

  describe('getTituloDeclaracao', () => {
    it('retorna títulos por tipo', () => {
      expect(getTituloDeclaracao('LGPD' as TipoDeclaracao)).toBe('Declaração LGPD')
      expect(getTituloDeclaracao('DIRETO_IMAGEM' as TipoDeclaracao)).toBe('Direito de Imagem')
      expect(getTituloDeclaracao('DECLARACAO_RESPONSAVEL' as TipoDeclaracao)).toBe('Declaração de Responsabilidade')
    })
  })

  describe('montarDadosDeclaracao', () => {
    it('monta dados a partir do aluno', () => {
      const aluno = {
        nome: 'Maria',
        cpf: '52998224725',
        dataNascimento: '2015-05-10',
        responsavelNome: 'Pai',
        responsavelCpf: '12345678901',
        telefone: '11987654321',
      }
      const d = montarDadosDeclaracao(aluno)
      expect(d.alunoNome).toBe('Maria')
      expect(d.responsavelNome).toBe('Pai')
      expect(d.alunoCpf).toBeTruthy()
      expect(d.dataExtenso).toBeTruthy()
      expect(d.dataDDMMAAAA).toBeTruthy()
    })
  })

  describe('computeDeclaracaoState', () => {
    it('retorna estado com texto preview quando aluno selecionado', () => {
      const alunos: Aluno[] = [
        { id: 1, nome: 'Aluno', email: 'a@a.com', dataNascimento: '2010-01-01' },
      ]
      const state = computeDeclaracaoState('1', alunos, 'LGPD' as TipoDeclaracao)
      expect(state.aluno?.nome).toBe('Aluno')
      expect(state.dados).not.toBeNull()
      expect(state.textoPreview).not.toBe('Selecione o tipo de declaração e o aluno.')
    })
    it('retorna estado inicial quando alunoId vazio', () => {
      const state = computeDeclaracaoState('', [], 'LGPD' as TipoDeclaracao)
      expect(state.aluno).toBeNull()
      expect(state.textoPreview).toBe('Selecione o tipo de declaração e o aluno.')
    })
  })
})
