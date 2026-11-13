# AracnoIF

Projeto acadêmico desenvolvido para o IFSP Campus Bragança Paulista.

O aplicativo ajuda alunos a consultar aulas, avisos e salas. Professores podem criar turmas, cadastrar horários e publicar avisos.

## Integrantes

- João Diego Martins
- Leonardo Eufrauzino Grego
- Daniel Sacchetti Claret
- Gabriel Rodrigues Nakamura

## Tecnologias

- Vite e React no frontend;
- Flask e Python no backend;
- SQLite como banco de dados;
- CSS e Lucide React na interface.

## Requisitos

Instale no computador:

- Node.js 22 ou superior;
- Python 3.11 ou superior.

Não é necessário usar Docker, MySQL ou XAMPP.

## Instalação

Abra a pasta do projeto no Visual Studio Code.

### 1. Instalar o frontend

Na raiz do projeto:

```bash
npm install
```

### 2. Preparar o backend

Entre na pasta do backend:

```bash
cd backend
python -m venv .venv
```

No Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

No macOS ou Linux:

```bash
source .venv/bin/activate
```

Instale as bibliotecas:

```bash
pip install -r requirements.txt
```

Crie o arquivo `.env`:

```powershell
Copy-Item .env.example .env
```

No macOS ou Linux:

```bash
cp .env.example .env
```

Abra `backend/.env` e defina uma chave em `SECRET_KEY`. Para gerar uma chave:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### 3. Criar o banco

Ainda dentro da pasta `backend`:

```bash
python -m flask --app app:create_app init-db
python -m flask --app app:create_app load-campus
python -m flask --app app:create_app bootstrap-admin
```

Esses comandos criam o SQLite, carregam as salas do campus e cadastram o administrador inicial.

## Como executar

É necessário abrir dois terminais.

No primeiro, dentro de `backend`:

```bash
python -m flask --app app:create_app run --port 5000
```

No segundo, na raiz do projeto:

```bash
npm run dev
```

Abra:

```text
http://localhost:4173
```

O arquivo do banco fica em `backend/aracnoif.db`.

## Acesso inicial

- **E-mail:** `joaodiegomartins21@gmail.com`
- **Senha:** `joaodiegomartins21`

Depois de entrar como administrador, é possível cadastrar alunos, cadastrar professores, liberar professores e vincular alunos às turmas.

## Como usar

### Administrador

1. Entre com o acesso inicial.
2. Cadastre alunos ou professores.
3. Libere professores que solicitaram cadastro.
4. Vincule alunos às turmas.
5. Acompanhe os usuários cadastrados.

### Professor

1. Solicite o cadastro na tela de login ou use uma conta liberada.
2. Escolha um vilão para representar o perfil.
3. Crie uma turma e informe a matéria.
4. Anote o código da turma para os alunos.
5. Cadastre a sala, a data e o horário da aula.
6. Publique avisos ou inicie e encerre a aula.

### Aluno

1. Entre com o prontuário ou e-mail.
2. Use o código recebido para entrar em uma turma.
3. Consulte as aulas do dia ou a agenda completa.
4. Veja a sala e abra o mapa para encontrar o caminho.
5. Acompanhe os avisos da turma.

### Configurações

Na tela de configurações é possível alterar nome, e-mail e foto de perfil. Professores também podem trocar o vilão. O botão **Sair da conta** encerra a sessão.

### Mapa

O mapa possui os cinco pavimentos do campus. É possível pesquisar uma sala, selecionar o pavimento, ampliar a planta e consultar escadas, elevador, rampa e os pavilhões A e B.

## Modo de demonstração

Para testar a interface sem iniciar o Flask, abra `frontend/.env` e use:

```env
VITE_API_MODE=demo
```

Depois execute `npm run dev`. Nesse modo os dados são temporários e são perdidos ao recarregar a página.

## Estrutura do projeto

```text
AracnoIF/
├── frontend/       Interface Vite/React
├── backend/        API Flask, modelos e SQLite
├── docs/           Mapas, protótipos e diagramas
├── package.json    Scripts do projeto
└── README.md       Instalação e uso
```

## Testes

Com o ambiente virtual do backend ativado, na raiz:

```bash
npm run check:all
```

Também é possível executar separadamente:

```bash
npm run build
npm test
npm run check:ui
npm run test:backend
npm run check:backend
```

## Limitações

O mapa é uma representação digital baseada nas plantas e fotos do campus. Ele não usa GPS. Para login e dados persistentes, o Flask precisa estar em execução.

