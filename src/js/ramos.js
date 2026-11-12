// Os três ramos do app. Cada conta pertence a um ramo (definido pela patrulha/equipe ou pelo código de chefe).
//   stages: etapas da progressão, com o número de blocos concluídos em que cada uma começa
//   finalExtra: itens que também precisam estar marcados para a última etapa (só no Sênior)
//   grupo: como o ramo chama a patrulha; lider: quem acompanha o grupo
const RAMOS = {
  escoteiro: {
    id:'escoteiro', name:'Ramo Escoteiro', short:'Escoteiro', idade:'11 a 14 anos', icon:'⚜️',
    grupo:'patrulha', secao:'tropa', lider:'monitor',
    data: DATA_ESCOTEIRO, specialties: SPECIALTIES_ESCOTEIRO, insignias: INSIGNIAS_ESCOTEIRO,
    stages: [ { icon:'🐾', label:'Pistas', at:0 }, { icon:'🥾', label:'Trilha', at:6 }, { icon:'🧭', label:'Rumo', at:12 }, { icon:'🏕️', label:'Travessia', at:18 } ],
    fonte:'Progressão — Ramo Escoteiro 2026'
  },
  senior: {
    id:'senior', name:'Ramo Sênior', short:'Sênior', idade:'15 a 17 anos', icon:'🧗',
    grupo:'patrulha', secao:'tropa', lider:'monitor',
    data: DATA_SENIOR, specialties: SPECIALTIES_SENIOR, insignias: INSIGNIAS_SENIOR,
    stages: [ { icon:'🧗', label:'Escalada', at:0 }, { icon:'🥉', label:'Conquista', at:6 }, { icon:'🧭', label:'Azimute', at:12 }, { icon:'🏆', label:'Escoteiro da Pátria', short:'Pátria', at:18 } ],
    finalExtra: ['patria-azimute', 'patria-avaliacao'], finalExtraNote:'Desafio do Azimute + Avaliação',
    fonte:'Progressão — Ramo Sênior 2026'
  },
  pioneiro: {
    id:'pioneiro', name:'Ramo Pioneiro', short:'Pioneiro', idade:'18 a 21 anos', icon:'🔱',
    grupo:'equipe', secao:'clã', lider:'coordenador',
    data: DATA_PIONEIRO, specialties: SPECIALTIES_PIONEIRO, insignias: INSIGNIAS_PIONEIRO,
    stages: [ { icon:'🔎', label:'Descoberta', at:0 }, { icon:'🧭', label:'Destino', at:6 }, { icon:'🌅', label:'Horizonte', at:12 } ],
    fonte:'Progressão Pessoal e Projeto de Vida — Ramo Pioneiro'
  }
};
const RAMO_IDS = ['escoteiro', 'senior', 'pioneiro'];
