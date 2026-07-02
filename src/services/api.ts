const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  'https://web-production-1cfeb.up.railway.app/api'

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('edeconsil_token')

  const headers: Record<string, string> = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error((data as { erro?: string }).erro ?? `Erro ${response.status}`)
  }

  return data as T
}

export const authAPI = {
  login: (cpf: string, senha: string) =>
    apiRequest<{
      token: string
      usuario: {
        id: string
        nome: string
        email: string
        cpf: string
        perfil: 'admin' | 'instrutor' | 'colaborador'
        matricula: string
        cr: string
        cargo: string
        setor: string
        turma_id: string | null
        foto_url: string | null
      }
      expiraEm: string
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ cpf, senha }),
    }),

  verificar: () =>
    apiRequest<{ usuario: unknown; valido: boolean }>('/auth/verificar'),
}

export const usuariosAPI = {
  listar: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return apiRequest(`/usuarios${query}`)
  },
  criar: (dados: unknown) =>
    apiRequest('/usuarios', { method: 'POST', body: JSON.stringify(dados) }),
  buscar: (id: string) => apiRequest(`/usuarios/${id}`),
  atualizar: (id: string, dados: unknown) =>
    apiRequest(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(dados) }),
  importarCsv: (alunos: unknown[]) =>
    apiRequest('/usuarios/importar-csv', {
      method: 'POST',
      body: JSON.stringify({ alunos }),
    }),
  deletar: (id: string) =>
    apiRequest(`/usuarios/${id}`, { method: 'DELETE' }),
  uploadFoto: (id: string, formData: FormData) =>
    apiRequest(`/usuarios/${id}/foto`, { method: 'POST', body: formData }),
}

export const cursosAPI = {
  listar: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return apiRequest(`/cursos${query}`)
  },
  buscarPorSlug: (slug: string) => apiRequest(`/cursos/${slug}`),
  aulas: (slug: string) => apiRequest<unknown[]>(`/cursos/${slug}/aulas`),
  meusCursos: () => apiRequest('/meus-cursos'),
  me: () => apiRequest('/me'),
  criar: (dados: unknown) =>
    apiRequest('/cursos', {
      method: 'POST',
      body:   JSON.stringify(dados),
    }),
  atualizar: (id: string, dados: unknown) =>
    apiRequest(`/cursos/${id}`, {
      method: 'PUT',
      body:   JSON.stringify(dados),
    }),
  atualizarStatus: (id: string, status: string) =>
    apiRequest(`/cursos/${id}/status`, {
      method: 'PATCH',
      body:   JSON.stringify({ status }),
    }),
  excluir: (id: string) =>
    apiRequest(`/cursos/${id}`, { method: 'DELETE' }),
  metricas: () =>
    apiRequest('/admin/metricas'),
  salvarProgresso: (slug: string, aulaId: number, dados: { percentual: number; concluida: boolean }) =>
    apiRequest(`/cursos/${slug}/aulas/${aulaId}/progresso`, {
      method: 'PATCH',
      body: JSON.stringify(dados),
    }),
}

export const progressoAPI = {
  salvar: (dados: unknown) =>
    apiRequest('/progresso', { method: 'POST', body: JSON.stringify(dados) }),
  buscarPorCurso: (cursoId: string) =>
    apiRequest(`/progresso/${cursoId}`),
}

export const provaAPI = {
  buscar: (slug: string) =>
    apiRequest(`/cursos/${slug}/prova`),

  submeter: (slug: string, respostas: Record<string, string>) =>
    apiRequest(`/cursos/${slug}/prova/submeter`, {
      method: 'POST',
      body: JSON.stringify({ respostas }),
    }),
}

export const questoesAPI = {
  atualizar: (id: string, dados: {
    enunciado?: string
    alternativas?: { A: string; B: string; C: string; D: string }
    gabarito?: string
    explicacao?: string
  }) =>
    apiRequest(`/questoes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dados),
    }),

  criar: (dados: {
    curso_id: string
    enunciado: string
    alternativas: Record<string, string>
    gabarito: string
    explicacao?: string
    ordem?: number
  }) =>
    apiRequest('/questoes', { method: 'POST', body: JSON.stringify(dados) }),

  excluir: (id: string) =>
    apiRequest(`/questoes/${id}`, { method: 'DELETE' }),
}

export const aulasAPI = {
  criar: (moduloId: string, dados: {
    titulo: string
    descricao?: string
    duracao?: string
    ordem?: number
    video_url?: string
    video_tipo?: string
  }) =>
    apiRequest(`/modulos/${moduloId}/aulas`, {
      method: 'POST',
      body: JSON.stringify(dados),
    }),

  atualizar: (id: string, dados: any) =>
    apiRequest(`/aulas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dados),
    }),

  excluir: (id: string) =>
    apiRequest(`/aulas/${id}`, {
      method: 'DELETE',
    }),
}

export const bibliotecaAPI = {
  listar: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : ''
    return apiRequest(`/biblioteca${q}`)
  },

  upload: async (formData: FormData): Promise<any> => {
    const token   = localStorage.getItem('edeconsil_token')
    const baseUrl = (import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api')
    const resp = await fetch(`${baseUrl}/biblioteca`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}` },
      body:    formData,
    })
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}))
      throw new Error((err as any).erro ?? 'Erro no upload')
    }
    return resp.json()
  },

  excluir: (id: string) =>
    apiRequest(`/biblioteca/${id}`, { method: 'DELETE' }),

  registrarDownload: (id: string) =>
    apiRequest(`/biblioteca/${id}/download`, { method: 'PATCH' }),
}

export const certificadosAPI = {
  meusCertificados: () =>
    apiRequest('/meus-certificados'),

  verificar: (codigo: string) =>
    apiRequest(`/certificados/verificar/${codigo}`),

  listarAdmin: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : ''
    return apiRequest(`/admin/certificados${q}`)
  },

  uploadExterno: (formData: FormData) =>
    apiRequest('/admin/certificados', { method: 'POST', body: formData }),

  excluirExterno: (id: string) =>
    apiRequest(`/admin/certificados/${id}`, { method: 'DELETE' }),
}

export const instrutoresAPI = {
  listar: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : ''
    return apiRequest(`/instrutores${q}`)
  },

  buscarPorId: (id: string) =>
    apiRequest(`/instrutores/${id}`),

  criar: (dados: unknown) =>
    apiRequest('/instrutores', {
      method: 'POST',
      body:   JSON.stringify(dados),
    }),

  atualizar: (id: string, dados: unknown) =>
    apiRequest(`/instrutores/${id}`, {
      method: 'PUT',
      body:   JSON.stringify(dados),
    }),

  excluir: (id: string) =>
    apiRequest(`/instrutores/${id}`, { method: 'DELETE' }),
}

export const meuInstrutorAPI = {
  buscar: () => apiRequest<any>('/meu-instrutor'),
}

export const instrutorAPI = {
  minhaTurma: () => apiRequest<any>('/minha-turma'),
}

export const turmasAPI = {
  listar: () => apiRequest<unknown[]>('/turmas'),
  criar: (dados: {
    nome: string; cargo_grupo: string; setor?: string; responsavel?: string
    icone?: string; cor?: string; status?: string; instrutor_id?: string | null
  }) => apiRequest('/turmas', { method: 'POST', body: JSON.stringify(dados) }),
  atualizar: (id: string, dados: {
    nome: string; cargo_grupo: string; setor?: string; responsavel?: string
    icone?: string; cor?: string; status?: string; instrutor_id?: string | null
  }) => apiRequest(`/turmas/${id}`, { method: 'PUT', body: JSON.stringify(dados) }),
  excluir: (id: string) => apiRequest(`/turmas/${id}`, { method: 'DELETE' }),
}

export const matrizAPI = {
  listar: () =>
    apiRequest('/admin/cargo-cursos'),
  cursosDoCargo: (cargo: string) =>
    apiRequest(`/admin/cargo-cursos/${encodeURIComponent(cargo)}`),
  vincular: (cargo: string, curso_id: string) =>
    apiRequest('/admin/cargo-cursos', {
      method: 'POST',
      body: JSON.stringify({ cargo, curso_id }),
    }),
  desvincular: (cargo: string, curso_id: string) =>
    apiRequest('/admin/cargo-cursos', {
      method: 'DELETE',
      body: JSON.stringify({ cargo, curso_id }),
    }),
}

export const indicadoresAPI = {
  buscar: () => apiRequest('/admin/indicadores'),
}

export const notificacoesAPI = {
  listar: () =>
    apiRequest<{ notificacoes: unknown[]; naoLidas: number }>('/notificacoes'),

  contador: () =>
    apiRequest<{ notificacoes: number; mensagens: number; total: number }>('/notificacoes/contador'),

  marcarLida: (id: string) =>
    apiRequest(`/notificacoes/${id}/lida`, { method: 'PATCH' }),

  marcarTodasLidas: () =>
    apiRequest('/notificacoes/marcar-todas-lidas', { method: 'PATCH' }),

  adminHistorico: (params?: { tipo?: string; pagina?: number; limite?: number }) => {
    const q = new URLSearchParams()
    if (params?.tipo)   q.set('tipo',   params.tipo)
    if (params?.pagina) q.set('pagina', String(params.pagina))
    if (params?.limite) q.set('limite', String(params.limite))
    return apiRequest(`/admin/notificacoes?${q.toString()}`)
  },
}

export const conversasAPI = {
  listar: () => apiRequest<any[]>('/conversas'),
  mensagens: (id: string) => apiRequest<any[]>(`/conversas/${id}/mensagens`),
  criar: (dados: { destinatario_id: string; tipo_contato?: string }) =>
    apiRequest<any>('/conversas', { method: 'POST', body: JSON.stringify(dados) }),
  marcarTodasLidas: () =>
    apiRequest('/conversas/marcar-todas-lidas', { method: 'PATCH' }),
  preferencias: (id: string, dados: {
    favorita?: boolean
    fixada?: boolean
    silenciada?: boolean
    nao_lida?: boolean
    bloqueada?: boolean
  }) =>
    apiRequest(`/conversas/${id}/preferencias`, {
      method: 'PATCH',
      body: JSON.stringify(dados),
    }),
  limpar: (id: string) =>
    apiRequest(`/conversas/${id}/limpar`, { method: 'PATCH' }),
  apagar: (id: string) =>
    apiRequest(`/conversas/${id}/apagar`, { method: 'PATCH' }),
}

export const modulosAPI = {
  criar: (dados: { curso_id: string; titulo: string; ordem?: number }) =>
    apiRequest('/modulos', { method: 'POST', body: JSON.stringify(dados) }),

  atualizar: (id: string, dados: { titulo: string; ordem?: number }) =>
    apiRequest(`/modulos/${id}`, { method: 'PUT', body: JSON.stringify(dados) }),

  excluir: (id: string) =>
    apiRequest(`/modulos/${id}`, { method: 'DELETE' }),
}

if (typeof window !== 'undefined') {
  setInterval(() => { apiRequest('/ping').catch(() => {}) }, 4 * 60 * 1000)
}

export default apiRequest
