# Movva

Aplicação Quasar + TypeScript para gestão de alunos, agenda de aulas e controle financeiro mensal.

## Funcionalidades

- painel inicial com resumo do dia, indicadores e atalhos;
- cadastro, edição, busca, filtros, inativação e histórico de alunos;
- múltiplos horários recorrentes por aluno;
- agenda diária e semanal com aulas em grupo e alerta de capacidade;
- registro de aulas realizadas, faltas, cancelamentos e remarcações;
- períodos financeiros mensais, entradas, saídas, filtros e vínculo opcional com aluno;
- fechamento mensal com transporte do saldo para o período seguinte;
- preferências de atendimento e categorias financeiras configuráveis;
- persistência offline no `localStorage` do dispositivo.

O projeto inclui dados de demonstração na primeira execução. As alterações são salvas automaticamente no navegador.

## Executar localmente

```bash
npm install
npm run dev
```

## Verificações

```bash
npm run typecheck
npm run lint:check
npm run build
```

O build de produção é gerado em `dist/spa`.
