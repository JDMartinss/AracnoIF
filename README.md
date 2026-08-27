# 🕷️ AracnoIF

O **AracnoIF** é um projeto acadêmico desenvolvido com o objetivo de facilitar a rotina dos estudantes dentro do **Instituto Federal de Educação, Ciência e Tecnologia de São Paulo (IFSP) — Campus Bragança Paulista**.

A aplicação busca auxiliar os alunos na **localização de salas e professores**, oferecendo um sistema de navegação interna pelo campus, além de recursos de comunicação e acesso a informações acadêmicas de forma simples e intuitiva.

O projeto possui uma identidade visual inspirada no universo do **Homem-Aranha**, utilizando essa temática na interface e na experiência do usuário.

## 🎯 Objetivo

Desenvolver uma aplicação capaz de auxiliar os estudantes na localização dentro do campus, permitindo encontrar salas e professores e visualizar uma rota até o destino desejado.

A proposta é transformar as plantas dos diferentes pavimentos do campus em mapas digitais que poderão ser utilizados pelo sistema de navegação do AracnoIF.

## 🗺️ Sistema de localização

O AracnoIF pretende possuir um sistema de **navegação interna (indoor)**.

O funcionamento planejado é:

1. O professor informa no sistema em qual sala está localizado;
2. A localização é armazenada e disponibilizada aos estudantes;
3. O aluno seleciona o professor que deseja encontrar;
4. O AracnoIF identifica o ponto inicial do aluno;
5. O sistema calcula uma rota até a sala informada pelo professor;
6. O mapa apresenta o caminho que o estudante deverá seguir.

Para auxiliar na identificação da posição inicial do estudante dentro do prédio, poderão ser utilizados **QR Codes posicionados em pontos estratégicos do campus**.

Futuramente, outras tecnologias de localização interna poderão ser estudadas.

## 🏢 Mapas do campus

O projeto utilizará as plantas dos **cinco pavimentos do campus** como referência para a construção dos mapas digitais.

Os mapas deverão identificar elementos importantes para a navegação, como:

- Salas de aula;
- Laboratórios;
- Corredores;
- Escadas;
- Elevadores;
- Rampas;
- Banheiros;
- Entradas e saídas;
- Pontos de conexão entre os pavimentos.

Esses elementos serão utilizados posteriormente para calcular as rotas dentro do campus.

## 💡 Funcionalidades planejadas

- 🗺️ Navegação interna pelo campus;
- 📍 Cálculo de rota até salas e professores;
- 📱 Identificação da localização inicial por QR Code;
- 🏢 Visualização dos diferentes pavimentos;
- 👨‍🏫 Visualização e seleção de professores;
- 📌 Professor poderá informar sua localização atual;
- 📚 Informações sobre as matérias de cada professor;
- 💬 Canal de comunicação;
- 🔔 Informações sobre o início das aulas;
- 👤 Cadastro com nome, prontuário e semestre;
- 🕷️ Interface inspirada no Homem-Aranha;
- 🎭 Representação dos professores por personagens/vilões;
- 🕸️ Tela de carregamento com frases temáticas.

## 📁 Organização do projeto

```text
AracnoIF/
├── docs/
│   ├── mapas/
│   │   └── originais/
│   │       ├── 1-andar.jpeg
│   │       ├── 2-andar.jpeg
│   │       ├── 3-andar.jpeg
│   │       ├── 4-andar.jpeg
│   │       └── 5-andar.jpeg
│   │
│   ├── modelagem/
│   │
│   ├── requisitos/
│   │   └── AracnoIF_ListagemRequisitos.pdf
│   │
│   └── prototipos/
│
├── src/
│
├── README.md
└── .gitignore
