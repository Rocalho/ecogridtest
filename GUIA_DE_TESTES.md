# 🧪 Guia de Testes - EcoGrid+

Este guia explica como testar todas as funcionalidades do sistema EcoGrid+, incluindo as implementações de balanceamento automático, heurística de eficiência e AVL como camada lógica.

---

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Instalação e Execução](#instalação-e-execução)
3. [Testes Funcionais](#testes-funcionais)
4. [Testes de Requisitos Implementados](#testes-de-requisitos-implementados)
5. [Verificação de Métricas](#verificação-de-métricas)
6. [Testes via Interface Web](#testes-via-interface-web)
7. [Testes via API](#testes-via-api)

---

## 📦 Pré-requisitos

- **Node.js** versão 18 ou superior
- **npm** ou **yarn** ou **pnpm**
- Navegador web moderno (Chrome, Firefox, Edge)

---

## 🚀 Instalação e Execução

### 1. Instalar Dependências

```bash
npm install
# ou
yarn install
# ou
pnpm install
```

### 2. Executar Servidor de Desenvolvimento

```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
```

### 3. Acessar a Aplicação

Abra seu navegador e acesse:
```
http://localhost:3000
```

A aplicação estará rodando e você verá o dashboard principal.

---

## ✅ Testes Funcionais

### Teste 1: Modelagem da Rede Elétrica

**Objetivo:** Verificar se consegue criar uma rede elétrica com nós e arestas.

**Passos:**
1. Acesse a página **Rede** (Network) na barra lateral
2. Clique em **Adicionar Nó** (+)
3. Preencha os dados:
   - Tipo: Subestação
   - Carga: 50 A
   - Capacidade: 100 A
   - Eficiência: 0.95
4. Adicione mais 2 nós:
   - Nó 2: Transformador, Carga 30A, Capacidade 100A
   - Nó 3: Consumidor, Carga 80A, Capacidade 100A
5. Clique em **Adicionar Aresta** e conecte os nós

**Resultado Esperado:**
- ✅ Nós aparecem no grafo
- ✅ Arestas conectam os nós
- ✅ Dashboard mostra estatísticas atualizadas

---

### Teste 2: Balanceamento Automático de Carga (AVL)

**Objetivo:** Verificar se o balanceamento automático funciona quando um nó fica sobrecarregado.

**Passos:**
1. Na página **Simulação** (Simulation)
2. Crie uma rede com pelo menos 3 nós conectados:
   - Nó A: Capacidade 100A, Carga 95A (sobrecarregado)
   - Nó B: Capacidade 100A, Carga 20A (subutilizado)
   - Nó C: Capacidade 100A, Carga 30A (subutilizado)
3. Adicione um evento de sobrecarga:
   - Clique em **Adicionar Evento**
   - Tipo: `overload`
   - Nó: Nó A
   - Multiplicador: 1.1
4. Execute a simulação clicando em **Executar Ciclo**

**Resultado Esperado:**
- ✅ Sistema detecta sobrecarga do Nó A (>90% utilização)
- ✅ Logs mostram: "Balanceamento automático AVL: X redistribuições realizadas"
- ✅ Carga é redistribuída do Nó A para Nós B e C
- ✅ Logs mostram ganho de eficiência
- ✅ Nó A fica com carga abaixo de 90%

**Logs Esperados:**
```
✅ Balanceamento automático AVL: 2 redistribuições realizadas
  → Redistribuído 10.00A de node-A para node-B via 1 saltos
  → Redistribuído 5.00A de node-A para node-C via 2 saltos
✅ Ganho de eficiência: +2.45%
```

---

### Teste 3: Heurística de Eficiência Global

**Objetivo:** Verificar se a fórmula de eficiência global está sendo calculada corretamente.

**Passos:**
1. Na página **Dashboard** (Painel)
2. Observe o KPI **Eficiência Global**
3. Adicione nós com diferentes eficiências:
   - Nó 1: Carga 50A, Eficiência 0.95, Perda = 50 * (1-0.95) = 2.5A
   - Nó 2: Carga 30A, Eficiência 0.90, Perda = 30 * (1-0.90) = 3.0A
4. A fórmula aplicada: `E = Σ(Cn * ηn) / Σ(Pn)`
   - `Σ(Cn * ηn) = 50*0.95 + 30*0.90 = 47.5 + 27 = 74.5`
   - `Σ(Pn) = 2.5 + 3.0 = 5.5`
   - `E = 74.5 / 5.5 = 13.54`

**Resultado Esperado:**
- ✅ Eficiência global é calculada conforme fórmula especificada
- ✅ Valor considera perdas (Pn) de cada nó
- ✅ Valor é atualizado quando carga/eficiência muda

**Verificação Manual:**
Calcule manualmente e compare com o valor exibido no dashboard.

---

### Teste 4: Consultas AVL (Camada Lógica)

**Objetivo:** Verificar se as consultas AVL estão funcionando com O(log n).

**Passos:**
1. Crie uma rede com 10 nós com diferentes cargas/utilizações
2. Na página **Simulação**, execute um ciclo
3. O sistema usa internamente:
   ```typescript
   // Consultas O(log n) via AVL
   graph.findNodesAboveUtilization(0.9)  // Nós sobrecarregados
   graph.findNodesBelowUtilization(0.9)  // Nós subutilizados
   ```

**Resultado Esperado:**
- ✅ Sistema encontra nós sobrecarregados rapidamente
- ✅ Sistema encontra nós subutilizados para redistribuição
- ✅ Balanceamento funciona mesmo com muitos nós

**Como Verificar:**
- Execute com diferentes números de nós (5, 10, 20, 50)
- Observe que o tempo de resposta permanece rápido (O(log n))

---

### Teste 5: Simulação de Eventos (FIFO + Heap)

**Objetivo:** Verificar processamento de eventos em ordem cronológica e por prioridade.

**Passos:**
1. Na página **Simulação**, adicione múltiplos eventos:
   - Evento 1: `demand_change` - Nó A, Demanda 60A
   - Evento 2: `overload` - Nó B, Multiplicador 1.5
   - Evento 3: `node_failure` - Nó C
2. Observe as filas:
   - **FIFO Queue:** Eventos em ordem cronológica
   - **Priority Heap:** Eventos críticos (severity 0) primeiro
3. Execute ciclos de simulação

**Resultado Esperado:**
- ✅ Eventos são processados em ordem FIFO (primeiro a entrar, primeiro a sair)
- ✅ Eventos críticos são priorizados no heap
- ✅ Logs mostram ordem de processamento
- ✅ Balanceamento automático é disparado para eventos críticos

---

### Teste 6: Algoritmo de Roteamento (A* e Dijkstra)

**Objetivo:** Verificar se os algoritmos de roteamento encontram caminhos eficientes.

**Passos:**
1. Crie uma rede com múltiplos caminhos entre dois nós:
   - Nó A → Nó B (resistência 2)
   - Nó A → Nó C → Nó B (resistência 1 + 1 = 2)
   - Nó A → Nó D → Nó E → Nó B (resistência 0.5 + 0.5 + 0.5 = 1.5)
2. Durante o balanceamento, o sistema usa A* para encontrar melhor caminho
3. Verifique nos logs o caminho escolhido

**Resultado Esperado:**
- ✅ A* escolhe o caminho com menor custo total (resistência)
- ✅ Caminho é exibido nos logs: "via X saltos"
- ✅ Redistribuição considera o caminho ótimo

---

## 🎯 Testes de Requisitos Implementados

### Teste A: Estruturas de Dados

#### AVL Tree
- ✅ Verificar se inserções mantêm árvore balanceada
- ✅ Verificar se buscas são O(log n)
- **Como testar:** Via benchmarks na página Analytics

#### B+ Tree
- ✅ Verificar persistência de histórico
- ✅ Verificar consultas por range
- **Como testar:** Adicione dados históricos e consulte por período

#### FIFO Queue
- ✅ Verificar ordem de processamento
- **Como testar:** Adicione múltiplos eventos e veja ordem nos logs

#### Priority Heap
- ✅ Verificar priorização por severidade
- **Como testar:** Adicione eventos com severidades diferentes (0, 1, 2)

---

### Teste B: Algoritmos de Previsão

**Página:** Previsão (Prediction)

**Teste:**
1. Adicione dados históricos de consumo
2. Selecione modelo (Regressão Linear ou MLP)
3. Execute previsão
4. Verifique:
   - ✅ Previsão é gerada
   - ✅ Margem de erro é exibida
   - ✅ Risco de sobrecarga é calculado

---

### Teste C: Benchmarks

**Página:** Analytics → Benchmarks

**Teste:**
1. Execute benchmarks para:
   - AVL Tree (10³, 10⁴, 10⁵ nós)
   - B+ Tree (10³, 10⁴, 10⁵ nós)
   - Dijkstra (grafos de diferentes tamanhos)
   - A* (grafos de diferentes tamanhos)
2. Verifique:
   - ✅ Tempo de execução aumenta logaritmicamente (O(log n))
   - ✅ Operações contadas estão corretas
   - ✅ Uso de memória é razoável

**Resultado Esperado:**
- AVL: Tempo cresce logaritmicamente conforme número de nós
- B+: Tempo cresce logaritmicamente conforme número de nós
- Dijkstra/A*: Tempo cresce como O(|E| log |V|)

---

## 📊 Verificação de Métricas

### Dashboard Principal

**Métricas Exibidas:**
1. **Eficiência Global**
   - Fórmula: `E = Σ(Cn * ηn) / Σ(Pn)`
   - Atualizada automaticamente

2. **Perdas Totais**
   - Soma de perdas em arestas e nós
   - Calculada em tempo real

3. **Consumo Total**
   - Soma de demanda de todos os consumidores
   - Atualizada quando carga muda

4. **Estatísticas da Rede**
   - Total de nós
   - Conexões
   - Nós sobrecarregados (≥90%)
   - Nós com atenção (≥75%)

---

## 🌐 Testes via Interface Web

### Página: Dashboard (Painel)

**Funcionalidades:**
- ✅ Visualização de KPIs
- ✅ Gráfico mini da rede
- ✅ Logs recentes

**Como testar:**
1. Adicione/remova nós na página Rede
2. Volte ao Dashboard
3. Verifique se métricas foram atualizadas

---

### Página: Rede (Network)

**Funcionalidades:**
- ✅ Criação de nós (Subestação, Transformador, Consumidor)
- ✅ Criação de arestas (conexões)
- ✅ Edição de propriedades
- ✅ Visualização gráfica

**Como testar:**
1. Adicione 5 nós
2. Conecte-os formando uma topologia
3. Clique em um nó para ver detalhes
4. Modifique carga/capacidade
5. Verifique cores mudam conforme utilização

---

### Página: Simulação (Simulation)

**Funcionalidades:**
- ✅ Adição de eventos
- ✅ Execução de ciclos
- ✅ Visualização de filas (FIFO + Heap)
- ✅ Logs detalhados
- ✅ **Balanceamento automático integrado**

**Como testar:**
1. Carregue uma rede existente
2. Adicione evento de sobrecarga
3. Execute ciclo
4. Verifique logs de balanceamento automático
5. Verifique se carga foi redistribuída

**Cenário de Teste Completo:**
```
1. Criar rede:
   - Nó 1: 100A capacidade, 95A carga (sobrecarregado)
   - Nó 2: 100A capacidade, 20A carga
   - Nó 3: 100A capacidade, 30A carga
   - Conectar Nó 1 → Nó 2 → Nó 3

2. Adicionar evento: overload no Nó 1 (multiplier 1.05)

3. Executar ciclo

4. Verificar:
   ✅ Nó 1 detectado como sobrecarregado
   ✅ Balanceamento automático executado
   ✅ Carga redistribuída para Nós 2 e 3
   ✅ Ganho de eficiência calculado
   ✅ Logs mostram detalhes da redistribuição
```

---

### Página: Previsão (Prediction)

**Funcionalidades:**
- ✅ Visualização de histórico
- ✅ Treinamento de modelos (Regressão Linear, MLP)
- ✅ Previsões futuras
- ✅ Métricas de erro

**Como testar:**
1. Adicione dados históricos (via API ou simulação)
2. Selecione período para treinar modelo
3. Treine modelo (Regressão Linear ou MLP)
4. Gere previsão para período futuro
5. Verifique gráfico de previsão vs histórico

---

### Página: Analytics

**Funcionalidades:**
- ✅ Execução de benchmarks
- ✅ Comparação de algoritmos
- ✅ Análise de complexidade

**Como testar:**
1. Execute benchmark AVL com tamanhos diferentes
2. Execute benchmark B+ Tree
3. Execute benchmark Dijkstra
4. Execute benchmark A*
5. Compare resultados e verifique complexidades O(log n) e O(|E| log |V|)

---

## 🔌 Testes via API

### Endpoint: `/api/network`

**GET:** Listar nós da rede
```bash
curl http://localhost:3000/api/network
```

**POST:** Adicionar nó
```bash
curl -X POST http://localhost:3000/api/network/node \
  -H "Content-Type: application/json" \
  -d '{
    "type": "consumer",
    "capacity": 100,
    "demand": 50,
    "status": "active"
  }'
```

---

### Endpoint: `/api/simulation/run`

**POST:** Executar ciclo de simulação
```bash
curl -X POST http://localhost:3000/api/simulation/run \
  -H "Content-Type: application/json"
```

**Resposta esperada:**
```json
{
  "graph": { ... },
  "metrics": {
    "losses": 10.5,
    "efficiency": 92.3,
    "consumption": 150
  },
  "logs": [
    {
      "timestamp": "2024-...",
      "level": "success",
      "message": "Balanceamento automático AVL: 2 redistribuições realizadas"
    }
  ],
  "pendingEvents": {
    "fifo": 0,
    "heap": 1
  }
}
```

---

### Endpoint: `/api/predict`

**POST:** Gerar previsão
```bash
curl -X POST http://localhost:3000/api/predict \
  -H "Content-Type: application/json" \
  -d '{
    "historical": [
      {"timestamp": 1000, "consumo": 50},
      {"timestamp": 2000, "consumo": 55}
    ],
    "model": "linear"
  }'
```

---

## ✅ Checklist de Testes

Use este checklist para garantir que tudo está funcionando:

### Estruturas de Dados
- [ ] AVL Tree mantém balanceamento após inserções
- [ ] B+ Tree persiste dados corretamente
- [ ] FIFO Queue processa eventos em ordem
- [ ] Priority Heap prioriza por severidade

### Funcionalidades Principais
- [ ] Criação de rede elétrica (nós + arestas)
- [ ] Simulação de eventos
- [ ] Balanceamento automático de carga
- [ ] Cálculo de eficiência global correto
- [ ] Previsão de demanda
- [ ] Benchmarks funcionando

### Integrações
- [ ] AVL integrada como camada lógica
- [ ] Balanceamento usa consultas AVL O(log n)
- [ ] Balanceamento usa A* para roteamento
- [ ] Simulação dispara balanceamento automático
- [ ] Logs detalhados de todas as operações

### Interface Web
- [ ] Dashboard exibe métricas corretas
- [ ] Editor de rede funcional
- [ ] Simulação com visualização de filas
- [ ] Gráficos de previsão e histórico
- [ ] Analytics com benchmarks

---

## 🐛 Troubleshooting

### Problema: Balanceamento não é executado

**Possíveis causas:**
1. Nenhum nó está acima de 90% utilização
2. Não há nós subutilizados disponíveis
3. Não há caminho viável entre nós

**Solução:**
- Verifique logs da simulação
- Garanta que há nós com diferentes utilizações
- Verifique se há caminho conectando nós sobrecarregados e subutilizados

---

### Problema: Eficiência Global não atualiza

**Solução:**
- Recarregue a página
- Verifique se há nós com eficiência definida
- Verifique se há perdas calculadas (Pn > 0)

---

### Problema: Erro ao executar simulação

**Solução:**
- Verifique se há nós na rede
- Verifique se eventos estão corretamente formatados
- Veja logs do console do navegador (F12)

---

## 📝 Exemplos Práticos

### Exemplo 1: Teste Completo de Balanceamento

```javascript
// 1. Criar rede
POST /api/network/node
{
  "type": "consumer",
  "capacity": 100,
  "demand": 95,  // 95% utilização (sobrecarregado)
  "name": "Nó A"
}

POST /api/network/node
{
  "type": "consumer",
  "capacity": 100,
  "demand": 20,  // 20% utilização
  "name": "Nó B"
}

POST /api/network/edge
{
  "origin": "Nó A",
  "destination": "Nó B",
  "resistance": 1,
  "capacity": 100
}

// 2. Adicionar evento de sobrecarga
POST /api/simulation/event
{
  "type": "overload",
  "payload": {
    "nodeId": "Nó A",
    "multiplier": 1.05
  },
  "severity": 0
}

// 3. Executar simulação
POST /api/simulation/run

// 4. Verificar resultado
// Deve mostrar:
// - Balanceamento automático executado
// - Carga redistribuída de Nó A para Nó B
// - Ganho de eficiência calculado
```

---

### Exemplo 2: Teste de Eficiência Global

```javascript
// Nós com diferentes eficiências
Nó 1: Carga = 50A, Eficiência = 0.95, Perda = 2.5A
Nó 2: Carga = 30A, Eficiência = 0.90, Perda = 3.0A

// Cálculo esperado:
Σ(Cn * ηn) = 50*0.95 + 30*0.90 = 47.5 + 27 = 74.5
Σ(Pn) = 2.5 + 3.0 = 5.5
E = 74.5 / 5.5 = 13.54

// Verificar no dashboard se valor está correto
```

---

## 🎓 Validação dos Requisitos

### Requisito 1: Balanceamento Automático AVL
- ✅ **Implementado em:** `lib/balance/loadBalancer.ts`
- ✅ **Como testar:** Execute simulação com nós sobrecarregados
- ✅ **Resultado esperado:** Redistribuição automática de carga

### Requisito 2: Heurística de Eficiência Global
- ✅ **Implementado em:** `lib/utils/networkMetrics.ts`
- ✅ **Como testar:** Crie nós com diferentes eficiências e compare cálculo
- ✅ **Resultado esperado:** `E = Σ(Cn * ηn) / Σ(Pn)`

### Requisito 3: AVL como Camada Lógica
- ✅ **Implementado em:** `lib/graph/index.ts`
- ✅ **Como testar:** Verifique que consultas são rápidas mesmo com muitos nós
- ✅ **Resultado esperado:** Consultas O(log n) funcionando

---

## 📚 Recursos Adicionais

- **Documentação de Implementação:** `IMPLEMENTACAO_COMPLETA.md`
- **Análise de Requisitos:** `ANALISE_REQUISITOS.md`
- **Código Fonte:** Ver arquivos em `lib/balance/`, `lib/graph/`, `lib/simulation/`

---

## ✨ Conclusão

Seguindo este guia, você conseguirá testar todas as funcionalidades do EcoGrid+ e verificar que os requisitos estão implementados corretamente.

**Dica:** Comece pelos testes funcionais básicos e depois avance para testes mais complexos de integração.

**Status:** ✅ Sistema pronto para testes e validação!

