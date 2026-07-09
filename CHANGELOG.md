# Changelog

## 1.0.2 — 2026-07-09

## 💠 Aplicação
- Corrigido bug de disponibilidade que não exibia os slots corretamente (conflito entre os campos `days` e `availability` na resposta da API).
- Painel de disponibilidade agora abre dentro do próprio card do médico, em vez de aparecer no fim da página. Só um painel fica aberto por vez.
- Adicionado botão "Gerenciar grade" nos cards de médico, permitindo criar e excluir faixas de horário (schedules) sem sair da página.

## 👤 Agente Thomas
- Adicionado regras que determinam a sugestão de datas somentes aquelas que não passaram.
- Quando o paciente passa pela etapa de triagem, o agente não pede o motivo da consulta na etapa final de agendamento médico.
- Adicionado sons de teclados ao agente realizar algumas requisições na API

## 1.0.1 — 2026-07-08
- Lista de agendamentos agora ordenada por data de criação, mais recentes primeiro.