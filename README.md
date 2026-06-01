# Álbum Copa 2026 MVP

Aplicação web para controle de figurinhas do Álbum Copa 2026.

Versão com base por seleções, visual clean e preparação para publicação online do backend.

## Funcionalidades

- Checklist de figurinhas
- Controle de faltantes
- Controle de repetidas
- Base com 48 seleções
- 20 figurinhas por seleção
- Total inicial de 960 figurinhas
- Scanner manual por página/seleção
- Importação CSV
- Exportação CSV
- Frontend estático pronto para GitHub Pages
- Backend .NET 8 pronto para Docker/Render

## Estrutura

```text
backend/   API .NET 8 + SQLite
frontend/  HTML + CSS + JavaScript
```

## Como rodar localmente

### Backend

```bash
cd backend
dotnet restore
dotnet run
```

A API local abre em:

```text
http://localhost:5000
```

### Frontend

Em outro terminal:

```bash
cd frontend
python -m http.server 5500
```

Depois acesse:

```text
http://localhost:5500
```

## Configuração da API no frontend

O frontend lê a URL da API no arquivo:

```text
frontend/config.js
```

Localmente, deixe assim:

```javascript
window.ALBUM_COPA_API_BASE = 'http://localhost:5000/api';
```

Depois que publicar o backend online, troque para a URL do Render, por exemplo:

```javascript
window.ALBUM_COPA_API_BASE = 'https://copa2026-api.onrender.com/api';
```

## Publicar backend no Render

Esta versão inclui um `Dockerfile` na raiz do projeto.

No Render:

1. New +
2. Web Service
3. Conectar o repositório GitHub
4. Escolher o repositório do projeto
5. Runtime: Docker
6. Branch: main
7. Dockerfile path: `./Dockerfile`
8. Criar o serviço

Quando o deploy terminar, o Render vai gerar uma URL parecida com:

```text
https://copa2026-api.onrender.com
```

Teste a API acessando:

```text
https://copa2026-api.onrender.com/api/dashboard
```

## Atualizar o GitHub Pages para usar a API online

Depois que o backend estiver publicado, edite:

```text
frontend/config.js
```

Troque:

```javascript
window.ALBUM_COPA_API_BASE = 'http://localhost:5000/api';
```

por:

```javascript
window.ALBUM_COPA_API_BASE = 'https://SUA-URL-DO-RENDER.onrender.com/api';
```

Depois envie para o GitHub:

```bash
git add .
git commit -m "Configura API online do Render"
git push
```

## Observação sobre SQLite no Render

A versão atual usa SQLite para manter o MVP simples.

Em hospedagens com filesystem efêmero, os dados podem ser recriados quando o serviço reiniciar ou fizer novo deploy.

Para uso definitivo online, o próximo passo recomendado é migrar o backend para PostgreSQL.

## GitHub Pages

Esta versão inclui um `index.html` na raiz que redireciona automaticamente para:

```text
/frontend/
```

Assim, o link principal do GitHub Pages abre o app diretamente.
