// Conteúdo da Progressão — Ramo Escoteiro 2026 (acolhida, eixos, blocos, ações, especialidades e insígnias)
//
// Formato compacto: cada ação é um texto. "[mar] " ou "[ar] " no começo marca ação de modalidade.
// Os códigos dos itens são gerados pela posição (esc-e1b1f1, esc-e1b1v3...): para não perder o que
// as pessoas já marcaram, acrescente ações novas sempre NO FIM da lista e não troque a ordem.

const ESCOTEIRO_ACOLHIDA = [
  'Participar ativamente das atividades com sua patrulha, com sua tropa e conhecer a sua estrutura.',
  'Utilizar o lenço escoteiro, saber o seu significado e conhecer a história do seu grupo escoteiro e do Escotismo.',
  'Reconhecer e responder aos apitos e sinais manuais próprios do ramo.',
  'Fazer parte de uma patrulha, participar do grito da patrulha, usar suas cores e símbolos, utilizar seu distintivo, saber quem é seu monitor e desempenhar um encargo na patrulha.',
  'Entender e usar o Lema do Escoteiro, o Sinal, a Saudação e o Aperto de Mão.',
  'Saber quais são e como conquistar os distintivos do Ramo Escoteiro e conhecer o uniforme ou vestuário escoteiro usado na sua tropa.',
  'Conhecer a Lei e Promessa Escoteira, sendo capaz de explicar para o seu monitor e escotista a sua importância e valores. Sentir-se pronto para assumir esse compromisso.'
];

// Cada bloco: nome, desc, fixas, n (quantas variáveis são exigidas, por extenso), variaveis,
// esp (especialidades que somam nas variáveis) e ou (alternativa às variáveis)
const ESCOTEIRO_EIXOS = [
  { name:'Habilidades para a Vida', blocos:[
    { name:'Aprendizagem contínua e desenvolvimento vocacional',
      desc:'Explorar assuntos que você acha interessantes e procurar informações confiáveis para experimentar novas ideias e recursos, colocando o que aprendeu em prática nas atividades e nos projetos de serviço à comunidade.',
      fixas:[
        'Conquistar, no Ramo Escoteiro, uma especialidade sobre um tema de seu interesse e que seja um conhecimento novo.',
        'Em conjunto com sua patrulha, realizar um Percurso de Gilwell de pelo menos 3 km.',
        '[ar] Visitar, com a patrulha ou tropa, um aeroporto ou aeroclube, identificando tipos de aeronaves e procedimentos de pouso e decolagem.',
        '[mar] Visitar, com a patrulha ou tropa, um porto, marina ou iate clube, conhecendo seu funcionamento e os tipos de embarcações.'
      ],
      n:'quatro',
      variaveis:[
        'Enviar e receber mensagens simples em Alfabeto Fonético, Código Internacional de Sinais, Semáfora, Heliografia, Cifra de César ou Criptografia.',
        'Visitar com sua patrulha: hospital, quartel de bombeiros, delegacia, empresas, comércios locais ou outros para conhecer o funcionamento de diferentes profissões.',
        'Conhecer o funcionamento de serviços de internet, rádio e TV e usar esses conhecimentos para resolver problemas técnicos.',
        'Convidar um especialista da comunidade para dialogar com a tropa e esclarecer dúvidas sobre determinado tema ou profissão.',
        'Utilizar corretamente um radiocomunicador em atividade de patrulha.',
        'Realizar uma pesquisa sobre um tema escolhido e apresentar os resultados para a patrulha ou tropa em formato criativo (cartaz, teatro, vídeo, oficina).',
        'Planejar e executar, em conjunto com a sua patrulha, uma ação de serviço comunitário baseada em informações pesquisadas sobre necessidades locais.',
        '[ar] Conhecer e demonstrar o funcionamento de um sistema de localização por satélite.',
        '[ar] Apresentar a história e características de uma aeronave de sua escolha.',
        '[mar] Realizar manutenção de uma embarcação, incluindo faxina, reparo, pintura ou substituição de peças.',
        '[mar] Calcular um rumo magnético e corrigir a rota quando se aproxima de uma linha isogônica.'
      ],
      esp:'Aeromodelismo, Arquitetura e Urbanismo, Astronáutica, Astronomia, Biblioteconomia, Cartografia, Comunicações, Confeitaria, Construção Civil, Criptografia, Culinária, Design de Interiores, E-Sports, Etiqueta, Ferramentas de Corte, Fiscalização de Pátio de Aeródromo, GPS, Informática, Investimentos, Jornalismo, Manicure, Manutenção Elétrica, Marcenaria, Marinharia, Matemática, Mecânica Aérea, Observação Aérea, Planador, Prevenção de Incêndio, Produção Gráfica, Programação, Química, Radioamadorismo, Radioescuta, Redes de Computadores, Segurança e Emergência Náutica, Segurança no Trânsito, Simulação Aérea, Sinalização, Técnica Aeronáutica, Vendas e Web Design.',
      ou:'Conquistar uma das seguintes Insígnias: Insígnia do Aprender, Insígnia da Modalidade do Mar (Grumete) ou Insígnia da Modalidade do Ar (Aviador).' },
    { name:'Autonomia e Liderança',
      desc:'Viver diferentes funções na patrulha, sabendo quando ajudar e quando é sua vez de liderar. Saber administrar o seu dinheiro para conseguir realizar atividades e projetos. Planejar, colocar em prática e depois avaliar as tarefas com o grupo, tomando decisões com responsabilidade.',
      fixas:[
        'Montar corretamente uma mochila para um acampamento, mantendo o equipamento pessoal em bom estado.',
        '[mar] Navegar em uma embarcação a vela ou remo, montando-a corretamente, identificando as partes (proa, popa, bombordo, boreste), usando o colete salva-vidas e respeitando as regras de segurança.'
      ],
      n:'cinco',
      variaveis:[
        'Contribuir para o planejamento e a organização de uma excursão de patrulha.',
        'Fazer uma excursão urbana com a sua patrulha ou tropa, se locomovendo por meio de transportes públicos como ônibus, trens, metrô, entre outros.',
        'Pesquisar e realizar as compras dos alimentos para um acampamento, apresentando para a patrulha uma prestação de contas.',
        'Saber onde encontrar, identificando em um mapa, os principais serviços públicos na cidade.',
        'Planejar e executar em patrulha um projeto de captação de recursos para participação em uma atividade escoteira.',
        'Participar de atividades ou oficinas sobre finanças pessoais.',
        'Assumir pelo menos três encargos diferentes na patrulha, sendo bem avaliado pelos seus companheiros.',
        'Administrar o fundo de patrulha por pelo menos três meses, registrando receitas e despesas, e utilizar os recursos em atividades planejadas pela patrulha.',
        'Registrar receitas e despesas simples ou da mesada em planilha ou caderno por um período determinado.',
        'Conduzir uma reunião de patrulha como monitor ou secretário, registrando decisões e acompanhando sua execução.'
      ],
      ou:'Conquistar ao menos uma das seguintes especialidades no nível 2: Administração, Educação Financeira, Empreendedorismo, Oratória e Reparos Domésticos.' },
    { name:'Criatividade e Inovação',
      desc:'Usar a criatividade para resolver problemas do dia a dia, pensando em várias ideias diferentes antes de decidir qual é a melhor solução.',
      fixas:[
        'Animar um Fogo de Conselho em um acampamento da patrulha ou de tropa.',
        'Aplicar conceitos básicos de estruturas (cavaletes, encaixes, ancoragens) em projetos como pontes, balsas, pórticos ou outras pioneirias.',
        '[ar] Construir uma pipa, planador e foguete, testando aerodinâmica, planagem e propulsão.',
        '[mar] Confeccionar e utilizar uma jangada, canoa ou bote para embarcar a sua patrulha, respeitando as regras de segurança.'
      ],
      n:'quatro',
      variaveis:[
        'Organizar uma atividade de divulgação do escotismo no colégio, usando diferentes recursos: vídeos, cartazes, panfletos, entre outros.',
        'Conhecer e cantar canções e danças apropriadas para diferentes momentos.',
        'Criar uma campanha publicitária divertida promovendo algum projeto ou atividade da patrulha ou Tropa Escoteira.',
        'Construir equipamentos improvisados de campo (mesa, suporte, abrigo, utensílios) utilizando materiais disponíveis.',
        'Propor e implementar soluções criativas para reduzir custos de uma atividade, aproveitando materiais recicláveis ou doados.',
        'Ensinar e aplicar dois novos jogos para sua tropa.',
        'Criar alternativas criativas para decorar o canto da patrulha ou o acampamento.',
        'Participar de um festival de talentos na tropa.',
        'Improvisar apresentações artísticas (esquetes, músicas, danças) em um Fogo de Conselho, explorando recursos disponíveis.',
        'Criar um vídeo de divulgação das atividades de sua patrulha ou tropa.',
        '[ar] Demonstrar com um experimento simples os seguintes princípios: a) sustentação das asas, explicando quais as forças envolvidas e b) o funcionamento de um aeróstato e como sua altitude pode ser controlada.',
        '[mar] Fazer um trabalho artesanal marinheiro com cabos, usando nós característicos da marinharia.'
      ],
      ou:'Conquistar ao menos uma das seguintes especialidades no nível 2: Arte Digital, Artes Visuais, Artesanato, Comédia, Costura e Estilismo, Encadernação, Fotografia, Grafite, HQ, Maquete, Pintura, Plastimodelismo, Propaganda e Marketing, Robótica e Videomaker.' },
    { name:'Inteligência Emocional',
      desc:'Entender o que você sente, aprender a lidar com suas emoções de forma respeitosa e enfrentar desafios mesmo quando as coisas ficam difíceis.',
      fixas:[
        'Identificar situações perigosas e de maus tratos, sabendo como agir e a quem recorrer.'
      ],
      n:'quatro',
      variaveis:[
        'Conversar com a patrulha sobre pontos fortes e de melhoria no desempenho da equipe em atividades e acampamentos.',
        'Identificar seus medos e suas emoções diante de um obstáculo desafiador, trabalhando para conseguir superá-lo.',
        'Em um acampamento, participar de um turno de ronda com outro companheiro de patrulha, refletindo sobre o cuidado com o outro.',
        'Participar de jogos ou competições, respeitando regras e resultados.',
        'Em uma atividade de patrulha ou de tropa, aplicar técnicas de respiração, relaxamento ou meditação antes de um grande desafio.',
        'Participar de rodas de conversa ou momentos de partilha após atividades intensas, ouvindo e respeitando as emoções dos demais.',
        'Escrever uma pequena carta para si mesmo com palavras de incentivo, lembrando de suas qualidades e dando sugestões de como você pode superar desafios futuros.',
        'Criar e encenar uma pequena história em que o personagem passa por dificuldades e encontra formas saudáveis de lidar com elas.'
      ] }
  ]},
  { name:'Meio Ambiente', blocos:[
    { name:'Consumo Responsável',
      desc:'Praticar o consumo consciente diariamente, evitando desperdícios e ajudando a preservar recursos naturais.',
      fixas:[
        'Em acampamentos e excursões, criar soluções para melhorar a higiene e conforto e classificar os resíduos em categorias, tratando-os adequadamente.',
        'Planejar adequadamente e adquirir as quantidades dos alimentos para refeições em um acampamento para sua patrulha, evitando desperdícios.'
      ],
      n:'cinco',
      variaveis:[
        'Registrar e analisar o consumo de água e energia da sua residência, buscando ideias para economizar e apresentar para sua patrulha os resultados.',
        'Avaliar o impacto ambiental de uma atividade e apresentar alternativas mais sustentáveis.',
        'Visitar uma estação de energia renovável, uma estação de tratamento de água, uma cooperativa ou usina de reciclagem ou outras opções semelhantes.',
        'Consertar objetos simples, como brinquedos ou pequenos eletrodomésticos.',
        'Utilizar embalagens retornáveis ou reutilizáveis nas refeições de campo, evitando descartáveis.',
        'Separar resíduos orgânicos e criar um sistema de compostagem caseira.',
        'Criar uma campanha educativa para a tropa sobre consumo consciente e economia de recursos.',
        'Trocar roupas, livros ou jogos com amigos e familiares em vez de comprar novos.',
        'Organizar, com sua patrulha, uma campanha de conscientização sobre consumo responsável.',
        'Confeccionar utensílios ou equipamentos a partir de materiais reciclados para uso nas atividades de patrulha.',
        'Planejar e realizar as refeições de um dia de acampamento sem carne, garantindo a ingestão adequada de proteínas.',
        'Organizar, cuidar e fazer reparos nos materiais de patrulha.'
      ],
      esp:'Agricultura, Aquicultura e Energia.',
      ou:'Conquistar a especialidade de Horticultura (nível 2) ou a Insígnia Reduzir, Reciclar e Reutilizar.' },
    { name:'Mudanças Climáticas',
      desc:'Participar de ações e projetos que ajudem a proteger o meio ambiente e enfrentar as mudanças do clima.',
      fixas:[],
      n:'cinco',
      variaveis:[
        'Em um acampamento, criar uma estação meteorológica simples para registrar temperatura, umidade, direção do vento, nuvens e possíveis mudanças climáticas.',
        'Participar da construção de um fogão solar e usá-lo em um acampamento de patrulha ou tropa.',
        'Participar de uma excursão urbana com foco ecológico, identificando situações de risco para a sociedade referentes às mudanças climáticas.',
        'Visitar ou participar de uma atividade com uma organização que atua em prol do meio ambiente.',
        'Em uma excursão ou acampamento em área não urbana, identificar ações prejudiciais à natureza, como extrativismo e mineração, e listar seus impactos.',
        'Planejar e participar de uma excursão utilizando meios de transporte que dependem de fontes de energia limpa (bicicleta, ônibus elétrico, embarcação a remo, entre outros).',
        'Organizar, com sua patrulha ou tropa, um projeto de conscientização sobre o uso de energia e água em sua escola, condomínio ou sede da UEL.',
        'Participar de mutirões de plantio de mudas ou cultivo de uma horta em casa, na escola ou na UEL.'
      ],
      esp:'Agricultura, Energia, Jardinagem e Paisagismo.',
      ou:'Conquistar a especialidade de Meteorologia (nível 2) ou a Insígnia Escoteiros pela Energia Solar.' },
    { name:'Preservação da Biodiversidade',
      desc:'Proteger os animais e as plantas, percebendo como nossas ações podem ajudar ou atrapalhar a natureza.',
      fixas:[
        'Participar, em patrulha, de uma atividade de exploração em ambiente natural, reconhecendo a fauna e a flora locais e identificando riscos à preservação, além de propor soluções para evitá-los.',
        '[ar] Identificar algumas aves, seus hábitos e compreender a relação das espécies com os métodos de voo e aerodinâmica.',
        '[mar] Conhecer as características do bioma aquático local e os riscos para esse bioma.'
      ],
      n:'cinco',
      variaveis:[
        'Reconhecer os animais venenosos e peçonhentos da região e saber como agir em casos de picadas ou contaminação.',
        'Planejar e executar um projeto ambiental com a patrulha ou tropa.',
        'Plantar uma espécie nativa e observar seu crescimento, registrando cada etapa.',
        'Identificar as pegadas de pelo menos cinco animais da fauna brasileira e realizar levantamento das pegadas em áreas naturais.',
        'Participar de uma atividade de mergulho que tenha o objetivo de conhecer e explorar a vida na água.',
        'Participar de uma atividade de observação de animais noturnos com sua patrulha.',
        'Observar e registrar espécies de aves, insetos, plantas ou outros animais durante um acampamento ou excursão.',
        'Visitar parques, reservas ou centros de proteção ambiental para conhecer ações de preservação da fauna e da flora.',
        'Construir comedouros ou bebedouros para aves e instalar em áreas adequadas, acompanhando seu uso.',
        'Criar materiais educativos, como vídeos ou posts, sobre a importância de preservar a biodiversidade.'
      ],
      esp:'Animais Venenosos e Peçonhentos, Aquarismo, Biologia, Cuidados com Animais de Estimação, Entomologia, Geologia, Meliponicultura e Microbiologia.',
      ou:'Conquistar a especialidade (nível 2) de Botânica, Oceanologia ou Zoologia, ou a Insígnia Campeões da Natureza.' },
    { name:'Vida ao Ar Livre',
      desc:'Aproveitar as atividades ao ar livre com respeito e cuidado, deixando cada lugar melhor do que encontrou.',
      fixas:[
        'Montar o campo de patrulha com pioneirias como mesa, pórtico e canto do lenhador, utilizando amarras adequadas.',
        'Aplicar os nós direito, correr, aselha, volta do fiel, escota durante um acampamento sabendo sua utilização.',
        'Escolher corretamente o local para montagem da barraca, incluindo técnicas de montagem, desmontagem e acondicionamento durante um acampamento de patrulha ou tropa.',
        'Manusear corretamente ferramentas de corte e sapa durante um acampamento de patrulha ou tropa, zelando pela segurança e realizando reparos.',
        'Preparar e executar uma fogueira para uma refeição mateira durante um acampamento de patrulha ou tropa, seguindo as técnicas de segurança.',
        'Participar de ao menos duas excursões ao ar livre (patrulha ou tropa), utilizando normas de baixo impacto ambiental.',
        'Participar de ao menos dois acampamentos ao ar livre (patrulha ou tropa), utilizando normas de baixo impacto ambiental.',
        'Orientar-se com recursos naturais, bússola e mapa, utilizando azimutes.',
        '[ar] Durante um acampamento, realizar observação das estrelas, identificando constelações e fases da lua, explicando suas interferências na natureza.',
        '[mar] Durante uma atividade náutica, utilizar nós da modalidade do mar, como lais de guia, nó de cunho, pinha de retinida e nó de defensa.'
      ],
      n:'cinco',
      variaveis:[
        'Participar de um percurso no campo de pelo menos 1 km utilizando sinais de pistas.',
        'Colaborar na preparação de alimentos para a patrulha em pelo menos três atividades ao ar livre, sendo uma delas no estilo comida mateira, sem utensílios.',
        'Desenvolver soluções para purificação e consumo de água em um acampamento.',
        'Aplicar técnicas de "tocaia" em jogos com a patrulha.',
        'Participar da construção de um fogão suspenso ou forno de acampamento para o preparo de uma refeição.',
        'Construir e pernoitar em um bivaque ou abrigo natural durante uma atividade de patrulha.',
        'Confeccionar falcaças, nó catau, lais de guia, pescador, oito duplo e demonstrar cuidados com as cordas.',
        'Participar de uma atividade aquática com a tropa, seguindo normas de segurança.',
        'Desenhar um croqui de um acampamento, usando sinais topográficos.'
      ],
      esp:'Corrida de Orientação, Culinária Mateira, Escalada, Espeleoturismo, Ferramentas de Corte, Mountain Bike, Pesca e Rastreamento.',
      ou:'Conquistar ao menos uma das seguintes especialidades no nível 2: Acampamento, Excursões, Montanhismo, Pioneiria ou Sobrevivência.' }
  ]},
  { name:'Paz e Desenvolvimento', blocos:[
    { name:'Comunidade',
      desc:'Realizar boas ações diariamente e trabalhar em equipe para organizar atividades e projetos de serviço à comunidade.',
      fixas:[
        'Identificar, sozinho ou em patrulha, uma necessidade da comunidade e planejar e executar uma ação comunitária.',
        'Identificar os riscos de desastres naturais na comunidade e conhecer os hospitais e contatos de emergência, sabendo quando acionar cada um.'
      ],
      n:'três',
      variaveis:[
        'Aplicar o conhecimento adquirido nas especialidades em ações de serviço à comunidade.',
        'Participar ativamente de pelo menos uma campanha de serviço e desenvolvimento comunitário organizadas pela UEL, Distrito ou Região.',
        'Organizar uma oficina de brinquedos, doando os itens consertados para uma instituição que atende crianças em situação de vulnerabilidade.',
        'Colaborar em ações organizadas por outras instituições de serviço.',
        'Conquistar a especialidade Inclusão ou Libras.'
      ],
      ou:'Conquistar a especialidade (nível 2) Defesa Civil ou uma das Insígnias: Mensageiros da Paz ou Ação Comunitária.' },
    { name:'Democracia',
      desc:'Participar das decisões da tropa, contribuindo com suas ideias, respeitando as opiniões dos colegas e se comprometendo a seguir o que foi decidido em conjunto.',
      fixas:[
        'Participar ativamente das decisões do Conselho de Patrulha, contribuindo com ideias, votando e assumindo responsabilidades, respeitando os resultados.',
        'Participar ativamente das decisões da Assembleia de Tropa, contribuindo com ideias, votando e assumindo responsabilidades, respeitando os resultados.',
        'Participar da eleição do monitor da patrulha e das decisões de encargos, respeitando os resultados.'
      ],
      n:'duas',
      variaveis:[
        'Visitar a sede administrativa de qualquer um dos três poderes e explicar a importância e as particularidades desta forma de governo, conhecendo a constituição e os símbolos nacionais, do estado e município.',
        'Conhecer a estrutura do grupo escoteiro ou seção autônoma e participar de uma Assembleia de Grupo Escoteiro.',
        'Participar ativamente de um fórum de jovens do grupo escoteiro.',
        'Aprender e compartilhar sobre a história do voto e da democracia no Brasil.'
      ],
      esp:'Geografia, Paz e Justiça, Prevenção de Fake News.' },
    { name:'Herança Cultural',
      desc:'Conhecer e valorizar as histórias, os costumes e os lugares da sua comunidade e país e propor atividades para compartilhar esses conhecimentos com os outros.',
      fixas:[
        'Realizar o hasteamento ou arriamento da bandeira em cerimônias de abertura ou encerramento de atividade.'
      ],
      n:'cinco',
      variaveis:[
        'Desenvolver sua "Árvore Genealógica", pesquisando seu sobrenome, significado e a história dos seus antepassados, situando-os no contexto histórico e apresentá-la para sua patrulha.',
        'Participar das cerimônias com os símbolos nacionais e cantar o Hino Nacional corretamente.',
        'Apresentar para a sua patrulha ou tropa histórias de mulheres que se destacaram em nosso país.',
        'Participar, com sua patrulha, de uma comemoração ou festa típica da sua região.',
        'Participar, com sua patrulha, de um safári fotográfico em sua cidade, identificando os locais de importância histórica da localidade.',
        'Participar de um jantar festivo representando um estado diferente do seu.',
        'Aplicar jogos e atividades típicas da sua região.',
        'Visitar museus, centros culturais ou pontos históricos locais para conhecer o patrimônio da região.',
        'Investigar lendas, histórias ou personagens do folclore brasileiro e dramatizá-los em esquetes no Fogo de Conselho.',
        'Aplicar canções e danças típicas do Brasil.',
        'Confeccionar artesanato típico de alguma região do Brasil.',
        'Apresentar a cultura da sua cidade em um evento regional ou nacional, como feira das cidades ou noite folclórica.'
      ],
      esp:'Anime, Arqueologia, Arte da Marinharia, Artes Cênicas, Capoeira, Civilizações da Antiguidade, Cosplay, Culinária Típica, Danças Folclóricas, História Aeroespacial, História da Aviação, História Brasileira, História da Arte, História do Escotismo, História Local, História Marítima, Literatura, Mitologias, Museologia, Origami, Paleontologia, Poesia.',
      ou:'Conquistar ao menos uma das seguintes especialidades no nível 2: Brasilidades, Genealogia, Informações Turísticas, Tradições dos Povos Originários.' },
    { name:'Promoção da Paz',
      desc:'Conhecer e valorizar as histórias, os costumes e os lugares da sua comunidade e país e propor atividades para compartilhar esses conhecimentos com os outros.',
      fixas:[
        'Aplicar uma atividade para a patrulha sobre Direitos Humanos ou os Direitos da Criança e do Adolescente.'
      ],
      n:'quatro',
      variaveis:[
        'Convidar a patrulha a cooperar em ações organizadas por uma comunidade em favor de pessoas em situação de vulnerabilidade.',
        'Participar de uma excursão com sua patrulha ou tropa, visitando diferentes templos e conhecendo um pouco mais sobre cada religião.',
        'Participar de eventos de trocas culturais entre jovens de diferentes origens para estimular o respeito mútuo.',
        'Participar de uma atividade com outro grupo escoteiro ou seção autônoma e refletir sobre o que é a Fraternidade Mundial Escoteira.',
        'Conhecer as diferentes denominações de fé e crença de amigos da patrulha, tropa, escola e comunidade.',
        'Promover uma campanha que incentive atitudes de respeito e cooperação entre todos.',
        'Convidar representantes de diferentes crenças para compartilhar experiências e responder perguntas da tropa.',
        'Criar, com sua patrulha ou seção, um calendário de celebrações religiosas das diferentes denominações de fé e crença ali presentes.'
      ],
      esp:'Geografia, História Mundial, Inclusão, Libras, Línguas, Paz e Justiça.',
      ou:'Conquistar uma das seguintes Insígnias: Insígnia da Lusofonia, Insígnia do Cone Sul, Diálogos pela Paz.' },
    { name:'Valores',
      desc:'Colocar em prática a Promessa e a Lei Escoteira em tudo o que faz, demonstrando, com atitudes, que você vive os valores que acredita.',
      fixas:[
        'Avaliar, com seus companheiros de patrulha, a vivência da Promessa e Lei Escoteira.'
      ],
      n:'três',
      variaveis:[
        'Participar da avaliação da sua Progressão Pessoal e dos companheiros da patrulha.',
        'Explicar o significado da Lei e da Promessa Escoteira aos novos membros da patrulha.',
        'Auxiliar um companheiro de patrulha a realizar sua Promessa Escoteira.',
        'Explicar aos novos membros da patrulha os significados da Flor-de-lis e da Saudação Escoteira.',
        'Conhecer e cantar o Hino Alerta.'
      ],
      esp:'Fogo de Conselho, História do Escotismo.',
      ou:'Conquistar a especialidade (nível 2) Escotismo Mundial.' }
  ]},
  { name:'Saúde e Bem-estar', blocos:[
    { name:'Cuidado com o Corpo',
      desc:'Compreender as mudanças do seu corpo e respeitar as diferenças entre as pessoas, sem julgar pela aparência ou jeito de ser. Se cuidar, superar desafios físicos e aprender a ajudar em situações simples com primeiros socorros.',
      fixas:[
        'Conhecer as ações iniciais em acidentes e como cuidar de pequenos cortes, contusões, escoriações, queimaduras e picadas de animais peçonhentos.',
        'Aplicar técnicas de bandagens e transporte de feridos.',
        'Cuidar da segurança física e mental nas atividades escoteiras, respeitando os limites próprios e dos outros, e seguindo as orientações dos escotistas.'
      ],
      n:'quatro',
      variaveis:[
        'Conhecer as medidas do seu corpo (palmo, envergadura, passo simples e duplo) e aplicá-las durante uma excursão com sua patrulha.',
        'Participar de uma atividade, oficina, palestra que trate dos malefícios dos seguintes assuntos: anorexia, bulimia, drogas, álcool, cigarro e cigarros eletrônicos.',
        'Saber contato dos órgãos de emergência e saber como informar os sinais vitais e situação da vítima.',
        'Participar de uma simulação de acidente e atuar em conjunto com a sua patrulha.',
        'Proteger-se do sol e do frio durante as atividades identificando casos de desidratação e insolação e respeitar os limites do seu corpo.',
        'Demonstrar como ajudar uma pessoa em casos de obstrução das vias aéreas e convulsões.',
        'Conhecer os itens que compõem a caixa de primeiros socorros da patrulha e mantê-la organizada.',
        'Saber agir em casos de hemorragia.',
        '[mar] Arremessar um cabo de retinida com pinha ou boia salva-vidas a 10 metros, utilizando a técnica de lançamento para salvamento, e conhecer as técnicas de natação para salvamento, transporte, reanimação e aquecimento de afogados.'
      ],
      esp:'Babá, Cuidados com Idosos, Maquiagem, Salvamento, Segurança, Segurança e Emergência Náutica, Vigilância Epidemiológica.',
      ou:'Conquistar ao menos uma das seguintes especialidades no nível 2: Anatomia Humana, Prevenção em Saúde, Primeiros Socorros.' },
    { name:'Espiritualidade',
      desc:'Explorar a espiritualidade ao se encantar com a natureza, ser solidário e conhecer diferentes crenças. Procurar viver com sentido e seguir seus princípios todos os dias.',
      fixas:[],
      n:'quatro',
      variaveis:[
        'Fazer reflexões espirituais rotineiras na tropa ou patrulha, ao ar livre.',
        'Apresentar um pequeno relato à patrulha ou tropa sobre os ensinamentos de sua crença ou religião.',
        'Auxiliar na realização de uma celebração de sua comunidade religiosa.',
        'Celebrar sua crença ou religião regularmente.',
        'Colaborar na organização de um culto interconfessional em uma atividade escoteira.',
        'Participar de um momento de reflexão e conexão com um ambiente natural em que possa apreciar e agradecer a beleza do mundo natural.'
      ],
      ou:'Conquistar a especialidade Yoga (nível 2) ou a Insígnia Diálogo Inter-religioso.' },
    { name:'Hábitos Saudáveis',
      desc:'Cuidar da saúde fazendo atividades físicas, comendo de maneira equilibrada, mantendo bons hábitos de higiene e deixando seu espaço sempre limpo e organizado.',
      fixas:[
        'Planejar e executar um cardápio completo e saudável (café da manhã, almoço e jantar) para a patrulha em acampamento.',
        'Conhecer e aplicar normas de limpeza no tratamento e conservação de alimentos nas atividades de patrulha.'
      ],
      n:'três',
      variaveis:[
        'Manter hábitos de higiene pessoal, utilizar o vestuário ou uniforme adequadamente, demonstrando aplicação correta dos distintivos.',
        'Contribuir para manter a sede do grupo e canto de patrulha em ordem e em perfeito estado de conservação.',
        'Montar um cronograma semanal, equilibrando estudos, responsabilidades e momentos de lazer.',
        'Praticar uma atividade física regularmente.',
        'Promover um piquenique com alimentos saudáveis com sua patrulha ou tropa.',
        'Manter adequada rotina de sono e alimentação saudável.',
        'Saber o que são as indicações de rótulos, o que são gorduras saturadas, conservantes, corantes, além dos selos de advertência.',
        'Arrumar e limpar seu quarto e contribuir nas rotinas da casa.'
      ],
      esp:'Artes Marciais, Canoagem, Ciclismo, Corrida de Rua, Culinária Vegetariana, Cuidados Bucais, Dança, Desportos Inclusivos, Esportes de Quadra, Futebol, Ginásticas, Hipismo, Mergulho, Natação, Patinação, Plantas Medicinais, Remo, Skateboard, Slackline, Técnicas Verticais, Tênis, Tênis de Mesa, Tiro com Arco, Triatlo, Vela, Yoga.',
      ou:'Conquistar a especialidade (nível 2) Nutrição.' },
    { name:'Saúde Mental',
      desc:'Adotar atitudes que ajudam a cuidar da sua saúde mental, encontrando formas de lidar com os desafios do dia a dia e colaborar para que todos se sintam bem ao seu redor.',
      fixas:[
        'Conhecer o conceito de Espaços Seguros e aplicá-lo em todas as atividades de sua patrulha ou tropa.',
        'Aprender a identificar sinais de tristeza ou isolamento em colegas e saber como oferecer apoio inicial, como conversar com respeito e buscar ajuda de um adulto de confiança.'
      ],
      n:'duas',
      variaveis:[
        'Participar de uma atividade sobre a importância do autocuidado e da saúde mental.',
        'Conduzir uma sessão de relaxamento como yoga, meditação, caminhadas silenciosas na natureza, alongamentos, entre outras, para sua patrulha ou tropa.',
        'Organizar sua rotina de atividades semanais considerando a importância do equilíbrio entre as atividades do mundo digital e real e realizar uma atividade de bem-estar offline.',
        'Propor momentos de descontração com a família ao ar livre, evitando o uso da tecnologia e compartilhar como foi a experiência.',
        'Participar com sua patrulha de uma atividade que promova o contato com seus sentidos e promova momentos de equilíbrio emocional como por exemplo: uma trilha sensorial, pintura livre, roda de canções, observação de céu ou fogueira, entre outros.'
      ],
      esp:'Aeromodelismo, Canto, Coleções, Cubo Mágico, Dança, Expressão Musical, Ioiô, Jogos de Cartas Colecionáveis, Jogos de Tabuleiro, Mágica e Ilusionismo, Maquiagem, Pipas, Quebra-Cabeças, RPG, Xadrez.',
      ou:'Conquistar a especialidade (nível 2) Prevenção aos Vícios.' },
    { name:'Vínculos Saudáveis',
      desc:'Fazer amizades de um jeito saudável e respeitoso, tratando os outros com empatia, construindo relações positivas no dia a dia.',
      fixas:[
        'Realizar uma campanha para combater o bullying e cyberbullying para a comunidade.'
      ],
      n:'quatro',
      variaveis:[
        'Participar de jogos com a patrulha ou a tropa, respeitando as regras e seus participantes.',
        'Organizar uma atividade de patrulha em sua casa ou na casa de um membro da patrulha.',
        'Ensinar uma canção escoteira a outros escoteiros.',
        'Ajudar outro membro da UEL conquistar uma especialidade ou insígnia.',
        'Propor metas para melhorar a convivência na vida da patrulha e na tropa, compreendendo como todos se sentem quanto a isso.',
        'Participar de uma atividade entre diferentes grupos escoteiros ou atividade regional ou nacional.',
        'Acolher os novos integrantes da patrulha.',
        'Assumir tarefas domésticas para melhorar a convivência em casa.',
        'Participar de uma atividade da tropa com a família ou responsáveis.',
        'Convidar um colega da mesma faixa etária para participar de um Fogo de Conselho, integrado a sua patrulha e com o devido "Registro de Visitante".',
        '[ar] Participar de um torneio de aeromodelos.'
      ],
      ou:'Conquistar a especialidade (nível 2) Prevenção ao Bullying.' }
  ]}
];

// Especialidades citadas na Progressão do Ramo Escoteiro, por eixo (separadas por ";")
const ESCOTEIRO_ESPECIALIDADES = [
  ['Habilidades para a Vida', 'Administração; Aeromodelismo; Arquitetura e Urbanismo; Arte Digital; Artes Visuais; Artesanato; Astronáutica; Astronomia; Biblioteconomia; Cartografia; Comédia; Comunicações; Confeitaria; Construção Civil; Costura e Estilismo; Criptografia; Culinária; Design de Interiores; E-Sports; Educação Financeira; Empreendedorismo; Encadernação; Etiqueta; Ferramentas de Corte; Fiscalização de Pátio de Aeródromo; Fotografia; GPS; Grafite; HQ; Informática; Investimentos; Jornalismo; Manicure; Manutenção Elétrica; Maquete; Marcenaria; Marinharia; Matemática; Mecânica Aérea; Observação Aérea; Oratória; Pintura; Planador; Plastimodelismo; Prevenção de Incêndio; Produção Gráfica; Programação; Propaganda e Marketing; Química; Radioamadorismo; Radioescuta; Redes de Computadores; Reparos Domésticos; Robótica; Segurança e Emergência Náutica; Segurança no Trânsito; Simulação Aérea; Sinalização; Técnica Aeronáutica; Vendas; Videomaker; Web Design'],
  ['Meio Ambiente', 'Acampamento; Agricultura; Animais Venenosos e Peçonhentos; Aquarismo; Aquicultura; Biologia; Botânica; Corrida de Orientação; Cuidados com Animais de Estimação; Culinária Mateira; Energia; Entomologia; Escalada; Espeleoturismo; Excursões; Geologia; Horticultura; Jardinagem; Meliponicultura; Meteorologia; Microbiologia; Montanhismo; Mountain Bike; Oceanologia; Paisagismo; Pesca; Pioneiria; Rastreamento; Sobrevivência; Zoologia'],
  ['Paz e Desenvolvimento', 'Anime; Arqueologia; Arte da Marinharia; Artes Cênicas; Brasilidades; Capoeira; Civilizações da Antiguidade; Cosplay; Culinária Típica; Danças Folclóricas; Defesa Civil; Escotismo Mundial; Fogo de Conselho; Genealogia; Geografia; História Aeroespacial; História Brasileira; História da Arte; História da Aviação; História do Escotismo; História Local; História Marítima; História Mundial; Inclusão; Informações Turísticas; Libras; Línguas; Literatura; Mitologias; Museologia; Origami; Paleontologia; Paz e Justiça; Poesia; Prevenção de Fake News; Tradições dos Povos Originários'],
  ['Saúde e Bem-estar', 'Anatomia Humana; Artes Marciais; Babá; Canoagem; Canto; Ciclismo; Coleções; Corrida de Rua; Cubo Mágico; Cuidados Bucais; Cuidados com Idosos; Culinária Vegetariana; Dança; Desportos Inclusivos; Esportes de Quadra; Expressão Musical; Futebol; Ginásticas; Hipismo; Ioiô; Jogos de Cartas Colecionáveis; Jogos de Tabuleiro; Mágica e Ilusionismo; Maquiagem; Mergulho; Natação; Nutrição; Patinação; Pipas; Plantas Medicinais; Prevenção ao Bullying; Prevenção aos Vícios; Prevenção em Saúde; Primeiros Socorros; Quebra-Cabeças; Remo; RPG; Salvamento; Segurança; Skateboard; Slackline; Técnicas Verticais; Tênis; Tênis de Mesa; Tiro com Arco; Triatlo; Vela; Vigilância Epidemiológica; Xadrez; Yoga']
];

const ESCOTEIRO_INSIGNIAS = [
  ['Habilidades para a Vida', 'Insígnia do Aprender; Insígnia da Modalidade do Mar (Grumete); Insígnia da Modalidade do Ar (Aviador)'],
  ['Meio Ambiente', 'Insígnia Reduzir, Reciclar e Reutilizar; Insígnia Escoteiros pela Energia Solar; Insígnia Campeões da Natureza'],
  ['Paz e Desenvolvimento', 'Insígnia Mensageiros da Paz; Insígnia Ação Comunitária; Insígnia da Lusofonia; Insígnia do Cone Sul; Diálogos pela Paz'],
  ['Saúde e Bem-estar', 'Insígnia Diálogo Inter-religioso']
];

// ---------- Montagem (gera os códigos e o formato usado pelo app) ----------
function ramoSlug(s){
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
function ramoItem(id, raw){
  const m = /^\[(mar|ar)\]\s*/.exec(raw);
  return m ? { id, tag:m[1], text: raw.slice(m[0].length) } : { id, text: raw };
}
function buildRamoData(prefix, acolhida, eixos){
  const out = [];
  if(acolhida && acolhida.length) out.push({
    id: prefix + '-acolhida', eixo:true, name:'Período de Acolhida', sub:'(Antigo "Período Introdutório")', flat:true,
    blocos:[{ id: prefix + '-acolhida-b', items: acolhida.map((t, i)=> ({ id: prefix + '-ac-' + (i+1), text:t })) }]
  });
  eixos.forEach((ex, ei)=>{
    out.push({
      id: prefix + '-eixo' + (ei+1), eixo:true, num:'Eixo ' + (ei+1), name: ex.name,
      blocos: ex.blocos.map((b, bi)=>{
        const base = prefix + '-e' + (ei+1) + 'b' + (bi+1);
        const bloco = { id: base, name:'Bloco ' + (bi+1) + ' — ' + b.name, desc: b.desc };
        if(b.fixas && b.fixas.length) bloco.fixas = b.fixas.map((t, i)=> ramoItem(base + 'f' + (i+1), t));
        bloco.varLabel = b.varLabel || ('Realizar ' + b.n + ' ações dentre as listadas a seguir');
        if(b.varMin) bloco.varMin = b.varMin;
        bloco.variaveis = b.variaveis.map((t, i)=> ramoItem(base + 'v' + (i+1), t));
        if(b.esp) bloco.variaveis.push({ id: base + 'vesp', tag:'esp', text:'Conquistar uma destas especialidades (soma como uma ação variável): ' + b.esp });
        if(b.ou) bloco.ou = { id: base + 'ou', text: b.ou };
        return bloco;
      })
    });
  });
  return out;
}
function buildRamoCatalog(prefix, areas){
  const seen = new Set();
  return areas.map(([name, list], i)=> ({
    id: prefix + '-area' + (i+1), name,
    items: list.split(';').map(s=> s.trim()).filter(Boolean).map(text=> ({ id: prefix + '-' + ramoSlug(text), text }))
      .filter(it=> !seen.has(it.id) && seen.add(it.id))
  }));
}

const DATA_ESCOTEIRO = buildRamoData('esc', ESCOTEIRO_ACOLHIDA, ESCOTEIRO_EIXOS);
const SPECIALTIES_ESCOTEIRO = buildRamoCatalog('esc-sp', ESCOTEIRO_ESPECIALIDADES).map(a=> ({ id:a.id, name:a.name, especialidades:a.items }));
const INSIGNIAS_ESCOTEIRO = buildRamoCatalog('esc-in', ESCOTEIRO_INSIGNIAS);
