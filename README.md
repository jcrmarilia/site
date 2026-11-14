# JCR Marília — site da igreja

Site público da Igreja Jesus Cristo é a Resposta (Marília-SP), publicado no Netlify em **https://jcrmarilia.netlify.app**.
Cada atualização enviada para a branch `main` deste repositório vai ao ar sozinha em 1 a 2 minutos.

## Endereços

| Endereço | O que é |
|---|---|
| `/` (também `/bio`) | Página de links para a bio do Instagram |
| `/paginainicial` | Página informativa para membros e visitantes |
| `/hub` | Todos os links da igreja e gerador de QR Code (fora do Google) |
| `/cadastro` | Cadastro de visitantes (público) |
| `/gestao` | Plataforma de gestão da igreja (exige login) |
| `/testes` | Ambiente de testes com dados fictícios (sem login) |
| `/testes/cadastro` | Cadastro de visitante do ambiente de testes |
| `/avaliacoes` | Avaliações deixadas no ambiente de testes (abre dentro da gestão, só administradores) |

## Plataforma de gestão

- **Membros**: cadastro manual ou pelo formulário público, visitantes x frequentantes, arquivamento, exportação.
- **Cultos e presença**: o culto de domingo é criado sozinho toda semana. Na chamada marca-se **só quem faltou ou justificou**; quem não for marcado conta como presente. Lista de faltantes com mensagem pelo WhatsApp.
- **Inativação automática**: frequentante que faltar a todos os cultos por 8 semanas (configurável), sem alteração no cadastro, é arquivado sozinho. Ao restaurar, o período parado não conta.
- **Relatórios** mensais de presença (geral e individual), **financeiro** (entradas, saídas, saldo) e **mensagens programadas** (particular, faltantes, grupo e lista de transmissão, com envio assistido pelo WhatsApp).
- **Equipe e acessos** (Configurações): administrador, tesouraria e equipe (sem financeiro). Senhas com scrypt, sessão em cookie assinado.

### Como funciona por dentro

```
site/                    tudo o que vai ao ar (páginas públicas + painel já compilado em site/gestao e site/testes)
app/                     código-fonte do painel (Vite + React). Compilar: cd app && npm install && npm run build
netlify/functions/api.mjs  API (Netlify Functions): login, dados, cadastro público, testes, avaliações, equipe
netlify/lib/             armazenamento (Netlify Blobs), acesso (login) e regras de dados
shared/regras.mjs        regras de presença, domingos automáticos e inativação (usadas no painel e no servidor)
scripts/servidor-local.mjs  roda o site + API localmente (npm run local)
scripts/testar-regras.mjs   testes das regras
```

Os dados ficam no **Netlify Blobs** do próprio site (sem servidor ou banco externo, sem custo): loja `jcr-dados` (sistema real), `jcr-testes` (ambiente de testes) e `jcr-sistema` (equipe e sessões).

**Primeiro acesso**: em `/gestao`, informe o código de instalação (entregue ao responsável) e crie a conta do administrador. Depois disso o código não serve mais.

## Como atualizar informações do site público

Horários, endereço, redes sociais, eventos, ministérios, liderança e PIX ficam em **`site/assets/igreja.js`**.
