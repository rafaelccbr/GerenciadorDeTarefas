<div align="center">

# 📋 Organizador de Tarefas

### *Gerenciador pessoal de tarefas Full Stack com autenticação segura e estética Glassmorphism*

[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Fastify](https://img.shields.io/badge/Fastify-000000?style=for-the-badge&logo=fastify&logoColor=white)](https://www.fastify.io/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)
[![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://render.com/)
[![License MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

</div>

---

## 📖 Sobre o Projeto

O **Organizador de Tarefas** é uma aplicação web Full Stack desenvolvida para proporcionar um controle de rotina e produtividade prático, rápido e visualmente sofisticado.

A aplicação adota a estética visual **Glassmorphism / Liquid Glass**, combinando fundos translúcidos jateados, chanfros luminosos, efeitos de desfoque (*backdrop blur*) e anéis de foco neon violeta, garantindo uma experiência de usuário elegante e responsiva tanto em desktops quanto em dispositivos móveis.

---

## ✨ Principais Funcionalidades

- 🔐 **Autenticação Completa & Segura**:
  - Cadastro de novos usuários com validação em tempo real.
  - Login com geração de tokens JWT seguros.
  - Recuperação de senha por e-mail integrada ao Supabase Auth.
- 📋 **CRUD Completo de Tarefas**:
  - Criação de tarefas com prazos (data de início e de término).
  - Listagem ordenada e isolada por usuário.
  - Edição completa e atualização dinâmica de status.
  - Exclusão com confirmação visual.
- 🏷️ **Controle de Status com Badges**:
  - `Pendente` (Amarelo / Destaque)
  - `Em andamento` (Azul Ciano)
  - `Concluído` (Verde Esmeralda)
- ⚙️ **Gerenciamento de Conta ("Minha Conta")**:
  - Centralizado no badge do usuário com engrenagem animada.
  - Atualização cadastral de **Nome** e **E-mail**.
  - Redefinição de senha com dupla validação.
  - Zona de perigo: exclusão definitiva de conta e tarefas associadas com confirmação textual (`EXCLUIR`).
- 📜 **Termos de Uso e Privacidade**:
  - Modal translúcido com scroll suave e aceite inteligente automatizado.

---

## 🎨 Design & Identidade Visual

A interface foi projetada sob o conceito de **Vidro Translúcido Líquido**:
* **Cards & Modais**: Gradientes profundos de violeta escuro (`#2f0440` a `#1c0228`) com `backdrop-blur-2xl` e chanfro reflexivo (`inset_0_1px_1px_rgba(255,255,255,0.3)`).
* **Botões de Cristal Translúcido**: Acabamento fosco jateado com reflexo superior e *glow* cósmico ao passar o mouse.
* **Inputs de Alto Contraste**: Fundo claro com anel luminoso de foco neon violeta (`focus:ring-4 focus:ring-purple-400/50`).

---

## 🏗️ Arquitetura do Sistema

```mermaid
flowchart TD
    subgraph Cliente ["🌐 Frontend (Vercel)"]
        UI["React 19 + Vite"]
        TW["Tailwind CSS v4"]
        Icons["Lucide Icons"]
    end

    subgraph Servidor ["🚀 Backend (Render)"]
        API["Fastify Server"]
        AuthMid["Middleware JWT & Auth"]
        Routes["Rotas (/auth, /tarefas)"]
    end

    subgraph Nuvem ["☁️ Supabase Cloud"]
        SupaAuth["Supabase Auth (JWT & Senhas)"]
        Postgres[("PostgreSQL Database (RLS)")]
    end

    UI -->|Requisições HTTP / Bearer Token| API
    API --> AuthMid
    AuthMid --> Routes
    Routes -->|Supabase SDK| SupaAuth
    Routes -->|Queries Parametrizadas| Postgres
