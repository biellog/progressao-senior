// Conteúdo da Progressão — Ramo Sênior 2026 (eixos, blocos, itens e especialidades)
const DATA = [
  {
    id: "acolhida",
    eixo: true,
    name: "Período de Acolhida",
    sub: "(Antigo \"Período Introdutório\")",
    flat: true,
    blocos: [{ id:"acolhida-b", items: [
      { id:"ac-1", text:"Participar das atividades com sua patrulha e com a tropa, conhecendo suas estruturas e seu funcionamento." },
      { id:"ac-2", text:"Utilizar o lenço escoteiro sabendo o seu significado e conhecer a história da sua UEL (Unidade Escoteira Local) e do Escotismo." },
      { id:"ac-3", text:"Reconhecer e responder aos apitos e sinais manuais próprios do ramo." },
      { id:"ac-4", text:"Fazer parte de uma patrulha, participar do seu grito, usar suas cores e símbolos, utilizar o distintivo de patrulha, saber quem é seu monitor e desempenhar um encargo." },
      { id:"ac-5", text:"Entender e usar o lema do escoteiro, o sinal, a saudação e o aperto de mão." },
      { id:"ac-6", text:"Saber quais são e como conquistar os distintivos do Ramo Sênior e conhecer o uniforme ou vestuário escoteiro usado na tropa." },
      { id:"ac-7", text:"Conhecer a Lei e Promessa Escoteira, sendo capaz de explicar para o seu monitor e para um escotista a sua importância e valores. Sentir-se pronto para assumir esse compromisso." }
    ]}]
  },
  {
    id: "eixo1", eixo:true, num:"Eixo 1", name:"Habilidades para a Vida",
    blocos: [
      { id:"e1b1", name:"Bloco 1 — Aprendizagem contínua e desenvolvimento vocacional",
        desc:"Conhecer diferentes temas, planejar estratégias para aprender de maneira eficaz e utilizar novos conceitos e recursos para melhorar seus resultados. Aprofundar seus conhecimentos em áreas de interesse, descobrindo e explorando sua vocação.",
        fixas:[
          {id:"e1b1f1", text:"Conquistar, no Ramo Sênior, uma especialidade sobre um tema de seu interesse e que seja um conhecimento novo."},
          {id:"e1b1f2", tag:"mar", text:"Organizar e realizar, com a patrulha, uma visita a um porto, marina ou iate clube, conhecendo seu funcionamento, tipos de embarcações e sinalizações de tráfego."},
          {id:"e1b1f3", tag:"ar", text:"Organizar e realizar, com a patrulha, uma visita a um aeroporto ou aeroclube, identificando tipos de aeronaves, procedimentos de pouso e decolagem, e sinalização de pista."}
        ],
        varLabel:"Realizar três ações dentre as listadas a seguir",
        variaveis:[
          {id:"e1b1v1", text:"Explorar diferentes áreas profissionais participando de uma Feira de Profissões ou entrevistando profissionais da área de interesse, investigando os caminhos percorridos, os desafios enfrentados e as motivações que os levaram à escolha da carreira."},
          {id:"e1b1v2", text:"Engajar-se em atividades voluntárias ou estágios em instituições que despertem interesse, permitindo a vivência prática, o desenvolvimento de habilidades e a compreensão do ambiente profissional e comunitário."},
          {id:"e1b1v3", text:"Participar de palestras, workshops ou vivências voltadas à orientação vocacional, planejamento de carreira e desenvolvimento pessoal, explorando ferramentas que ajudem na identificação de talentos, interesses e estratégias para o futuro profissional."},
          {id:"e1b1v4", text:"Organizar uma atividade para a patrulha ou tropa voltada para escolha vocacional."},
          {id:"e1b1v5", text:"Organizar, para sua tropa ou patrulha, uma oficina, curso ou palestra sobre um tema de seu interesse."},
          {id:"e1b1v6", text:"Participar de feiras, mostras ou eventos escolares/científicos, fora do Movimento Escoteiro, apresentando trabalhos ou projetos desenvolvidos."}
        ],
        ou:{id:"e1b1ou", text:"Conquistar ao menos uma das seguintes especialidades ou insígnias: Especialidades de Gastronomia, Tecnologia, Educação, Idiomas; ou Insígnia do Aprender, Insígnia da Modalidade do Mar (Naval), Insígnia da Modalidade do Ar (Aeronauta)."}
      },
      { id:"e1b2", name:"Bloco 2 — Autonomia e Liderança",
        desc:"Assumir responsabilidades dentro de sua patrulha ou equipe de interesse, trabalhando junto aos colegas para alcançar objetivos. Organizar e administrar recursos para seus projetos, definir um orçamento e executar ações para cumpri-lo. Planejar, realizar e avaliar atividades individuais e coletivas, tomando decisões com consciência e responsabilidade.",
        fixas:[
          {id:"e1b2f1", text:"Conhecer o material individual e de patrulha necessário para diferentes tipos de excursões (acampamento, acantonamento, volante, fixo) e saber organizá-lo na mochila."},
          {id:"e1b2f2", tag:"mar", text:"Construir e navegar com sua patrulha ou equipe de interesse em embarcação a vela ou remo, identificando as partes (proa, popa, bombordo, boreste), utilizando o colete salva-vidas e seguindo as regras de segurança."}
        ],
        varLabel:"Realizar quatro ações dentre as listadas a seguir",
        variaveis:[
          {id:"e1b2v1", text:"Participar ativamente do planejamento, da execução e da avaliação de atividades da patrulha, tropa ou equipe de interesse, sendo bem avaliado pelos companheiros e escotistas."},
          {id:"e1b2v2", text:"Desenvolver o planejamento orçamentário de uma atividade de patrulha, equipe de interesse ou tropa."},
          {id:"e1b2v3", text:"Utilizar transporte coletivo urbano para uma atividade externa de patrulha."},
          {id:"e1b2v4", text:"Implementar uma estratégia, incluindo a parte financeira, para alcançar uma meta pessoal, compartilhando sua experiência com sua patrulha."},
          {id:"e1b2v5", text:"Planejar e executar um projeto de captação de recursos para participação em uma atividade escoteira ou realização de um projeto pessoal."},
          {id:"e1b2v6", text:"Assumir e desempenhar diferentes encargos na patrulha, sendo bem avaliado pela sua patrulha."},
          {id:"e1b2v7", text:"Planejar e conduzir um grande jogo para a tropa, com apoio da patrulha ou equipe de interesse."}
        ],
        ou:{id:"e1b2ou", text:"Conquistar ao menos uma das seguintes especialidades: Empreendedorismo e negócios, Finanças e economia, Liderança e gestão, Viagens."}
      },
      { id:"e1b3", name:"Bloco 3 — Criatividade e Inovação",
        desc:"Expressar suas ideias, talentos e criatividade por meio da arte, da escrita, da música ou de outras formas de criação. Buscar inovar em seus projetos e iniciativas, explorando novas possibilidades além daquilo que já está acostumado a fazer.",
        fixas:[
          {id:"e1b3f1", text:"Durante um acampamento, planejar e executar pioneirias inovadoras de médio ou grande porte."},
          {id:"e1b3f2", tag:"ar", text:"Organizar um torneio aéreo com categorias como avião de papel, pipa, planador e foguete."}
        ],
        varLabel:"Realizar três ações dentre as listadas a seguir",
        variaveis:[
          {id:"e1b3v1", text:"Organizar e conduzir um Fogo de Conselho ou show de talentos para a tropa, UEL ou comunidade."},
          {id:"e1b3v2", text:"Organizar uma noite cultural para sua patrulha ou tropa."},
          {id:"e1b3v3", text:"Produzir um curta metragem ou vídeo criativo sobre Escotismo."},
          {id:"e1b3v4", text:"Organizar uma apresentação artística ou cultural voltada à comunidade."},
          {id:"e1b3v5", text:"Planejar e realizar mostra sobre um tema de seu interesse, produzindo e curando registros (fotos, vídeos, áudios, textos e objetos) para apresentação à tropa ou comunidade."},
          {id:"e1b3v6", text:"Participar de concursos culturais, literários ou artísticos locais, representando a tropa."},
          {id:"e1b3v7", tag:"ar", text:"Construir uma versão simplificada de 1 (um) \"horizonte artificial\" funcional, que permita visualizar a inclinação do instrumento em 2 (dois) eixos (arfagem e rolagem)."}
        ],
        ou:{id:"e1b3ou", text:"Conquistar a especialidade de Comunicações ou a Insígnia Inovadores de Impacto."}
      },
      { id:"e1b4", name:"Bloco 4 — Inteligência Emocional",
        desc:"Reconhecer e lidar com seus sentimentos, respeitando suas próprias emoções, expressando-se de forma equilibrada e assertiva.",
        fixas:[
          {id:"e1b4f1", text:"Durante as atividades, reconhecer situações que comprometam a integridade física ou emocional, sabendo como agir e a quem recorrer, mantendo-se calmo e em segurança."},
          {id:"e1b4f2", text:"Praticar feedback construtivo durante as atividades, expressando opiniões de forma assertiva e respeitosa."}
        ],
        varLabel:"Realizar quatro ações dentre as listadas a seguir",
        variaveis:[
          {id:"e1b4v1", text:"Identificar as mudanças de emoção repentinas, equilibrando as decisões e reações, buscando agir de maneira respeitosa."},
          {id:"e1b4v2", text:"Envolver-se em atividades aventureiras com segurança, conhecendo seus limites e enfrentando seus medos."},
          {id:"e1b4v3", text:"Identificar as situações que causam estresse ou desconforto e as formas e ferramentas de solucioná-las, respeitando seus limites."},
          {id:"e1b4v4", text:"Negociar responsabilidades familiares e pessoais de forma respeitosa e madura."},
          {id:"e1b4v5", text:"Conduzir dinâmicas de confiança e cooperação que envolvam lidar com frustrações e celebrar conquistas coletivas."}
        ]
      }
    ]
  },
  {
    id:"eixo2", eixo:true, num:"Eixo 2", name:"Meio Ambiente",
    blocos:[
      { id:"e2b1", name:"Bloco 1 — Consumo Responsável",
        desc:"Compreender como o consumo responsável influencia o futuro do planeta e adotar hábitos que ajudam a garantir recursos para as próximas gerações.",
        varLabel:"Realizar quatro ações dentre as listadas a seguir",
        variaveis:[
          {id:"e2b1v1", text:"Liderar a separação de resíduos recicláveis e orgânicos em uma festa da UEL, comunidade ou eventos regionais e nacionais."},
          {id:"e2b1v2", text:"Visitar uma estação de tratamento de esgoto, aterro sanitário ou cooperativa de reciclagem e discutir as questões ambientais e de consumo."},
          {id:"e2b1v3", text:"Desenvolver um projeto individual ou coletivo sobre o descarte correto de materiais eletrônicos na UEL, comunidade ou escola."},
          {id:"e2b1v4", text:"Organizar pelo menos uma oficina, debate ou workshop para a seção sobre um dos seguintes temas: Cruelty-free (produtos livres de exploração animal); Vegetarianismo e Veganismo; Upcycling (reaproveitamento de itens descartados); Obsolescência Programada e Perceptiva; Microplástico."},
          {id:"e2b1v5", text:"Em um acampamento, executar uma receita com cascas, talos ou sobras."},
          {id:"e2b1v6", text:"Organizar um brechó beneficente ou feira de trocas em sua UEL ou comunidade."},
          {id:"e2b1v7", text:"Participar de visita a cooperativa de reciclagem ou projeto comunitário ligado à economia circular."}
        ],
        ou:{id:"e2b1ou", text:"Conquistar a especialidade de Agricultura Sustentável ou a Insígnia Reduzir, Reciclar, Reutilizar."}
      },
      { id:"e2b2", name:"Bloco 2 — Mudanças Climáticas",
        desc:"Propor e organizar atividades e projetos para reduzir os impactos ambientais e combater as mudanças climáticas. Incentivar práticas sustentáveis no dia a dia e mobilizar outros para agir pelo meio ambiente.",
        varLabel:"Realizar quatro ações dentre as listadas a seguir",
        variaveis:[
          {id:"e2b2v1", text:"Utilizar ferramentas de acompanhamento meteorológico para o planejamento de atividades ao ar livre."},
          {id:"e2b2v2", text:"Desenvolver iniciativas ou projetos sobre mudanças climáticas e soluções sustentáveis."},
          {id:"e2b2v3", text:"Organizar, com sua patrulha, uma atividade ecológica em área urbana, identificando problemas ambientais da localidade e apontando suas causas e possíveis soluções."},
          {id:"e2b2v4", text:"Participar de clubes ou projetos voltados para sustentabilidade e mudanças climáticas."},
          {id:"e2b2v5", text:"Utilizar e promover o uso do transporte coletivo, bicicleta ou caminhada em uma atividade escoteira e utilizar um meio de transporte alternativo de fonte de energia renovável."},
          {id:"e2b2v6", text:"Planejar e executar, em patrulha ou equipe de interesse, um projeto comunitário de reaproveitamento de recursos naturais ou de uso de energias renováveis."}
        ],
        ou:{id:"e2b2ou", text:"Conquistar a especialidade de Sustentabilidade ou a Insígnia Escoteiros pela Energia Solar."}
      },
      { id:"e2b3", name:"Bloco 3 — Preservação da Biodiversidade",
        desc:"Identificar os impactos das ações humanas na biodiversidade e atuar para proteger os ecossistemas, promovendo a preservação da fauna e flora.",
        fixas:[
          {id:"e2b3f1", text:"Participar de uma atividade em uma Área de Proteção Ambiental, reconhecendo fauna, flora e bioma local, identificando riscos e propondo soluções para preservação."},
          {id:"e2b3f2", tag:"mar", text:"Conhecer o bioma aquático local, seus riscos e a importância de sua preservação."},
          {id:"e2b3f3", tag:"ar", text:"Participar de uma atividade de observação de aves da região, identificando seus hábitos e a relação com os diferentes métodos de voo e aerodinâmica."}
        ],
        varLabel:"Realizar duas ações dentre as listadas a seguir",
        variaveis:[
          {id:"e2b3v1", text:"Participar de eventos sobre preservação da biodiversidade organizados por ONGs, escolas ou parques naturais."},
          {id:"e2b3v2", text:"Colaborar em um projeto ou ação promovido por alguma ONG ambiental."},
          {id:"e2b3v3", text:"Coletar e registrar dados sobre espécies locais, qualidade da água ou vegetação."},
          {id:"e2b3v4", text:"Organizar um projeto individual ou coletivo sobre um dos seguintes temas: abrigos de animais silvestres, enriquecimento ambiental, reintegração de animais ou outra iniciativa de preservação da fauna."},
          {id:"e2b3v5", text:"Organizar o plantio de árvores nativas em parceria com órgãos ambientais ou ONGs."},
          {id:"e2b3v6", text:"Conduzir uma campanha de conscientização sobre preservação da fauna e flora em praças, escolas ou redes sociais da comunidade."},
          {id:"e2b3v7", text:"Promover palestras ou oficinas abertas à comunidade sobre redução de impactos ambientais e proteção da biodiversidade."}
        ],
        ou:{id:"e2b3ou", text:"Conquistar a especialidade de Natureza e Ciências Naturais ou Educação Ambiental ou a Insígnia Campeões da Natureza."}
      },
      { id:"e2b4", name:"Bloco 4 — Vida ao Ar Livre",
        desc:"Aproveitar ao máximo as atividades ao ar livre e sua conexão com a natureza, sempre cuidando do ambiente e reduzindo seu impacto sobre ele.",
        fixas:[
          {id:"e2b4f1", text:"Montar o campo de patrulha com pioneirias como mesa, canto do lenhador e pórtico, utilizando amarras adequadas."},
          {id:"e2b4f2", text:"Aplicar os seguintes nós: direito, correr, lais de guia, volta do fiel, nó em oito, balso pelo seio, catau, volta do salteador e boca de lobo durante um acampamento de tropa ou patrulha, conhecendo suas funcionalidades."},
          {id:"e2b4f3", text:"Escolher corretamente o local para montagem da barraca, incluindo técnicas de montagem, desmontagem e acondicionamento durante um acampamento de tropa ou patrulha."},
          {id:"e2b4f4", text:"Manusear corretamente ferramentas de corte e sapa, zelando pela segurança e realizando reparos, durante um acampamento de tropa ou patrulha."},
          {id:"e2b4f5", text:"Preparar e executar pelo menos três tipos de fogueiras, utilizando-as para preparar uma refeição mateira e zelando pela segurança, em um acampamento de tropa ou patrulha."},
          {id:"e2b4f6", text:"Planejar e realizar ao menos uma excursão de patrulha em um ambiente natural."},
          {id:"e2b4f7", text:"Planejar e realizar ao menos um acampamento de patrulha com técnicas de campismo de baixo impacto."},
          {id:"e2b4f8", text:"Em atividade ao ar livre, orientar-se utilizando carta topográfica ou náutica e bússola, e utilizar métodos naturais e tecnológicos de orientação."},
          {id:"e2b4f9", tag:"mar", text:"Utilizar nós de modalidade do mar, como lais de guia, nó de cunho, pinha de retinida e nó de defesa."}
        ],
        varLabel:"Realizar cinco ações dentre as listadas a seguir",
        variaveis:[
          {id:"e2b4v1", text:"Participar de um acampamento volante."},
          {id:"e2b4v2", text:"Selecionar corretamente os materiais de campo para um acampamento de patrulha."},
          {id:"e2b4v3", text:"Em conjunto com a sua patrulha, planejar e construir pelo menos uma das seguintes pioneirias: barraca suspensa, torre de observação ou ponte."},
          {id:"e2b4v4", text:"Demonstrar conhecimento sobre processos de ancoragem e estiramento de cabos."},
          {id:"e2b4v5", text:"Utilizar diferentes formas de acondicionamento de alimentos e técnicas de purificação de água em um acampamento."},
          {id:"e2b4v6", text:"Durante um acampamento de patrulha ou tropa, pernoitar em um abrigo natural."},
          {id:"e2b4v7", text:"Durante uma atividade aventureira, pernoitar uma noite em bivaque, abrigo natural ou ao relento."},
          {id:"e2b4v8", text:"Participar de atividades como rafting, canoagem, rapel, espeleologia, escalada, trekking ou mountain bike."},
          {id:"e2b4v9", text:"Participar de atividades aquáticas de exploração de corpos d'água naturais, respeitando os padrões de segurança."},
          {id:"e2b4v10", text:"Participar de um acampamento organizado pela patrulha ou tropa de média (3 a 5 dias) ou longa (6 a 10 dias) duração."}
        ],
        ou:{id:"e2b4ou", text:"Conquistar ao menos uma das seguintes especialidades: Esportes de Aventura, Ecoturismo, Habilidades Escoteiras."}
      }
    ]
  },
  {
    id:"eixo3", eixo:true, num:"Eixo 3", name:"Paz e Desenvolvimento",
    blocos:[
      { id:"e3b1", name:"Bloco 1 — Comunidade",
        desc:"Planejar e coordenar projetos que geram impacto positivo na comunidade, dialogando com outras instituições, e promover ações concretas para o bem comum.",
        fixas:[
          {id:"e3b1f1", text:"Participar, sozinho, em patrulha ou equipe, de pelo menos 10 horas de ação comunitária com outras instituições locais."},
          {id:"e3b1f2", text:"Capacitar-se em curso promovido por entidades de referência (defesa civil, cruz vermelha, corpo de bombeiros etc.) e estar preparado para atuar em crises humanitárias."}
        ],
        varLabel:"Realizar duas ações dentre as listadas a seguir",
        variaveis:[
          {id:"e3b1v1", text:"Identificar os riscos de desastres naturais na comunidade, conhecer protocolos de segurança e atuar de acordo com eles."},
          {id:"e3b1v2", text:"Planejar uma atividade comunitária, como limpeza de praça, visita a uma instituição sem fins lucrativos ou revitalização de uma creche infantil ou lar de repouso de idosos, ou similar."},
          {id:"e3b1v3", text:"Criar uma biblioteca comunitária móvel com livros doados."},
          {id:"e3b1v4", text:"Organizar uma campanha de arrecadação (alimentos, roupas, livros) envolvendo diferentes setores da comunidade."},
          {id:"e3b1v5", text:"Representar a tropa em fóruns, conselhos ou encontros comunitários, contribuindo com ideias e propostas."},
          {id:"e3b1v6", text:"Promover ações de educação ambiental, saúde ou cidadania em parceria com outras instituições."}
        ],
        ou:{id:"e3b1ou", text:"Conquistar ao menos uma das seguintes especialidades ou insígnias: Especialidade de Desenvolvimento Comunitário, Ações Humanitárias, Inclusão e Acessibilidade, Insígnia do Desafio Comunitário, Insígnia Mensageiros da Paz, Insígnia/Reconhecimento \"Escoteiros do Mundo\"."}
      },
      { id:"e3b2", name:"Bloco 2 — Democracia",
        desc:"Participar ativamente da democracia, engajando-se em debates, contribuindo na tomada de decisões e ajudando a construir soluções coletivas para desafios sociais.",
        fixas:[
          {id:"e3b2f1", text:"Participar ativamente das decisões do Conselho de Patrulha, contribuindo com ideias, votando e assumindo responsabilidades, respeitando os resultados."},
          {id:"e3b2f2", text:"Participar ativamente das decisões da Assembleia de Tropa, contribuindo com ideias, votando e assumindo responsabilidades, respeitando os resultados."},
          {id:"e3b2f3", text:"Participar da eleição do monitor da patrulha e das decisões dos encargos respeitando os resultados."}
        ],
        varLabel:"Realizar quatro ações dentre as listadas a seguir",
        variaveis:[
          {id:"e3b2v1", text:"Participar de Audiência Pública e consultas populares de temas de seu interesse promovidas pelo poder legislativo."},
          {id:"e3b2v2", text:"Emitir o título de eleitor, compreendendo a importância dos processos democráticos do país e, em ano eleitoral, pesquisar sobre os candidatos e suas propostas."},
          {id:"e3b2v3", text:"Planejar e executar uma campanha para educar outros jovens sobre temas como voto consciente e direitos do cidadão."},
          {id:"e3b2v4", text:"Participar de ao menos uma Assembleia do Grupo Escoteiro."},
          {id:"e3b2v5", text:"Participar ativamente de um Fórum de Grupo Escoteiro."},
          {id:"e3b2v6", text:"Participar de grêmio estudantil ou conferências de juventude."},
          {id:"e3b2v7", text:"Participar de pelo menos uma atividade da seção, como debates, estudos de caso ou \"júri simulado\", de forma respeitosa e contributiva."},
          {id:"e3b2v8", text:"Participar de dinâmicas de mediação de conflitos, praticando a escuta ativa e construção de consensos."}
        ],
        ou:{id:"e3b2ou", text:"Conquistar ao menos uma das seguintes especialidades: Equidade, Políticas Públicas."}
      },
      { id:"e3b3", name:"Bloco 3 — Herança Cultural",
        desc:"Compartilhar a herança cultural de sua comunidade e do seu país, organizando atividades e projetos que valorizam a história, os costumes e os saberes ancestrais dos povos originários brasileiros.",
        fixas:[
          {id:"e3b3f1", text:"Conduzir a cerimônia de abertura de uma atividade de patrulha ou tropa."},
          {id:"e3b3f2", tag:"mar", text:"Participar corretamente do cerimonial de hastear e arriar a Bandeira Nacional, tocando o apito marinheiro."}
        ],
        varLabel:"Realizar cinco ações dentre as listadas a seguir",
        variaveis:[
          {id:"e3b3v1", text:"Organizar com sua patrulha uma expedição que promova o contato com culturas como Povos originários, Comunidades quilombolas, Comunidades ribeirinhas ou caiçaras, abordando língua, costumes, festividades e tradições, e debater formas de valorizar e preservar essas culturas."},
          {id:"e3b3v2", text:"Organizar a recepção de membros do Movimento Escoteiro de outras localidades e apresentá-los aos principais pontos históricos e turísticos de seu município."},
          {id:"e3b3v3", text:"Fazer tour em sua cidade, explorando pontos históricos e culturais como: Centro cultural, Biblioteca pública, Mercado municipal, Feiras típicas, Museus ou Marcos históricos, entre outros."},
          {id:"e3b3v4", text:"Identificar os núcleos culturais de sua região e participar de atividades com eles (ex.: centro de tradições gaúchas, núcleos israelitas, associações de colônias imigrantes)."},
          {id:"e3b3v5", text:"Apresentar uma forma de expressão artística da cultura popular brasileira em um Fogo de Conselho."},
          {id:"e3b3v6", text:"Promover um festival com música, poesia, dança e literatura típicas de uma região para seu grupo escoteiro ou comunidade."},
          {id:"e3b3v7", text:"Produzir, com sua patrulha, uma peça para uso cotidiano, utilizando técnicas de artesanato brasileiro."},
          {id:"e3b3v8", text:"Apresentar a cultura da sua cidade em um evento regional, nacional ou internacional, como feira das cidades ou noite folclórica."}
        ],
        ou:{id:"e3b3ou", text:"Conquistar a especialidade de Cultura e Arte."}
      },
      { id:"e3b4", name:"Bloco 4 — Promoção da Paz",
        desc:"Desenvolver projetos que promovem a paz, o respeito à diversidade, o diálogo entre diferentes culturas e crenças, reconhecendo e valorizando a pluralidade da humanidade.",
        fixas:[
          {id:"e3b4f1", text:"Participar de uma ação colaborativa sobre diferentes temas que envolvem a cultura de paz, tais como Direitos Humanos, Diálogo Inter-religioso, Refugiados e Imigrantes, Diversidades ou Inclusão."}
        ],
        varLabel:"Realizar cinco ações dentre as listadas a seguir",
        variaveis:[
          {id:"e3b4v1", text:"Organizar uma mesa redonda para outros jovens da comunidade sobre temas como Idolatria, Torcidas organizadas, Tribos urbanas, Intolerância religiosa ou Xenofobia."},
          {id:"e3b4v2", text:"Participar de atividades que promovam a paz e compreensão entre as pessoas."},
          {id:"e3b4v3", text:"Participar com a patrulha ou equipe de interesse de uma atividade inter-religiosa, conhecendo diferentes tradições de fé, dialogando sobre valores comuns e refletindo sobre respeito e diversidade espiritual."},
          {id:"e3b4v4", text:"Participar de uma simulação das Nações Unidas em que os participantes representam diferentes países e debatem questões globais sobre direitos humanos, como a igualdade de gênero, a crise dos refugiados e a proteção ambiental."},
          {id:"e3b4v5", text:"Organizar e realizar uma atividade com outra unidade escoteira e refletir o significado da fraternidade mundial escoteira."},
          {id:"e3b4v6", text:"Organizar um \"Jantar Internacional\" com sua patrulha ou equipe de interesse, apresentando culinária, trajes, músicas e informações sobre o Escotismo de diferentes países."},
          {id:"e3b4v7", text:"Participar com a patrulha, tropa ou equipe de interesse de um dia de atividades e jogos e/ou uma atividade de solidariedade com um grupo de jovens na comunidade em uma igreja, mesquita, sinagoga, templo etc."},
          {id:"e3b4v8", text:"Desenvolver um momento inter-religioso na sua seção, grupo escoteiro ou comunidade."}
        ],
        ou:{id:"e3b4ou", text:"Conquistar ao menos uma das seguintes especialidades ou insígnias: Especialidades de Ciências Humanas, Direitos Humanos, Diversidades, Fé, Crenças e Diálogo Inter-religioso; ou Insígnia da Lusofonia, Insígnia do Cone Sul, Diálogos pela Paz."}
      },
      { id:"e3b5", name:"Bloco 5 — Valores",
        desc:"Alinhar suas atitudes aos seus valores pessoais e aos princípios do Movimento Escoteiro, vivendo a Promessa e a Lei Escoteira de forma consciente e coerente.",
        fixas:[
          {id:"e3b5f1", text:"Avaliar com seus pares a vivência da Promessa e da Lei Escoteira e realizar o Compromisso Sênior."}
        ],
        varLabel:"Realizar duas ações dentre as listadas a seguir",
        variaveis:[
          {id:"e3b5v1", text:"Participar da avaliação da sua Progressão Pessoal e dos companheiros em patrulha."},
          {id:"e3b5v2", text:"Explicar o significado da Lei e da Promessa Escoteiras aos novos membros da patrulha."},
          {id:"e3b5v3", text:"Auxiliar um companheiro de patrulha a realizar seu Compromisso Sênior."},
          {id:"e3b5v4", text:"Participar de um debate de casos reais de notícias ou situações sociais, analisando-os à luz dos valores escoteiros."}
        ]
      }
    ]
  },
  {
    id:"eixo4", eixo:true, num:"Eixo 4", name:"Saúde e Bem-estar",
    blocos:[
      { id:"e4b1", name:"Bloco 1 — Cuidado com o Corpo",
        desc:"Reconhecer e valorizar suas habilidades físicas, se desafiar a superar limitações e cuidar da própria saúde com respeito ao seu corpo. Valorizar e respeitar a diversidade humana.",
        fixas:[
          {id:"e4b1f1", text:"Capacitar-se para atuar em primeiros socorros: atendimento a pequenos cortes, contusões e escoriações; avaliação de pressão arterial, pulso e temperatura; queimaduras, insolação, hipotermia e desidratação; picadas de animais peçonhentos; hemorragias externas e internas; imobilização de fraturas, entorses, controle cervical e traumatismo craniano; crises convulsivas, estados de choque e intoxicação; sinais de infarto ou AVC; engasgos e choque elétrico; RCP; bandagens, tipóias e transporte de feridos; uso do kit de primeiros socorros; acionamento de SAMU, bombeiros e polícia."},
          {id:"e4b1f2", text:"Nas atividades da patrulha ou tropa, identificar condutas que possam colocar em risco a saúde física e mental, compartilhando medidas com os companheiros para mitigar esses riscos."}
        ],
        varLabel:"Realizar duas ações dentre as listadas a seguir",
        variaveis:[
          {id:"e4b1v1", text:"Experimentar atividades físicas ou modalidades esportivas diversas (coletivas, individuais, adaptadas) e refletir sobre a experiência."},
          {id:"e4b1v2", text:"Pesquisar sobre saúde física e mental na juventude e apresentar propostas para a tropa melhorar seus hábitos."},
          {id:"e4b1v3", text:"Conduzir oficinas ou jogos inclusivos que valorizem a diversidade de habilidades físicas do grupo."},
          {id:"e4b1v4", text:"Participar de um workshop, palestra ou atividade sobre: perigos do uso de anabolizantes; perigos do uso de drogas, álcool, tabaco, cigarros eletrônicos etc.; distúrbios alimentares."},
          {id:"e4b1v5", text:"Organizar o material de primeiros socorros da patrulha para diferentes atividades."},
          {id:"e4b1v6", text:"Participar de workshop ou outra atividade relacionada à prevenção das Infecções Sexualmente Transmissíveis (IST)."}
        ],
        ou:{id:"e4b1ou", text:"Conquistar a especialidade de Saúde."}
      },
      { id:"e4b2", name:"Bloco 2 — Espiritualidade",
        desc:"Refletir sobre o sentido da vida, encontrando inspiração na natureza, na solidariedade e na diversidade espiritual da sua comunidade. Buscar viver de acordo com seus valores, alinhando suas crenças às suas ações diárias.",
        varLabel:"Realizar três ações dentre as listadas a seguir",
        variaveis:[
          {id:"e4b2v1", text:"Conduzir momentos de silêncio, oração ou meditação em atividades da tropa, valorizando a diversidade espiritual."},
          {id:"e4b2v2", text:"Participar de projetos e atividades que permitam conhecer, atuar e dialogar com jovens de diferentes opções de fé e crenças."},
          {id:"e4b2v3", text:"Colaborar em celebrações religiosas ou outras expressões de fé e espiritualidade de sua comunidade."},
          {id:"e4b2v4", text:"Organizar um momento de reflexão e conexão com um ambiente natural em que se possa apreciar a beleza do mundo e cultivar um relacionamento harmonioso com ele. Exemplos: banho de floresta, dia da gratidão, música, artes manuais ou um culto de alguma religião, entre outras."}
        ],
        ou:{id:"e4b2ou", text:"Conquistar a especialidade Diálogo Inter-religioso."}
      },
      { id:"e4b3", name:"Bloco 3 — Hábitos Saudáveis",
        desc:"Cuidar do próprio bem-estar adotando hábitos saudáveis, praticando atividades físicas, mantendo uma alimentação equilibrada e garantindo a higiene pessoal e a organização do ambiente onde vive.",
        fixas:[
          {id:"e4b3f1", text:"Planejar um cardápio de acampamento para a patrulha ou equipe de interesse, priorizando alimentação sustentável, com mínimo uso de produtos industrializados e redução de resíduos, e avaliar após a atividade se os objetivos foram atingidos."},
          {id:"e4b3f2", text:"Praticar atividades físicas regularmente."}
        ],
        varLabel:"Realizar duas ações dentre as listadas a seguir",
        variaveis:[
          {id:"e4b3v1", text:"Manter o canto da patrulha limpo e organizado, colaborando também com a limpeza da sede."},
          {id:"e4b3v2", text:"Planejar e realizar um almoço ou jantar equilibrado e saudável para a patrulha, elaborando o cardápio, organizando a lista de compras, preparando os alimentos e fazendo avaliação posterior."},
          {id:"e4b3v3", text:"Praticar atividades como meditação, yoga ou técnicas de relaxamento na natureza."},
          {id:"e4b3v4", text:"Elaborar um plano pessoal de hábitos saudáveis e avaliar seu cumprimento ao longo do ciclo."},
          {id:"e4b3v5", text:"Demonstrar manter a rotina de cuidado com seu ambiente doméstico, com autonomia e cooperação nas responsabilidades da casa."}
        ],
        ou:{id:"e4b3ou", text:"Conquistar ao menos uma das seguintes especialidades: Esportes, Educação Alimentar e Nutricional."}
      },
      { id:"e4b4", name:"Bloco 4 — Saúde Mental",
        desc:"Cultivar hábitos que promovem a saúde mental, aprender a lidar com desafios e aplicar práticas que favorecem um ambiente positivo e acolhedor para si e para aqueles ao seu redor.",
        fixas:[
          {id:"e4b4f1", text:"Buscar informações e conhecimentos sobre os Espaços Seguros no Movimento Escoteiro e promover seus conceitos em todas as atividades."},
          {id:"e4b4f2", text:"Reconhecer sinais de estresse, ansiedade ou tristeza em colegas e praticar técnicas básicas de primeiros socorros em saúde mental, como escuta ativa, apoio inicial e encaminhamento para ajuda adequada."}
        ],
        varLabel:"Realizar três ações dentre as listadas a seguir",
        variaveis:[
          {id:"e4b4v1", text:"Realizar, com sua patrulha ou equipe de interesse, uma campanha relacionada à temática de saúde mental, como Setembro Amarelo ou Janeiro Branco."},
          {id:"e4b4v2", text:"Desenvolver hábitos e atividades para aliviar a tensão do dia a dia, proporcionando momentos de bem-estar e equilíbrio."},
          {id:"e4b4v3", text:"Convidar profissionais da área de saúde e saúde mental para falar sobre o assunto na tropa."},
          {id:"e4b4v4", text:"Organizar sua rotina de atividades mensais, considerando a importância do equilíbrio entre as atividades do mundo digital e real e incluindo uma atividade de bem-estar offline."},
          {id:"e4b4v5", text:"Utilizar técnicas ou espaços para autoexpressão e contato com suas emoções e pensamentos, como: Mindfulness (foco no presente), meditação guiada, terapia, teatro ou dança de expressão corporal."}
        ],
        ou:{id:"e4b4ou", text:"Conquistar ao menos uma das seguintes especialidades: Saúde Mental e Bem-estar Emocional, Hobbies e Lazer."}
      },
      { id:"e4b5", name:"Bloco 5 — Vínculos Saudáveis",
        desc:"Construir relações saudáveis e empáticas, criando laços baseados no respeito, na compreensão mútua e no bem-estar coletivo.",
        fixas:[
          {id:"e4b5f1", text:"Identificar e discutir com sua patrulha ou equipe de interesse as manifestações de bullying e cyberbullying ao seu redor, elaborando e implementando estratégias para prevenir e combater essas situações."}
        ],
        varLabel:"Realizar três ações dentre as listadas a seguir",
        variaveis:[
          {id:"e4b5v1", text:"Promover um encontro social que reúna jovens de diferentes realidades e contextos, criando um ambiente de convivência, troca de experiências e respeito à diversidade."},
          {id:"e4b5v2", text:"Realizar uma roda de conversa para debater temas como confiança, respeito e equilíbrio nas relações, incentivando a reflexão sobre atitudes que contribuem para vínculos saudáveis."},
          {id:"e4b5v3", text:"Engajar-se em uma equipe de interesse para planejar e executar projetos ou conquistar especialidades, fortalecendo a colaboração, o compromisso e a construção de vínculos positivos no grupo."},
          {id:"e4b5v4", text:"Promover reuniões regulares na patrulha que incluam espaços de escuta e apoio, incentivando a empatia, o compartilhamento de desafios e a busca conjunta por soluções."},
          {id:"e4b5v5", text:"Assumir responsabilidades no ambiente familiar, contribuindo de forma constante com tarefas do dia a dia e promovendo diálogo respeitoso sobre decisões coletivas."},
          {id:"e4b5v6", text:"Convidar um colega da mesma faixa etária para participar de um Fogo de Conselho, integrado a sua patrulha e com o devido \"Registro de Visitante\"."}
        ],
        ou:{id:"e4b5ou", text:"Conquistar a especialidade Saúde Sexual e Reprodutiva."}
      }
    ]
  },
  {
    id:"patria", eixo:true, num:"🏆", name:"Escoteiro da Pátria",
    flat:true, isPatria: true,
    blocos: [{ id:"patria-b", items: [
      { id:"patria-azimute", text:"Realizar o Desafio do Azimute: jornada de 15km com 2 pernoites ao ar livre." },
      { id:"patria-avaliacao", text:"Passar pela avaliação dos pares e autoavaliação." }
    ]}]
  }
];

const SPECIALTIES = [
  { id:"area1", name:"Habilidades para a Vida", especialidades:[
      {id:"sp-gastronomia", text:"Gastronomia"},
      {id:"sp-tecnologia", text:"Tecnologia"},
      {id:"sp-educacao", text:"Educação"},
      {id:"sp-idiomas", text:"Idiomas"},
      {id:"sp-empreendedorismo", text:"Empreendedorismo e Negócios"},
      {id:"sp-financas", text:"Finanças e Economia"},
      {id:"sp-lideranca", text:"Liderança e Gestão"},
      {id:"sp-viagens", text:"Viagens"},
      {id:"sp-comunicacoes", text:"Comunicações"}
    ], insignias:[
      {id:"in-aprender", text:"Insígnia do Aprender"},
      {id:"in-mar", text:"Insígnia da Modalidade do Mar (Naval)"},
      {id:"in-ar", text:"Insígnia da Modalidade do Ar (Aeronauta)"},
      {id:"in-inovadores", text:"Insígnia Inovadores de Impacto"}
    ]
  },
  { id:"area2", name:"Meio Ambiente", especialidades:[
      {id:"sp-agricultura", text:"Agricultura Sustentável"},
      {id:"sp-sustentabilidade", text:"Sustentabilidade"},
      {id:"sp-natureza", text:"Natureza e Ciências Naturais"},
      {id:"sp-edambiental", text:"Educação Ambiental"},
      {id:"sp-esportesaventura", text:"Esportes de Aventura"},
      {id:"sp-ecoturismo", text:"Ecoturismo"},
      {id:"sp-habilidadesesc", text:"Habilidades Escoteiras"}
    ], insignias:[
      {id:"in-3r", text:"Insígnia Reduzir, Reciclar, Reutilizar"},
      {id:"in-solar", text:"Insígnia Escoteiros pela Energia Solar"},
      {id:"in-campeoes", text:"Insígnia Campeões da Natureza"}
    ]
  },
  { id:"area3", name:"Paz e Desenvolvimento", especialidades:[
      {id:"sp-devcomunitario", text:"Desenvolvimento Comunitário"},
      {id:"sp-acoeshumanit", text:"Ações Humanitárias"},
      {id:"sp-inclusao", text:"Inclusão e Acessibilidade"},
      {id:"sp-equidade", text:"Equidade"},
      {id:"sp-politicas", text:"Políticas Públicas"},
      {id:"sp-culturarte", text:"Cultura e Arte"},
      {id:"sp-cienciashumanas", text:"Ciências Humanas"},
      {id:"sp-direitoshumanos", text:"Direitos Humanos"},
      {id:"sp-diversidades", text:"Diversidades"},
      {id:"sp-fecrencas", text:"Fé, Crenças e Diálogo Inter-religioso"}
    ], insignias:[
      {id:"in-desafiocom", text:"Insígnia do Desafio Comunitário"},
      {id:"in-mensageiros", text:"Insígnia Mensageiros da Paz"},
      {id:"in-mundo", text:"Reconhecimento Escoteiros do Mundo"},
      {id:"in-lusofonia", text:"Insígnia da Lusofonia"},
      {id:"in-conesul", text:"Insígnia do Cone Sul"},
      {id:"in-dialogospaz", text:"Diálogos pela Paz"}
    ]
  },
  { id:"area4", name:"Saúde e Bem-estar", especialidades:[
      {id:"sp-saude", text:"Saúde"},
      {id:"sp-dialogointer", text:"Diálogo Inter-religioso"},
      {id:"sp-esportes", text:"Esportes"},
      {id:"sp-edalimentar", text:"Educação Alimentar e Nutricional"},
      {id:"sp-saudemental", text:"Saúde Mental e Bem-Estar Emocional"},
      {id:"sp-hobbies", text:"Hobbies e Lazer"},
      {id:"sp-saudesexual", text:"Saúde Sexual e Reprodutiva"}
    ], insignias:[]
  }
];
