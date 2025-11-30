# Apresentação - EcoGrid+
## Sistema de Simulação e Gerenciamento de Redes Elétricas Inteligentes

**Disciplina:** Estrutura de Dados Avançada  
**Duração:** 5 minutos

---

## 📋 Descritivo de Slides

### Slide 1: Introdução - O Problema
**Tempo:** 30 segundos

**Conteúdo:**
- Título: "EcoGrid+: Simulação e Gerenciamento de Redes Elétricas"
- Problema: Gerenciar redes elétricas complexas requer:
  - Balanceamento automático de carga
  - Otimização de rotas de energia
  - Previsão de demanda
  - Simulação de eventos em tempo real
- Solução: Plataforma web que utiliza estruturas de dados avançadas para resolver esses desafios

**Falar:**
"O EcoGrid+ é uma plataforma web desenvolvida para simular e gerenciar redes elétricas inteligentes. O sistema resolve problemas críticos como balanceamento automático de carga, otimização de rotas e previsão de demanda, utilizando estruturas de dados avançadas para garantir eficiência e performance."

---

### Slide 2: O Que o Sistema Resolve
**Tempo:** 45 segundos

**Conteúdo:**
- **Modelagem de Rede Elétrica**
  - Representação como grafo direcionado
  - Nós: Produtores, Consumidores, Subestações, Transmissão
  - Arestas com resistência, capacidade e fluxo

- **Balanceamento Automático de Carga**
  - Detecção de sobrecarga em tempo real
  - Redistribuição inteligente usando algoritmos de roteamento

- **Simulação de Eventos**
  - Processamento de eventos em ordem cronológica
  - Detecção de condições críticas
  - Logs detalhados de operações

- **Previsão de Demanda**
  - Regressão Linear e MLP (Multi-Layer Perceptron)
  - Análise de histórico temporal

- **Persistência e Análise**
  - Armazenamento eficiente de histórico
  - Consultas por intervalo temporal

**Falar:**
"O sistema resolve quatro problemas principais: primeiro, modela a rede elétrica como um grafo, permitindo representar produtores, consumidores e conexões. Segundo, realiza balanceamento automático de carga quando detecta sobrecarga. Terceiro, simula eventos em tempo real processando-os em ordem cronológica. E quarto, prevê demanda futura usando algoritmos de machine learning."

---

### Slide 3: Arquitetura e Estruturas de Dados
**Tempo:** 1 minuto 30 segundos

**Conteúdo:**

**Camada Física:**
- Grafo direcionado (`ElectricalNetworkGraph`)
- Map para armazenamento de nós e arestas
- Cálculo de métricas: eficiência, perdas, consumo

**Camada Lógica - Árvore AVL:**
- Índice AVL para consultas O(log n) por utilização
- Balanceamento automático quando sobrecarga é detectada
- Consultas rápidas: `findNodesAboveUtilization()`, `findNodesBelowUtilization()`

**Estruturas de Dados Implementadas:**
- ✅ **Árvore AVL** - Balanceamento de carga (O(log n))
- ✅ **Árvore B+** - Armazenamento de histórico (range queries eficientes)
- ✅ **Fila FIFO** - Processamento de eventos em ordem cronológica
- ✅ **Heap de Prioridade (MinHeap)** - Eventos críticos por severidade

**Algoritmos de Roteamento:**
- **Dijkstra** - Caminho mínimo considerando resistência
- **A*** - Roteamento heurístico para redistribuição de carga

**Falar:**
"A arquitetura possui duas camadas principais. A camada física usa um grafo direcionado para representar a rede. A camada lógica utiliza uma árvore AVL que indexa nós por utilização, permitindo consultas O(log n) para detectar sobrecarga e encontrar nós subutilizados. Implementamos quatro estruturas de dados fundamentais: AVL para balanceamento, B+ para histórico, FIFO para eventos e Heap para priorização. Os algoritmos Dijkstra e A* são usados para encontrar rotas ótimas de redistribuição."

---

### Slide 4: Tecnologias e Bibliotecas
**Tempo:** 1 minuto

**Conteúdo:**

**Frontend:**
- **Next.js 16** - Framework React com SSR/SSG
- **React 19** - Interface reativa e componentes
- **TypeScript** - Tipagem estática
- **Tailwind CSS 4** - Estilização utilitária
- **Zustand** - Gerenciamento de estado global

**Visualização:**
- **React Flow (@xyflow/react)** - Editor de grafos interativo
- **Recharts** - Gráficos e visualizações de dados
- **Lucide React** - Ícones modernos

**Justificativas:**
- **Next.js**: SSR para performance, API routes integradas
- **TypeScript**: Segurança de tipos para estruturas complexas
- **Zustand**: Estado leve e performático para rede e logs
- **React Flow**: Visualização interativa de grafos
- **Recharts**: Gráficos responsivos para analytics

**Falar:**
"Utilizamos Next.js 16 com React 19 para criar uma interface web moderna e performática. TypeScript garante segurança de tipos para nossas estruturas complexas. Zustand gerencia o estado global de forma leve. React Flow permite edição interativa da rede, e Recharts visualiza métricas e histórico. Todas as estruturas de dados e algoritmos foram implementados do zero, sem bibliotecas externas, demonstrando domínio das estruturas avançadas."

---

### Slide 5: Funcionalidades Principais
**Tempo:** 1 minuto

**Conteúdo:**

**1. Editor de Rede Visual**
- Adicionar/remover nós e conexões
- Configurar capacidade, demanda, resistência
- Visualização interativa do grafo

**2. Simulação de Eventos**
- Processamento FIFO de eventos
- Detecção automática de sobrecarga
- Balanceamento automático via AVL
- Logs detalhados em tempo real

**3. Previsão de Demanda**
- Regressão Linear para tendências
- MLP para padrões complexos
- Visualização de previsões futuras

**4. Analytics e Histórico**
- Armazenamento B+ para consultas eficientes
- Range queries por intervalo temporal
- Visualização de métricas históricas

**5. Benchmarks**
- Comparação de performance das estruturas
- Medição de tempo, memória e operações

**Falar:**
"O sistema oferece cinco funcionalidades principais. O editor visual permite construir a rede interativamente. A simulação processa eventos em ordem cronológica e dispara balanceamento automático quando detecta sobrecarga. O módulo de previsão usa regressão linear e MLP para prever demanda futura. O histórico é armazenado em B+ para consultas eficientes. E benchmarks permitem comparar performance das estruturas implementadas."

---

### Slide 6: Complexidades e Performance
**Tempo:** 30 segundos

**Conteúdo:**

| Operação | Complexidade | Aplicação |
|----------|--------------|-----------|
| Inserção/Busca AVL | O(log n) | Balanceamento de carga |
| Consulta por utilização | O(log n) | Detecção de sobrecarga |
| Balanceamento | O(m log n) | Redistribuição automática |
| Roteamento A* | O(\|E\| log \|V\|) | Caminho ótimo |
| Processamento FIFO | O(1) | Eventos em ordem |
| Range Query B+ | O(log n + k) | Histórico temporal |

**Heurística de Eficiência Global:**
```
E = Σ(Cn * ηn) / Σ(Pn)
```
Onde: Cn = carga, ηn = eficiência, Pn = perdas

**Falar:**
"Todas as operações críticas têm complexidade logarítmica. A AVL garante O(log n) para balanceamento. O A* encontra rotas ótimas em O(E log V). A B+ permite consultas por intervalo em O(log n + k). A heurística de eficiência global calcula a eficiência da rede considerando carga, eficiência e perdas de cada nó."

---

### Slide 7: Conclusão
**Tempo:** 15 segundos

**Conteúdo:**
- ✅ 100% dos requisitos implementados
- ✅ Todas as estruturas de dados avançadas implementadas do zero
- ✅ Sistema funcional e testado
- ✅ Interface web completa e intuitiva
- ✅ Performance otimizada com complexidades logarítmicas

**Falar:**
"O EcoGrid+ demonstra aplicação prática de estruturas de dados avançadas em um problema real. Todas as estruturas foram implementadas do zero, garantindo 100% de conformidade com os requisitos. O sistema está funcional, testado e pronto para uso."

---

## 🎯 Resumo Executivo

### O Que É
Plataforma web para simulação e gerenciamento de redes elétricas inteligentes, utilizando estruturas de dados avançadas para otimização e balanceamento automático.

### Principais Diferenciais
1. **Balanceamento Automático**: AVL integrada para detecção e redistribuição O(log n)
2. **Simulação em Tempo Real**: FIFO e Heap para processamento de eventos
3. **Persistência Eficiente**: B+ para histórico com range queries
4. **Previsão Inteligente**: MLP e Regressão Linear para demanda futura
5. **Interface Moderna**: Next.js + React com visualização interativa

### Estruturas de Dados Implementadas
- **Árvore AVL**: Balanceamento de carga (O(log n))
- **Árvore B+**: Armazenamento de histórico (O(log n + k))
- **Fila FIFO**: Eventos cronológicos (O(1))
- **Heap de Prioridade**: Eventos críticos (O(log n))

### Algoritmos Implementados
- **Dijkstra**: Caminho mínimo (O(E log V))
- **A***: Roteamento heurístico (O(E log V))
- **Regressão Linear**: Previsão de tendências
- **MLP**: Previsão de padrões complexos

### Tecnologias
- **Frontend**: Next.js 16, React 19, TypeScript
- **Estado**: Zustand
- **Visualização**: React Flow, Recharts
- **Estilo**: Tailwind CSS 4

### Status
✅ **100% dos requisitos atendidos**  
✅ **Todas as estruturas implementadas do zero**  
✅ **Sistema funcional e testado**

---

## 📝 Notas para Apresentação

### Dicas de Apresentação
1. **Slide 1**: Foque no problema real que o sistema resolve
2. **Slide 2**: Enfatize a aplicação prática das estruturas
3. **Slide 3**: Destaque a arquitetura em camadas e complexidades
4. **Slide 4**: Justifique cada tecnologia escolhida
5. **Slide 5**: Demonstre as funcionalidades se possível (demo ao vivo)
6. **Slide 6**: Mostre domínio teórico das complexidades
7. **Slide 7**: Reforce a completude da implementação

### Pontos Fortes para Enfatizar
- ✅ Implementação do zero (sem bibliotecas para estruturas de dados)
- ✅ Aplicação prática de teoria (AVL, B+, Heap, FIFO)
- ✅ Complexidades otimizadas (O(log n) em operações críticas)
- ✅ Sistema completo e funcional
- ✅ Interface moderna e intuitiva

### Possíveis Perguntas e Respostas
**Q: Por que AVL e não Red-Black?**  
A: AVL garante balanceamento mais rigoroso, ideal para consultas frequentes de utilização. A diferença de altura máxima é 1, garantindo O(log n) consistente.

**Q: Por que B+ para histórico?**  
A: B+ permite range queries eficientes (O(log n + k)) para consultas temporais, essencial para analytics e previsões baseadas em histórico.

**Q: Como o balanceamento automático funciona?**  
A: A AVL indexa nós por utilização. Quando sobrecarga é detectada (O(log n)), o sistema encontra nós subutilizados (O(log n)) e usa A* para encontrar o melhor caminho de redistribuição.

**Q: Por que Next.js e não React puro?**  
A: Next.js oferece SSR para performance, API routes integradas para backend, e otimizações automáticas. Ideal para aplicações full-stack.

---

## 📊 Estrutura de Tempo Sugerida

| Slide | Tempo | Acumulado |
|-------|-------|-----------|
| 1. Introdução | 30s | 0:30 |
| 2. O Que Resolve | 45s | 1:15 |
| 3. Arquitetura | 1:30 | 2:45 |
| 4. Tecnologias | 1:00 | 3:45 |
| 5. Funcionalidades | 1:00 | 4:45 |
| 6. Complexidades | 30s | 5:15 |
| 7. Conclusão | 15s | 5:30 |

**Total:** ~5 minutos (com margem para transições)

---

## 🎨 Sugestões Visuais

### Slide 1
- Logo/título centralizado
- Imagem de rede elétrica ao fundo (opcional)

### Slide 2
- Lista com ícones para cada funcionalidade
- Diagrama simples de rede elétrica

### Slide 3
- Diagrama de arquitetura em camadas
- Tabela de estruturas de dados com complexidades

### Slide 4
- Logos das tecnologias
- Justificativas em bullets

### Slide 5
- Screenshots da interface
- Diagrama de fluxo de funcionalidades

### Slide 6
- Tabela de complexidades
- Fórmula da heurística destacada

### Slide 7
- Checklist de requisitos
- Status final destacado

