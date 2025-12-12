# G&P Finance - Instruções de desenvolvimento

Este repositório contém `frontend/` e `backend/` separados. A configuração mínima abaixo garante que ambos possam rodar em portas distintas durante o desenvolvimento.

Requisitos:
- Node.js (v16+ recomendado)

Instalar dependências e rodar ambos os serviços:

Windows (PowerShell):

```
cd frontend; npm install
cd ..\backend; npm install
```

Rodar em desenvolvimento (em terminais separados):

Frontend (porta 3001):

```
cd frontend; npm run dev
```

Backend (porta 5000):

```
cd backend; npm run dev
```

Resumo:
- Frontend de dev: porta 3001 (Vite)
- Backend de dev: porta 5000 (Express)

Execução por clique (Windows)
- Se preferir iniciar clicando em um arquivo no Explorer, use os VBScript criados: `run-frontend.vbs` e `run-backend.vbs` — eles abrem uma janela `cmd` e executam os servidores (mais confiável quando o caminho do projeto contém caracteres especiais como `&`).
- Os arquivos `run-frontend.bat` e `run-backend.bat` também existem; caso não funcionem ao clicar, use os `.vbs` correspondentes.
