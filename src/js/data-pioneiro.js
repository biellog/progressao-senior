// Conteúdo da Progressão — Ramo Pioneiro (eixos, blocos, ações, especialidades e insígnias)
// Mesmo formato de data-escoteiro.js. No Ramo Pioneiro as ações variáveis são indicadas pelo
// próprio pioneiro, de acordo com o seu Projeto de Vida; as listadas aqui são as sugestões do guia.

const PIONEIRO_VAR_LABEL = 'Ações variáveis — indique as suas conforme o seu Projeto de Vida (sugestões)';
function pioBloco(b){ return Object.assign({ varLabel: PIONEIRO_VAR_LABEL, varMin: 1 }, b); }

const PIONEIRO_EIXOS = [
  { name:'Habilidades para a Vida', blocos:[
    pioBloco({ name:'Aprendizagem contínua e desenvolvimento vocacional',
      desc:'Buscar constantemente novos conhecimentos e habilidades, analisando informações com senso crítico e aplicando-as de forma responsável. Explorar suas opções vocacionais para escolher um caminho profissional que lhe proporcione realização e dignidade.',
      fixas:[
        'Conquistar, no Ramo Pioneiro, uma especialidade sobre um tema de seu interesse e que seja um conhecimento novo.'
      ],
      variaveis:[
        'Assumir um papel ativo em atividades voluntárias ou estágios em instituições que estejam alinhadas com seus valores, interesses e objetivos pessoais, visando ampliar a experiência prática, fortalecer o compromisso social e desenvolver habilidades que contribuam para sua formação cidadã e profissional.',
        'Participar de programas voltados a jovens em início de carreira, que oferecem capacitação estruturada e oportunidades de crescimento dentro de uma organização.',
        'Fazer cursos técnicos, de idiomas ou certificações reconhecidas no mercado, ampliando as qualificações profissionais.',
        'Engajar-se em projetos acadêmicos, contribuindo tanto para o desenvolvimento científico quanto para a experiência prática.',
        'Envolver-se em iniciativas empreendedoras ou incubadoras universitárias, experimentando o ambiente de inovação e gestão de projetos.',
        'Frequentar eventos, congressos e seminários para criar conexões e ampliar o contato com diferentes áreas de atuação.',
        'Buscar experiências em outras cidades, estados ou países, conciliando aprendizado cultural, acadêmico e profissional.'
      ],
      ou:'Conquistar ao menos uma das seguintes especialidades ou insígnia: Educação, Idiomas ou a Insígnia do Aprender.' }),
    pioBloco({ name:'Autonomia e Liderança',
      desc:'Assumir o compromisso de conquistar sua independência financeira de forma ética, valorizando seu próprio trabalho e o dos outros. Participar ativamente de projetos individuais e coletivos, tomar decisões com consciência e responsabilidade, avaliando os impactos de suas escolhas.',
      fixas:[
        'Planejar e realizar uma viagem para um município próximo, de forma individual ou em equipe, desenvolvendo um roteiro detalhado que inclua o destino, distância, meios de transporte, custos estimados, hospedagem (se necessário), pontos de interesse, aspectos culturais e históricos da região, além do contato com uma Unidade Escoteira Local, se houver. Durante a viagem, registrar as experiências e aprendizados adquiridos para compartilhar com a comunidade escoteira.'
      ],
      variaveis:[
        'Participar de um evento externo como representante da Unidade Escoteira Local ou do Escotismo.',
        'Organizar uma oficina sobre finanças pessoais para o clã, UEL ou a comunidade.',
        'Criar pequenos projetos de geração de renda, como startups sociais ou negócios criativos.',
        'Elaborar uma atividade de reflexão sobre consequências de decisões no âmbito profissional ou financeiro.',
        'Apoiar jovens mais novos, compartilhando aprendizados acadêmicos, profissionais e de vida.'
      ],
      ou:'Conquistar ao menos uma das seguintes especialidades: Empreendedorismo e Negócios, Finanças e Economia, Liderança e Gestão, Viagens.' }),
    pioBloco({ name:'Criatividade e Inovação',
      desc:'Utilizar a criatividade para se adaptar a diferentes situações do dia a dia, explorando novas soluções para desafios e inovando ao enfrentar mudanças.',
      fixas:[
        'Planejar e executar atividades ao ar livre, prevendo possíveis imprevistos e adaptando criativamente as soluções quando necessário.'
      ],
      variaveis:[
        'Identificar um problema ou necessidade na comunidade local e implementar uma solução criativa, inovadora e prática. A iniciativa pode envolver ações culturais, ambientais, tecnológicas ou sociais, mas deve ter como principal foco o uso da criatividade para propor algo novo, diferente, fora do comum. Possíveis áreas de atuação: arte urbana e comunitária; tecnologia criativa; oficinas criativas; espaço de expressão comunitária.',
        'Realizar ou participar de uma campanha para garantir a primeira participação de um jovem em uma atividade escoteira regional, nacional ou internacional.',
        'Participar de atividades que ensinem metodologias criativas para resolver problemas, estimulando colaboração e inovação.',
        'Organizar uma maratona de ideias em que grupos de jovens criem soluções inovadoras para desafios reais da comunidade (como alimentação, transporte, inclusão digital ou meio ambiente).',
        'Estimular o desenvolvimento de produtos ou serviços com impacto social positivo.'
      ],
      ou:'Conquistar a especialidade Comunicações ou a Insígnia Inovadores de Impacto.' }),
    pioBloco({ name:'Inteligência Emocional',
      desc:'Fortalecer a resiliência, refletindo sobre seus pontos fortes e áreas de melhoria, sabendo lidar com suas emoções e construindo relações saudáveis. Incentivar a busca pela realização dos próprios sonhos, por meio do estabelecimento e da execução de planos com equilíbrio, propósito e respeito consigo mesmo e com os outros.',
      fixas:[
        'Estabelecer metas pessoais de curto e médio prazo e avaliá-las regularmente em seu Projeto de Vida, ajustando estratégias quando necessário.'
      ],
      variaveis:[
        'Organizar uma atividade para o clã, grupo ou a comunidade sobre um dos seguintes temas: autoconhecimento; relações humanas; ética e moral; estresse e ansiedade; técnicas de resolução de conflitos (escuta ativa, comunicação não violenta, negociação, empatia, feedback).',
        'Exercitar práticas integrativas que combinam respiração consciente, percepção do corpo e das emoções, pequenas meditações guiadas, momentos de escuta ativa em duplas e exercícios simples como caminhada silenciosa ou alongamentos.'
      ] })
  ]},
  { name:'Meio Ambiente', blocos:[
    pioBloco({ name:'Consumo Responsável',
      desc:'Agir com responsabilidade ambiental, adotando a prática do consumo consciente e desenvolvendo iniciativas que contribuam para a construção de um futuro sustentável.',
      fixas:[
        'Assumir o compromisso de consumo consciente, praticando durante as atividades cotidianas e nas atividades do clã escolhas sustentáveis que priorizem o essencial e minimizem resíduos. Em conjunto com o clã, avaliar os benefícios pessoais, coletivos e ambientais.'
      ],
      variaveis:[
        'Engajar-se em organizações ou projetos que promovam consumo consciente e práticas sustentáveis.',
        'Propor uma ação para reduzir o impacto ambiental em um dos espaços que frequenta, focando em consumo consciente de água e energia e em melhor gerenciamento de resíduos.',
        'Comprometer-se, durante 30 dias, a só comprar o que seja realmente essencial (como comida, medicamentos ou transporte), avaliando ao final do período os benefícios pessoais e para o meio ambiente.',
        'Conhecer organizações que promovam reciclagem, economia circular ou hortas urbanas, entendendo na prática como o consumo consciente é aplicado.',
        'Organizar um evento comunitário para troca de roupas, livros, eletrônicos e outros objetos, reduzindo o consumo e incentivando a economia colaborativa.'
      ],
      ou:'Conquistar a especialidade Agricultura Sustentável ou a Insígnia Reduzir, Reciclar, Reutilizar.' }),
    pioBloco({ name:'Mudanças Climáticas',
      desc:'Compreender os impactos e as causas das mudanças climáticas, buscando soluções para minimizá-las. Liderar ações que promovam a conscientização e a adoção de práticas sustentáveis.',
      fixas:[],
      variaveis:[
        'Organizar, individual ou coletivamente, um projeto que promova práticas sustentáveis, com o objetivo de aumentar a conscientização sobre o assunto, tais como: horta orgânica comunitária, viveiro de mudas, cisterna para água de chuva, aquecedor solar com garrafas PET, separação de resíduos, uso responsável de água e energia, uso de sacolas retornáveis nas compras, plantio de árvores, entre outras.',
        'Participar de cursos, workshops, conferências, eventos sobre sustentabilidade e mudanças climáticas.',
        'Identificar áreas da cidade ou comunidade mais afetadas por fenômenos climáticos e propor soluções de prevenção ou mitigação.',
        'Assistir um documentário, filme ou curta-metragem sobre Mudanças Climáticas e promover debates no seu clã, grupo escoteiro ou comunidade.'
      ],
      ou:'Conquistar a especialidade Sustentabilidade ou a Insígnia Escoteiros pela Energia Solar.' }),
    pioBloco({ name:'Preservação da Biodiversidade',
      desc:'Atuar na preservação da biodiversidade, entendendo as causas e os impactos das ações humanas na sua perda. Implementar estratégias para proteger a vida no planeta.',
      fixas:[],
      variaveis:[
        'Planejar e executar atividades educativas para crianças ou adolescentes sobre a preservação da biodiversidade.',
        'Conhecer órgãos e ONGs de proteção ambiental e engajar-se em ações promovidas por eles.',
        'Atuar como voluntário em uma área de proteção ambiental.',
        'Participar de projetos que coletam dados ambientais, monitoram biodiversidade, qualidade da água ou poluição.',
        'Oferecer habilidades profissionais (marketing, design, finanças, direito) para apoiar projetos ambientais.'
      ],
      ou:'Conquistar ao menos uma das seguintes especialidades ou insígnias: Natureza e Ciências Naturais, Educação Ambiental ou a Insígnia Campeões da Natureza.' }),
    pioBloco({ name:'Vida ao Ar Livre',
      desc:'Usufruir do contato com a natureza e das atividades ao ar livre, adotando práticas conscientes que minimizem seu impacto ao meio ambiente e contribuam para a preservação do equilíbrio ecológico.',
      fixas:[
        'Planejar e executar uma das seguintes opções: acampamento; atividade aventureira; expedição; travessia. A atividade deve considerar os seguintes aspectos: segurança e análise de riscos; campismo de baixo impacto; intenso contato com a natureza; duração mínima de quatro dias.'
      ],
      variaveis:[
        'Colaborar no planejamento e execução de atividades ao ar livre de outras Seções, incentivando o contato com a natureza.'
      ],
      ou:'Conquistar ao menos uma das seguintes especialidades: Esportes de Aventura, Ecoturismo, Habilidades Escoteiras.' })
  ]},
  { name:'Paz e Desenvolvimento', blocos:[
    pioBloco({ name:'Comunidade',
      desc:'',
      fixas:[
        'Participar, sozinho ou em equipe, de pelo menos 15 horas de serviço comunitário com outras instituições.',
        'Capacitar-se em curso promovido por entidades de referência (como a Defesa Civil, Cruz Vermelha, Corpo de Bombeiros…), preparando-se para atuar em crises humanitárias.'
      ],
      variaveis:[
        'Conhecer o trabalho da Defesa Civil local e identificar estratégias de atuação individual ou em equipe, quando necessário.',
        'Organizar e realizar um projeto de desenvolvimento comunitário.',
        'Apresentar o Escotismo para um público não escoteiro.'
      ],
      ou:'Conquistar ao menos uma das seguintes especialidades ou insígnias: Desenvolvimento Comunitário, Ações Humanitárias, Inclusão e Acessibilidade; Escoteiros do Mundo, Mensageiros da Paz, Diálogos pela Paz.' }),
    pioBloco({ name:'Democracia',
      desc:'Participar ativamente de processos democráticos, colaborando na tomada de decisões coletivas e contribuindo para que todos tenham voz, espaço para se expressar e igualdade de oportunidades para participar plenamente.',
      fixas:[
        'Conhecer a Carta Pioneira e participar ativamente da vida democrática do clã.'
      ],
      variaveis:[
        'Participar de Fóruns Regionais e Nacionais de Jovens, Conferências da Juventude e outros espaços de debate sobre o papel da juventude.',
        'Atuar como mesário, presidente de seção ou outro serviço voluntário nas eleições.',
        'Participar de uma Assembleia Regional ou Nacional Escoteira, preferencialmente como delegado de sua UEL ou Região.',
        'Participar de conselhos municipais de juventude ou semelhantes.',
        'Organizar e realizar um Fórum de Grupo Escoteiro ou Fórum de Jovens do Ramo Pioneiro.'
      ],
      ou:'Conquistar ao menos uma das seguintes especialidades: Políticas Públicas, Equidade.' }),
    pioBloco({ name:'Herança Cultural',
      desc:'Valorizar e compartilhar a herança cultural de sua comunidade e do seu país. Reconhecer e respeitar os saberes e tradições dos povos originários, promovendo sua importância na sociedade atual.',
      fixas:[],
      variaveis:[
        'Organizar uma atividade sobre herança cultural em uma cidade, centro ou bairro histórico, desenvolvendo uma ação sobre diversidade cultural, preservação de tradições ou o impacto da globalização na cultura.',
        'Colaborar com coletivos, associações ou projetos que atuem pela preservação de línguas, danças, festas populares ou saberes tradicionais.'
      ],
      ou:'Conquistar a especialidade Cultura e Arte.' }),
    pioBloco({ name:'Promoção da Paz',
      desc:'Promover ações inclusivas, respeitando as diferenças e incentivando o diálogo empático entre as pessoas, independentemente de crença, etnia ou cultura, de modo a construir um ambiente de compreensão e respeito mútuo.',
      fixas:[
        'Realizar um serviço voluntário de pelo menos trinta horas, contribuindo para resolver um problema relacionado à atual agenda global de desenvolvimento.'
      ],
      variaveis:[
        'Organizar e coordenar uma vigília sobre respeito às diferenças e superação de preconceitos, proporcionando um espaço de união e diálogo, de inclusão e de reconhecimento da diversidade como uma força que enriquece a humanidade.',
        'Organizar uma iniciativa – oficina, diálogo guiado, atividade colaborativa – para trabalhar o desenvolvimento de habilidades em comunicação não violenta, mediação e resolução pacífica de conflitos.'
      ],
      ou:'Conquistar ao menos uma das seguintes especialidades ou insígnias: Direitos Humanos, Inclusão e Acessibilidade, Diversidade; Insígnia da Lusofonia, Insígnia do Cone Sul.' }),
    pioBloco({ name:'Valores',
      desc:'Alinhar suas ações aos seus valores pessoais e aos princípios do Movimento Escoteiro, vivenciando a Promessa e a Lei Escoteira de forma autêntica, incorporando-os em cada escolha do dia a dia, sendo um exemplo de compromisso com a construção de um mundo melhor.',
      fixas:[
        'Avaliar sua vivência sobre a Promessa e a Lei Escoteira e realizar a Investidura Pioneira.'
      ],
      variaveis:[
        'Elaborar um projeto ou ação inspirada em um artigo da Lei Escoteira, avaliando em equipe como seu desenvolvimento refletiu os valores do Movimento.',
        'Participar de estudos de caso que apresentem dilemas éticos do cotidiano e propor soluções coerentes com a Promessa e a Lei Escoteira.'
      ] })
  ]},
  { name:'Saúde e Bem-estar', blocos:[
    pioBloco({ name:'Cuidado com o Corpo',
      desc:'Responsabilizar-se pelo cuidado com seu corpo, reconhecendo suas capacidades, enfrentando desafios e respeitando seus limites. Expressar sua sexualidade com autorrespeito e respeito ao próximo, valorizando a diversidade e a individualidade.',
      fixas:[
        'Participar de uma capacitação em primeiros socorros, aplicando os aprendizados em simulações práticas.',
        'Participar de uma capacitação em respostas a desastres, aplicando os aprendizados em simulações práticas.'
      ],
      variaveis:[
        'Convidar profissional de saúde para organizar e participar de um curso de primeiros socorros no grupo escoteiro ou na comunidade.',
        'Realizar atividades físicas desafiadoras (trilhas, escaladas, corridas), avaliando capacidades, superações e limites individuais.',
        'Participar de oficinas ou rodas de conversa sobre saúde física, sexualidade e diversidade, conduzidas por profissionais ou especialistas convidados.'
      ],
      ou:'Conquistar a especialidade Saúde.' }),
    pioBloco({ name:'Espiritualidade',
      desc:'Buscar compreender e vivenciar sua espiritualidade, encontrando sentido para sua vida por meio de suas crenças e valores. Procurar agir com coerência, incorporando seus valores de forma contínua nas escolhas do cotidiano e na sua atuação na comunidade.',
      fixas:[
        'Integrar ao Projeto de Vida compromissos espirituais e éticos, avaliando periodicamente sua coerência com atitudes cotidianas.'
      ],
      variaveis:[
        'Liderar ações que promovam o diálogo inter-religioso e a valorização das diferentes expressões de fé na comunidade, incentivando o respeito, a empatia e a convivência pacífica.',
        'Promover ou colaborar em ações de serviço em espaços religiosos diversos.'
      ],
      ou:'Conquistar a Insígnia Diálogo Inter-religioso.' }),
    pioBloco({ name:'Hábitos Saudáveis',
      desc:'Cuidar do próprio bem-estar, adotando uma rotina de autocuidado que inclua a prática regular de atividades físicas, uma alimentação equilibrada e a manutenção da higiene pessoal e do ambiente ao seu redor.',
      fixas:[
        'Implementar, em sua comunidade, iniciativas que abordem um dos seguintes temas: alimentação saudável; atividades físicas; higiene.'
      ],
      variaveis:[
        'Organizar oficina culinária saudável, explorando receitas equilibradas e sustentáveis para aplicar em acampamentos ou no dia a dia.',
        'Desenvolver uma campanha de conscientização sobre higiene pessoal e coletiva.'
      ],
      ou:'Conquistar ao menos uma das seguintes especialidades: Esportes, Educação Alimentar e Nutricional.' }),
    pioBloco({ name:'Saúde Mental',
      desc:'Manter hábitos que promovam o equilíbrio da saúde mental, adotando estratégias que favoreçam o bem-estar próprio e coletivo, contribuindo para a construção de ambientes mais saudáveis, empáticos e acolhedores.',
      fixas:[
        'Participar de capacitação em primeiros socorros em saúde mental, praticando técnicas de escuta qualificada, apoio inicial e encaminhamento responsável em situações de crise.'
      ],
      variaveis:[
        'Participar de ações e iniciativas em conjunto com especialistas ou organizações voltadas a esta temática.',
        'Organizar atividade para outras seções, clã ou a comunidade sobre a importância da gestão do tempo, incluindo os impactos negativos do uso excessivo de tecnologias e redes sociais, além de destacar práticas de bem-estar que favorecem o equilíbrio emocional e a saúde mental, como meditação, exercícios físicos, momentos de lazer offline e conexões interpessoais saudáveis.'
      ],
      ou:'Conquistar ao menos uma das seguintes especialidades: Saúde Mental e Bem-estar Emocional, Hobbies e Lazer.' }),
    pioBloco({ name:'Vínculos Saudáveis',
      desc:'Construir vínculos saudáveis e relações interpessoais baseadas na empatia, no respeito e no crescimento mútuo, promovendo um ambiente positivo e acolhedor para todos.',
      fixas:[
        'Participar de momentos regulares de celebração e confraternização no clã (Fogos de Conselho, encontros culturais, atividades de partilha), fortalecendo os vínculos afetivos.',
        'Praticar escuta ativa e feedback construtivo nas atividades do clã, fortalecendo a cooperação e o respeito mútuo.'
      ],
      variaveis:[
        'Conhecer o Estatuto da Juventude, especialmente quanto ao Direito à Saúde, e organizar visita solidária a uma instituição que atue nessa área. Durante a visita, desenvolver ações que contribuam para o bem-estar dos atendidos, gerando impacto social positivo.'
      ],
      ou:'Conquistar a especialidade Saúde Sexual e Reprodutiva.' })
  ]}
];

const PIONEIRO_ESPECIALIDADES = [
  ['Habilidades para a Vida', 'Educação; Idiomas; Empreendedorismo e Negócios; Finanças e Economia; Liderança e Gestão; Viagens; Comunicações'],
  ['Meio Ambiente', 'Agricultura Sustentável; Sustentabilidade; Natureza e Ciências Naturais; Educação Ambiental; Esportes de Aventura; Ecoturismo; Habilidades Escoteiras'],
  ['Paz e Desenvolvimento', 'Desenvolvimento Comunitário; Ações Humanitárias; Inclusão e Acessibilidade; Políticas Públicas; Equidade; Cultura e Arte; Direitos Humanos; Diversidade'],
  ['Saúde e Bem-estar', 'Saúde; Esportes; Educação Alimentar e Nutricional; Saúde Mental e Bem-estar Emocional; Hobbies e Lazer; Saúde Sexual e Reprodutiva']
];
const PIONEIRO_INSIGNIAS = [
  ['Habilidades para a Vida', 'Insígnia do Aprender; Insígnia Inovadores de Impacto'],
  ['Meio Ambiente', 'Insígnia Reduzir, Reciclar, Reutilizar; Insígnia Escoteiros pela Energia Solar; Insígnia Campeões da Natureza'],
  ['Paz e Desenvolvimento', 'Reconhecimento Escoteiros do Mundo; Insígnia Mensageiros da Paz; Diálogos pela Paz; Insígnia da Lusofonia; Insígnia do Cone Sul'],
  ['Saúde e Bem-estar', 'Insígnia Diálogo Inter-religioso']
];

const DATA_PIONEIRO = buildRamoData('pio', [], PIONEIRO_EIXOS);
const SPECIALTIES_PIONEIRO = buildRamoCatalog('pio-sp', PIONEIRO_ESPECIALIDADES).map(a=> ({ id:a.id, name:a.name, especialidades:a.items }));
const INSIGNIAS_PIONEIRO = buildRamoCatalog('pio-in', PIONEIRO_INSIGNIAS);
