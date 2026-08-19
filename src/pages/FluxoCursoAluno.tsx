import { useState } from 'react'
import { CursoDetalheColaborador } from './CursoDetalheColaborador'
import { VideoAulaColaborador } from './VideoAulaColaborador'
import { ProvaOnline } from './ProvaOnline'

interface FluxoCursoAlunoProps {
  cursoSlug: string
  /** Volta para o painel de onde veio (admin ou instrutor). */
  onSair: () => void
  onLogout: () => void
}

/**
 * O fluxo do aluno (detalhe → vídeo aula → prova) empacotado com o próprio
 * estado, para admin e instrutor abrirem um curso em "Minhas Aulas" sem
 * duplicar a fiação que o App.tsx já faz para o colaborador.
 *
 * As três telas são reusadas SEM alteração — elas montam o layout do
 * colaborador (sidebar própria), então aqui elas ocupam a tela inteira por
 * cima do painel. Qualquer navegação para fora do fluxo (um item da sidebar
 * do aluno, por exemplo) devolve ao painel via onSair, que é o comportamento
 * previsível para quem entrou por "Minhas Aulas".
 */
export function FluxoCursoAluno({ cursoSlug, onSair, onLogout }: FluxoCursoAlunoProps) {
  const [etapa, setEtapa]           = useState<'detalhe' | 'video' | 'prova'>('detalhe')
  const [cursoId, setCursoId]       = useState(cursoSlug)
  const [moduloId, setModuloId]     = useState<number>(1)
  const [aulaId, setAulaId]         = useState<number>(1)
  const [provaSlug, setProvaSlug]   = useState(cursoSlug)
  const [provaTitulo, setProvaTitulo] = useState('Avaliação Final')
  // Remonta o detalhe ao voltar, para o progresso recém-salvo aparecer.
  const [navKey, setNavKey]         = useState(0)

  if (etapa === 'prova') {
    return (
      <ProvaOnline
        cursoSlug={provaSlug}
        cursoTitulo={provaTitulo}
        onNavigate={onSair}
        onLogout={onLogout}
        onVoltarDetalhe={() => {
          setCursoId(provaSlug)
          setNavKey(k => k + 1)
          setEtapa('detalhe')
        }}
      />
    )
  }

  if (etapa === 'video') {
    return (
      <VideoAulaColaborador
        cursoId={cursoId}
        moduloId={moduloId}
        aulaId={aulaId}
        onNavigate={onSair}
        onLogout={onLogout}
        onVoltarLista={onSair}
        onVoltarDetalhe={(id) => {
          setCursoId(id)
          setNavKey(k => k + 1)
          setEtapa('detalhe')
        }}
        onTrocarAula={(id, modId, aulId) => {
          setCursoId(id)
          setModuloId(modId)
          setAulaId(aulId)
        }}
      />
    )
  }

  return (
    <CursoDetalheColaborador
      key={navKey}
      cursoId={cursoId}
      onNavigate={onSair}
      onLogout={onLogout}
      onVoltarLista={onSair}
      onAbrirAula={(id, modId, aulId) => {
        setCursoId(id)
        setModuloId(modId)
        setAulaId(aulId)
        setEtapa('video')
      }}
      onAbrirProva={(curso, titulo) => {
        setProvaSlug(curso)
        setProvaTitulo(titulo ?? 'Avaliação Final')
        setEtapa('prova')
      }}
    />
  )
}
