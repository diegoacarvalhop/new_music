export interface Page<T> {
  content: T[]
  totalPages: number
  totalElements: number
  size: number
  number: number
}

export interface Aluno {
  id: number
  nome: string
  email: string
  telefone?: string
  cpf?: string
  dataNascimento?: string
  responsavelNome?: string
  responsavelCpf?: string
  endereco?: string
  observacoes?: string
  ativo?: boolean
}

export interface Grupo {
  id: number
  nome: string
}

export interface Instrumento {
  id: number
  nome: string
  grupoId?: number
  grupoNome?: string
  descricao?: string
  ativo?: boolean
}

export interface Professor {
  id: number
  nome: string
  email: string
  telefone?: string
  cpf?: string
  instrumentos?: string
  disponibilidade?: string
  ativo?: boolean
}

export interface HorarioSlot {
  diaSemana: number
  horarioInicio?: string
  horarioFim?: string
}

export interface Turma {
  id: number
  diaSemana?: number
  horarioInicio?: string
  horarios?: HorarioSlot[]
  capacidade?: number
  capacidadePreenchida?: number
  aulasPorSemana?: number
  instrumentoId?: number
  instrumentoNome?: string
  instrumentoGrupoId?: number
  instrumentoGrupoNome?: string
  professorId?: number
  professorNome?: string
  ativo?: boolean
  alunos?: string[]
}

export interface Matricula {
  id: number
  dataInicio: string
  dataFim?: string
  ativo?: boolean
  valorCurso?: number
  dataVencimento?: string
  aulasPorSemana?: number
  alunoId: number
  alunoNome?: string
  turmaId: number
  turmaDescricao?: string
}

export interface Mensalidade {
  id: number
  alunoId: number
  alunoNome?: string
  alunoCpf?: string
  mes: number
  ano: number
  vencimento: string
  valor: number
  valorMulta?: number | null
  valorJuros?: number | null
  status: 'PENDENTE' | 'PAGO' | 'ATRASADO'
  dataPagamento?: string
  formaPagamento?: string
}

export interface AlunoMensalidadeResumo {
  alunoId: number
  alunoNome: string
  matriculaId: number | null
  turmaDescricao: string | null
  turmaDiasHorarios?: string | null
  totalMensalidades: number
}

export interface PresencaRegistro {
  id?: number
  turmaId?: number
  matriculaId: number
  alunoNome?: string
  dataAula?: string
  presente?: boolean
  conteudoAula?: string
  pagamentoEmDia?: boolean
}

export interface PresencaProfessorRegistro {
  id?: number
  professorId?: number
  turmaId: number
  turmaDescricao?: string
  dataAula?: string
  presente?: boolean
}

export interface Usuario {
  id: number
  email: string
  nome: string
  perfil: 'ADMINISTRADOR' | 'PROFESSOR' | 'FUNCIONARIO'
  ativo?: boolean
  professorCpf?: string | null
  professorTelefone?: string | null
}

export interface AuthUser {
  id: number
  email: string
  nome: string
  perfil: string
  professorId?: number | null
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  id: number
  email: string
  nome: string
  perfil: string
  professorId?: number | null
}
