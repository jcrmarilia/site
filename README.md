# JCR Marília — site da igreja

Site público da Igreja Jesus Cristo é a Resposta (Marília-SP), publicado no Netlify em **https://jcrmarilia.netlify.app**.
Cada atualização enviada para a branch `main` deste repositório vai ao ar sozinha em 1 a 2 minutos.

## Endereços

| Endereço | O que é |
|---|---|
| `/` (também `/bio`) | Página de links para a bio do Instagram |
| `/paginainicial` | Página informativa para membros e visitantes: programação, agenda, localização, ministérios, contribuição e redes sociais |
| `/hub` | Todos os links da igreja, inclusive os da equipe, e gerador de QR Code (não aparece no Google) |
| `/cadastro` | Cadastro de visitantes |
| `/gestao` | Gestão da igreja (acesso restrito) |
| `/testes`, `/testes/cadastro`, `/avaliacoes` | Ambiente de testes e avaliações |

`/cadastro`, `/gestao`, `/testes` e `/avaliacoes` são **redirecionamentos** para os sistemas que ainda rodam no endereço original (ChatGPT Sites). Para trocar o destino, edite só o `netlify.toml`. Links e QR Codes já divulgados continuam funcionando.

## Como atualizar informações

Horários, endereço, redes sociais, eventos, ministérios, liderança e PIX ficam todos em **`site/assets/igreja.js`**.
Campos vazios somem do site automaticamente, e eventos com data passada também.

## Estrutura

```
netlify.toml            configuração do Netlify (pasta publicada + redirecionamentos)
site/                   tudo o que vai ao ar
  index.html            página da bio
  paginainicial/        página inicial informativa
  hub/                  central de links + QR Code
  assets/igreja.js      DADOS DA IGREJA (editar aqui)
  assets/comum.js       funções compartilhadas
  assets/jcr.css        estilos compartilhados
```

## Sistema anterior

O portal, o cadastro, a gestão e o ambiente de testes originais foram criados no ChatGPT Sites (Next.js/vinext + Cloudflare D1) e continuam rodando lá, com os dados reais da igreja. O export de 14/11/2026 (HTMLs + código-fonte) fica guardado fora deste repositório, que é público.
